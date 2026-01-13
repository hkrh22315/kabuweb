# エラーが出たら止まる設定
$ErrorActionPreference = "Stop"

# ★ここを修正しました
$reactDir = "frontend"

Write-Host "🚀 ビルドを開始します..."

# 1. frontendフォルダに移動して npm run build を実行
Push-Location $reactDir
try {
    # 依存関係がインストールされていない場合のエラー対策
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 初回のため npm install を実行します..."
        npm install
    }
    npm run build
}
finally {
    # 元の場所に戻る
    Pop-Location
}

# 2. コピー先のフォルダパス (Spring Bootのstatic)
$destDir = "src/main/resources/static"

# コピー先フォルダがなければ作成
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

# 3. 古いファイルを削除
if (Test-Path "$destDir\*") {
    Write-Host "🗑️  古いファイルを削除中..."
    Remove-Item "$destDir\*" -Recurse -Force
}

# 4. 新しいファイル(distの中身)をコピー
$sourceDir = "$reactDir\dist\*"

# distフォルダがあるか確認
if (-not (Test-Path "$reactDir\dist")) {
    Write-Error "❌ ビルドに失敗したようです。distフォルダが見つかりません。"
}

Write-Host "📂 distフォルダの中身をstaticへコピー中..."
Copy-Item $sourceDir -Destination $destDir -Recurse -Force

Write-Host "✅ 完了しました！"
Write-Host "👉 ブラウザ( http://localhost:8080 )をリロードしてください。"