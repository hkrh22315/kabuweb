#!/bin/bash

# エラーが出たら止まる設定
set -e

echo "🚀 ビルドプロセスを開始します..."
echo ""

# 1. クリーンアップスクリプトを実行
if [ -f "cleanup-build.sh" ]; then
    echo "📋 ステップ1/4: クリーンアップを実行中..."
    chmod +x cleanup-build.sh
    ./cleanup-build.sh
    echo ""
else
    echo "⚠️  cleanup-build.shが見つかりません。スキップします。"
    echo ""
fi

# 2. フロントエンドのビルド
echo "📋 ステップ2/4: フロントエンドをビルド中..."
cd frontend

# 依存関係がインストールされていない場合のエラー対策
if [ ! -d "node_modules" ]; then
    echo "📦 初回のため npm install を実行します..."
    npm install
fi

npm run build

if [ ! -d "dist" ]; then
    echo "❌ エラー: フロントエンドのビルドに失敗しました。distフォルダが見つかりません。"
    exit 1
fi

echo "✅ フロントエンドのビルドが完了しました"
cd ..
echo ""

# 3. フロントエンドのビルド成果物をSpring Bootのstaticディレクトリにコピー
echo "📋 ステップ3/4: ビルド成果物をコピー中..."

# コピー先のフォルダパス
DEST_DIR="src/main/resources/static"

# コピー先フォルダがなければ作成
mkdir -p "$DEST_DIR"

# 古いファイルを削除
if [ -d "$DEST_DIR" ] && [ "$(ls -A $DEST_DIR)" ]; then
    echo "🗑️  古いファイルを削除中..."
    rm -rf "$DEST_DIR"/*
fi

# 新しいファイル(distの中身)をコピー
echo "📂 distフォルダの中身をstaticへコピー中..."
cp -r frontend/dist/* "$DEST_DIR/"

echo "✅ コピーが完了しました"
echo ""

# 4. バックエンドのビルド
echo "📋 ステップ4/4: バックエンドをビルド中..."

# Maven Wrapperを使用してビルド
if [ -f "mvnw" ]; then
    chmod +x mvnw
    ./mvnw clean package -DskipTests
else
    mvn clean package -DskipTests
fi

if [ ! -f "target/kabuweb-0.0.1-SNAPSHOT.jar" ]; then
    echo "❌ エラー: バックエンドのビルドに失敗しました。JARファイルが見つかりません。"
    exit 1
fi

echo "✅ バックエンドのビルドが完了しました"
echo ""

# 5. ビルド成果物のサイズを表示
echo "📊 ビルド成果物のサイズ:"
ls -lh target/*.jar 2>/dev/null || echo "JARファイルが見つかりません"
echo ""

# 6. ディスク使用量を表示
echo "💾 現在のディスク使用量:"
df -h . | tail -1
echo ""

echo "✅ すべてのビルドプロセスが完了しました！"
echo "👉 JARファイルは target/kabuweb-0.0.1-SNAPSHOT.jar にあります"
