# 開発環境専用ビルドスクリプト
# フロントエンドとバックエンドの変更を開発環境に適用します
# 
# 注意: このスクリプトは開発環境専用です
# 本番用URLの表示や本番環境向けの設定は含めないでください

# エラーハンドリング設定
$ErrorActionPreference = "Stop"

# 色付き出力用の関数
function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Yellow
}

# パスの設定
$projectRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$frontendDir = Join-Path $projectRoot "frontend"
$staticDir = Join-Path $projectRoot "src\main\resources\static"
$distDir = Join-Path $frontendDir "dist"

Write-Info "プロジェクトルート: $projectRoot"
Write-Info "フロントエンドディレクトリ: $frontendDir"
Write-Info "静的リソースディレクトリ: $staticDir"

# 開始時刻を記録
$startTime = Get-Date

try {
    # ========================================
    # ステップ1: フロントエンドビルド
    # ========================================
    Write-Step "ステップ1: フロントエンドのビルドを開始します"
    
    if (-not (Test-Path $frontendDir)) {
        throw "フロントエンドディレクトリが見つかりません: $frontendDir"
    }
    
    Push-Location $frontendDir
    
    # npmがインストールされているか確認
    try {
        $npmVersion = npm --version
        Write-Info "npm バージョン: $npmVersion"
    } catch {
        throw "npmがインストールされていないか、PATHに含まれていません"
    }
    
    # node_modulesが存在するか確認
    if (-not (Test-Path "node_modules")) {
        Write-Info "node_modulesが見つかりません。npm installを実行します..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm installが失敗しました"
        }
    }
    
    # ビルド実行
    Write-Info "npm run buildを実行中..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "フロントエンドのビルドが失敗しました"
    }
    
    if (-not (Test-Path $distDir)) {
        throw "ビルド成果物ディレクトリが見つかりません: $distDir"
    }
    
    Write-Success "フロントエンドのビルドが完了しました"
    
    Pop-Location
    
    # ========================================
    # ステップ2: 静的リソースのコピー
    # ========================================
    Write-Step "ステップ2: 静的リソースをコピーします"
    
    # 静的リソースディレクトリが存在するか確認
    $staticParentDir = Split-Path $staticDir -Parent
    if (-not (Test-Path $staticParentDir)) {
        Write-Info "静的リソースの親ディレクトリを作成します: $staticParentDir"
        New-Item -ItemType Directory -Path $staticParentDir -Force | Out-Null
    }
    
    # 既存の静的リソースを削除（存在する場合）
    if (Test-Path $staticDir) {
        Write-Info "既存の静的リソースを削除中..."
        Remove-Item -Path $staticDir -Recurse -Force
    }
    
    # 静的リソースディレクトリを作成
    New-Item -ItemType Directory -Path $staticDir -Force | Out-Null
    
    # ビルド成果物をコピー
    Write-Info "ビルド成果物をコピー中: $distDir -> $staticDir"
    Copy-Item -Path "$distDir\*" -Destination $staticDir -Recurse -Force
    
    # コピー結果を確認
    $copiedFiles = (Get-ChildItem -Path $staticDir -Recurse -File).Count
    Write-Success "静的リソースのコピーが完了しました ($copiedFiles ファイル)"
    
    # ========================================
    # ステップ3: バックエンドビルド
    # ========================================
    Write-Step "ステップ3: バックエンドのビルドを開始します"
    
    Push-Location $projectRoot
    
    # Maven Wrapperが存在するか確認
    $mvnwCmd = Join-Path $projectRoot "mvnw.cmd"
    $mvnCmd = "mvn"
    
    if (Test-Path $mvnwCmd) {
        Write-Info "Maven Wrapperを使用します"
        $mvnCommand = ".\mvnw.cmd"
    } else {
        Write-Info "Maven Wrapperが見つかりません。システムのMavenを使用します"
        # Mavenがインストールされているか確認
        try {
            $mvnVersion = & $mvnCmd --version 2>&1 | Select-Object -First 1
            Write-Info "Maven: $mvnVersion"
        } catch {
            throw "Mavenがインストールされていないか、PATHに含まれていません"
        }
        $mvnCommand = $mvnCmd
    }
    
    # Mavenビルド実行（テストをスキップ）
    Write-Info "Mavenビルドを実行中（テストスキップ）..."
    & $mvnCommand clean package -DskipTests
    
    if ($LASTEXITCODE -ne 0) {
        throw "バックエンドのビルドが失敗しました"
    }
    
    Write-Success "バックエンドのビルドが完了しました"
    
    Pop-Location
    
    # ========================================
    # 完了
    # ========================================
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Step "すべての処理が正常に完了しました"
    Write-Success "実行時間: $($duration.TotalSeconds.ToString('F2')) 秒"
    Write-Info "`n次のステップ:"
    Write-Info "  - Spring Bootアプリケーションを起動してください"
    Write-Info "  - 例: java -jar target\kabuweb-0.0.1-SNAPSHOT.jar"
    Write-Info "  - または: .\mvnw.cmd spring-boot:run"
    
} catch {
    Write-Error-Custom "`nエラーが発生しました:"
    Write-Error-Custom $_.Exception.Message
    Write-Error-Custom "`nスタックトレース:"
    Write-Error-Custom $_.ScriptStackTrace
    
    # 作業ディレクトリを復元
    if ((Get-Location).Path -ne $projectRoot) {
        Pop-Location -ErrorAction SilentlyContinue
    }
    
    exit 1
}
