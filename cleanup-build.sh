#!/bin/bash

# エラーが出たら止まる設定
set -e

echo "🧹 ビルド前のクリーンアップを開始します..."

# 1. Mavenのtargetディレクトリを削除
if [ -d "target" ]; then
    echo "📦 Maven targetディレクトリを削除中..."
    rm -rf target
    echo "✅ targetディレクトリを削除しました"
fi

# 2. フロントエンドのnode_modulesとdistを削除（オプション）
# コメントアウトを外すと、node_modulesも削除されます（再インストールが必要になります）
# if [ -d "frontend/node_modules" ]; then
#     echo "📦 フロントエンドのnode_modulesを削除中..."
#     rm -rf frontend/node_modules
#     echo "✅ node_modulesを削除しました"
# fi

if [ -d "frontend/dist" ]; then
    echo "📦 フロントエンドのdistディレクトリを削除中..."
    rm -rf frontend/dist
    echo "✅ distディレクトリを削除しました"
fi

# 3. Maven依存関係キャッシュの古いアーティファクトを削除（オプション）
# 注意: これにより次回のビルドが少し遅くなる可能性があります
# コメントアウトを外すと、Mavenキャッシュをクリーンアップします
# if [ -d "$HOME/.m2/repository" ]; then
#     echo "📦 Maven依存関係キャッシュをクリーンアップ中..."
#     mvn dependency:purge-local-repository -DactTransitively=false -DreResolve=false || true
#     echo "✅ Mavenキャッシュをクリーンアップしました"
# fi

# 4. 一時ファイルとログファイルを削除
echo "📦 一時ファイルとログファイルを削除中..."
find . -type f -name "*.log" -not -path "./.git/*" -delete 2>/dev/null || true
find . -type f -name "*.tmp" -not -path "./.git/*" -delete 2>/dev/null || true
find . -type d -name ".DS_Store" -exec rm -rf {} + 2>/dev/null || true

# 5. Spring Bootのstaticディレクトリをクリーンアップ
if [ -d "src/main/resources/static" ]; then
    echo "📦 Spring Bootのstaticディレクトリをクリーンアップ中..."
    rm -rf src/main/resources/static/*
    echo "✅ staticディレクトリをクリーンアップしました"
fi

# 6. ディスク使用量を表示
echo ""
echo "💾 現在のディスク使用量:"
df -h . | tail -1

echo ""
echo "✅ クリーンアップが完了しました！"
