# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 環境変数の設定

このプロジェクトでは、環境に応じたAPI URLを設定するために環境変数ファイルを使用しています。

### 環境変数ファイル

- `.env.development` - 開発環境用（`npm run dev`時に使用）
- `.env.production` - 本番環境用（`npm run build`時に使用）

### 設定内容

- `VITE_API_BASE_URL`: APIのベースURL
  - 開発環境: 空文字（vite.config.jsのproxy設定を使用）
  - 本番環境: `http://52.69.54.175:8080`

### ビルド後の確認方法

本番環境用にビルドした後、環境変数が正しく設定されているか確認するには：

1. **ビルドファイルを確認**
   ```bash
   npm run build
   ```
   ビルド後、`dist/assets/index-*.js`ファイルを開き、`VITE_API_BASE_URL`の値が正しく埋め込まれているか確認します。

2. **ブラウザの開発者ツールで確認**
   - ビルドしたアプリケーションをブラウザで開く
   - F12で開発者ツールを開く
   - Consoleタブで`import.meta.env.VITE_API_BASE_URL`を実行して値を確認
   - NetworkタブでAPIリクエストのURLが正しいか確認

3. **エラーログの確認**
   - `ERR_CONNECTION_REFUSED`エラーが発生している場合、API URLが正しく設定されていない可能性があります
   - ブラウザのConsoleでエラーメッセージを確認し、接続先URLを確認してください

### 環境変数の変更方法

本番環境のAPI URLを変更する場合：

1. `frontend/.env.production`ファイルを編集
2. `VITE_API_BASE_URL`の値を新しいURLに変更
3. 再度ビルドを実行（`npm run build`）
4. ビルド成果物を`src/main/resources/static`にコピー
