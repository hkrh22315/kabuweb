# マルチステージビルド: ビルドステージ
FROM maven:3.9-eclipse-temurin-17 AS builder

# 作業ディレクトリを設定
WORKDIR /app

# Mavenの設定ファイルをコピー（依存関係のダウンロードを最適化）
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# 依存関係をダウンロード（レイヤーキャッシュを活用）
RUN mvn dependency:go-offline -B || true

# ソースコードをコピー
COPY src ./src

# フロントエンドビルドステージ
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# フロントエンドのpackage.jsonをコピー
COPY frontend/package*.json ./

# 依存関係をインストール
RUN npm ci --only=production=false

# フロントエンドのソースコードをコピー
COPY frontend/ .

# フロントエンドをビルド
RUN npm run build

# バックエンドビルド（フロントエンドのビルド成果物を含める）
FROM maven:3.9-eclipse-temurin-17 AS backend-builder

WORKDIR /app

# Mavenの設定ファイルをコピー
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# 依存関係をダウンロード
RUN mvn dependency:go-offline -B || true

# ソースコードをコピー
COPY src ./src

# フロントエンドのビルド成果物をコピー
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# アプリケーションをビルド（テストをスキップして高速化）
RUN mvn clean package -DskipTests -B

# ランタイムステージ: 軽量なJREイメージ
FROM eclipse-temurin:17-jre-alpine

# セキュリティ: 非rootユーザーを作成
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

WORKDIR /app

# ビルド済みJARファイルをコピー
COPY --from=backend-builder /app/target/*.jar app.jar

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
ENTRYPOINT ["java", "-jar", "app.jar"]
