# Docker開発環境

このプロジェクトでは、Docker を使用した開発環境を提供しています。

## 🚀 クイックスタート

### 開発環境の起動

```bash
# 開発環境を起動（ホットリロード付き）
npm run docker:dev

# または
docker-compose up web-dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

### 本番環境の確認

```bash
# 本番環境をビルドして起動
npm run docker:prod

# または
docker-compose up web-prod
```

ブラウザで http://localhost:3000 にアクセスしてください。

## 📋 利用可能なコマンド

### NPM Scripts

| コマンド | 説明 |
|---------|------|
| `npm run docker:dev` | 開発環境を起動 |
| `npm run docker:dev:build` | 開発環境用イメージをビルド |
| `npm run docker:prod` | 本番環境を起動 |
| `npm run docker:prod:build` | 本番環境用イメージをビルド |
| `npm run docker:nginx` | Nginx付き本番環境を起動 |
| `npm run docker:build` | 全ステージのイメージをビルド |
| `npm run docker:build:dev` | 開発環境用イメージのみビルド |
| `npm run docker:build:prod` | 本番環境用イメージのみビルド |
| `npm run docker:clean` | コンテナ・ボリューム・未使用イメージを削除 |

### Docker Compose

```bash
# 開発環境
docker-compose up web-dev

# 本番環境
docker-compose up web-prod

# Nginx付き本番環境（フルスタック）
docker-compose --profile production up

# バックグラウンド実行
docker-compose up -d web-dev

# 停止
docker-compose down

# ログ確認
docker-compose logs web-dev
```

## 🏗️ アーキテクチャ

### マルチステージビルド

```
┌─────────────────┐    ┌─────────────────┐
│   deps          │    │   dev-deps      │
│ (Production依存) │    │ (All依存関係)    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │              ┌───────▼───────┐
          │              │   builder     │
          │              │ (ビルド実行)   │
          │              └───────┬───────┘
          │                      │
    ┌─────▼───────┐    ┌─────────▼───────┐
    │development  │    │   production    │
    │(開発環境)    │    │ (nginx+静的配信) │
    └─────────────┘    └─────────────────┘
```

### サービス構成

- **web-dev**: 開発用サーバー（ポート5173、ホットリロード）
- **web-prod**: 本番確認用（ポート3000、静的配信）
- **nginx**: リバースプロキシ（ポート80/443、本番用）

## 🔧 カスタマイズ

### 環境変数

`.env` ファイルを作成してカスタマイズできます：

```env
# 開発環境用
NODE_ENV=development
VITE_API_URL=http://localhost:5173

# 本番環境用  
NODE_ENV=production
VITE_API_URL=https://your-domain.com
```

### ポート変更

`docker-compose.yml` の ports セクションを変更してください：

```yaml
services:
  web-dev:
    ports:
      - "3001:5173"  # ホスト側を3001に変更
```

## 🔍 トラブルシューティング

### よくある問題

1. **ポートが既に使用されている**
   ```bash
   # 使用中のポートを確認
   lsof -i :5173
   
   # または別のポートを使用
   docker-compose run --service-ports -p 3001:5173 web-dev
   ```

2. **node_modules の同期問題**
   ```bash
   # ボリュームを削除して再作成
   docker-compose down -v
   docker-compose up web-dev
   ```

3. **イメージのキャッシュ問題**
   ```bash
   # キャッシュなしで再ビルド
   docker-compose build --no-cache web-dev
   ```

### ヘルスチェック

各サービスにはヘルスチェックが設定されています：

```bash
# ヘルス状態を確認
docker-compose ps

# 詳細なログ確認
docker-compose logs web-dev
```

## 🚀 クラウドデプロイ

### Multi-platform ビルド

```bash
# ARM64とAMD64両対応でビルド
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/football-canvas:latest .

# 特定プラットフォーム向け
docker buildx build --platform linux/amd64 -t your-registry/football-canvas:amd64 .
```

### CI/CD用設定例

```yaml
# GitHub Actions example
- name: Build and push Docker image
  uses: docker/build-push-action@v4
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: |
      your-registry/football-canvas:latest
      your-registry/football-canvas:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## 📝 開発フロー

1. **初回セットアップ**
   ```bash
   git clone <repository>
   cd football-canvas
   npm run docker:dev:build
   npm run docker:dev
   ```

2. **日常開発**
   ```bash
   # 開発サーバー起動
   npm run docker:dev
   
   # ファイル編集（ホットリロードで即座に反映）
   
   # 本番確認
   npm run docker:prod
   ```

3. **本番デプロイ前**
   ```bash
   # 本番ビルドのテスト
   npm run docker:prod:build
   npm run docker:nginx
   
   # パフォーマンス確認
   lighthouse http://localhost
   ```

## 📊 パフォーマンス最適化

- **Gzip圧縮**: nginx で自動適用
- **静的ファイルキャッシュ**: 1年間のキャッシュ設定
- **レイヤーキャッシュ**: Docker build で最適化
- **Multi-stage**: 本番用イメージの軽量化

---

🎯 **Tips**: 開発時は `docker:dev`、本番確認は `docker:prod` を使用しましょう！