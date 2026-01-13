# 1. ユーザー登録 (Register)
echo "`n=== 1. ユーザー登録テスト ==="
$registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/register" -Method Post -ContentType "application/json" -Body '{"username": "testuser", "password": "password123"}' -ErrorAction SilentlyContinue
echo "結果: $registerResponse"

# 2. ログイン (Login)
echo "`n=== 2. ログインテスト ==="
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method Post -ContentType "application/json" -Body '{"username": "testuser", "password": "password123"}'
    $token = $loginResponse.token
    echo "成功！トークンゲット: $token"
} catch {
    echo "ログイン失敗... $_"
    exit
}

# 3. 保護されたページへのアクセス (Access Protected Page)
echo "`n=== 3. トークンを使ってデータ取得テスト ==="
try {
    # トークンをヘッダーに乗せてアクセス
    $headers = @{ Authorization = "Bearer $token" }
    $data = Invoke-RestMethod -Uri "http://localhost:8080/trades" -Method Get -Headers $headers
    echo "データ取得成功！"
    # echo $data  # データの中身を見たい場合はコメントアウトを外す
} catch {
    echo "アクセス失敗... $_"
}