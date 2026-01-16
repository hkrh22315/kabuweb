#!/bin/bash

# エラーが出たら止まる設定
set -e

echo "🚨 緊急クリーンアップを開始します..."
echo "💾 現在のディスク使用量:"
df -h . | tail -1
echo ""

# 1. Mavenのtargetディレクトリを削除
if [ -d "target" ]; then
    echo "📦 Maven targetディレクトリを削除中..."
    rm -rf target
    echo "✅ targetディレクトリを削除しました"
fi

# 2. フロントエンドのnode_modulesとdistを削除
if [ -d "frontend/node_modules" ]; then
    echo "📦 フロントエンドのnode_modulesを削除中..."
    rm -rf frontend/node_modules
    echo "✅ node_modulesを削除しました"
fi

if [ -d "frontend/dist" ]; then
    echo "📦 フロントエンドのdistディレクトリを削除中..."
    rm -rf frontend/dist
    echo "✅ distディレクトリを削除しました"
fi

# 3. Maven依存関係キャッシュの古いアーティファクトを削除
if [ -d "$HOME/.m2/repository" ]; then
    echo "📦 Maven依存関係キャッシュをクリーンアップ中..."
    # 古いスナップショットを削除
    find $HOME/.m2/repository -type d -name "*-SNAPSHOT" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    # 空のディレクトリを削除
    find $HOME/.m2/repository -type d -empty -delete 2>/dev/null || true
    echo "✅ Mavenキャッシュをクリーンアップしました"
fi

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

# 6. システム全体のクリーンアップ（aptキャッシュなど）
echo "📦 システムのaptキャッシュをクリーンアップ中..."
sudo apt-get clean 2>/dev/null || true
sudo apt-get autoclean 2>/dev/null || true
echo "✅ aptキャッシュをクリーンアップしました"

# 7. 古いカーネルを削除（容量が大きい場合がある）
echo "📦 未使用のカーネルを確認中..."
OLD_KERNELS=$(dpkg -l | grep -E 'linux-image-[0-9]' | grep -v $(uname -r) | awk '{print $2}' | head -2)
if [ ! -z "$OLD_KERNELS" ]; then
    echo "  未使用のカーネルが見つかりました: $OLD_KERNELS"
    echo "  削除するには: sudo apt-get purge $OLD_KERNELS"
else
    echo "  未使用のカーネルは見つかりませんでした"
fi

# 8. Dockerのクリーンアップ（Dockerがインストールされている場合）
if command -v docker &> /dev/null; then
    echo "📦 Dockerの未使用リソースをクリーンアップ中..."
    docker system prune -f 2>/dev/null || true
    echo "✅ Dockerリソースをクリーンアップしました"
fi

# 9. ディスク使用量を表示
echo ""
echo "💾 クリーンアップ後のディスク使用量:"
df -h . | tail -1

# 10. 大きなディレクトリを表示
echo ""
echo "📊 大きなディレクトリ（上位10個）:"
du -h --max-depth=1 . 2>/dev/null | sort -hr | head -10

echo ""
echo "✅ 緊急クリーンアップが完了しました！"
