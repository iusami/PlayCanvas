# Cloudflare Pages デプロイガイド

## 🚀 簡単デプロイ（5分で完了）

### 前提条件
- GitHubリポジトリが公開されている
- Cloudflareアカウント（無料登録可）

### デプロイ手順

#### 1. Cloudflareアカウント作成
1. [Cloudflare](https://dash.cloudflare.com/)にアクセス
2. 「Sign up」から無料アカウント作成
3. メール認証を完了

#### 2. Cloudflare Pagesプロジェクト作成
1. Cloudflareダッシュボードから「Pages」を選択
2. 「Create a project」をクリック
3. 「Connect to Git」を選択
4. GitHubアカウントを連携
5. このリポジトリ（`football-canvas`）を選択

#### 3. ビルド設定
以下の設定を入力：

| 項目 | 値 |
|------|-----|
| Framework preset | None (カスタム設定) |
| Build command | `npm run build` |
| Build output directory | `build` |
| Root directory | / (デフォルト) |

#### 4. 環境変数設定（オプション）
「Environment variables」セクションで必要に応じて追加：
```
NODE_ENV = production
VITE_APP_TITLE = Football Canvas
```

#### 5. デプロイ実行
1. 「Save and Deploy」をクリック
2. 初回ビルドが開始（約2-3分）
3. 完了すると`https://your-project.pages.dev`でアクセス可能

## 🎯 デプロイ後の設定

### 独自ドメイン設定（オプション）
1. Pagesプロジェクトから「Custom domains」を選択
2. 「Set up a custom domain」をクリック
3. ドメインを入力（例：`football-canvas.com`）
4. DNS設定を更新（CNAMEレコード追加）

### HTTPS化
- 自動で有効化（Let's Encrypt証明書）
- HTTP → HTTPS自動リダイレクト

## 🔄 継続的デプロイ

### 自動デプロイ
- `main`ブランチへのプッシュで自動デプロイ
- プルリクエスト毎にプレビューURL生成

### 手動デプロイ
1. Pagesダッシュボードから「Deployments」
2. 「Retry deployment」または「Create deployment」

### ロールバック
1. 「Deployments」から過去のデプロイを選択
2. 「Promote to production」でロールバック

## 🛠️ トラブルシューティング

### ビルドエラー
**症状**: `npm run build`でエラー
**解決策**:
1. ローカルで`npm run build`を実行してエラー確認
2. Node.jsバージョンを18.xに設定
3. 環境変数が正しく設定されているか確認

### SPA ルーティングエラー
**症状**: 直接URL入力で404エラー
**解決策**:
- `public/_redirects`ファイルが正しく配置されているか確認
- `public/404.html`が存在するか確認

### 環境変数が反映されない
**症状**: `process.env.VITE_*`が`undefined`
**解決策**:
1. 変数名が`VITE_`で始まっているか確認
2. Cloudflare Pages管理画面で環境変数を再設定
3. 新しいデプロイを実行

### ビルド時間が長い
**症状**: 3分以上かかる
**解決策**:
1. `node_modules`キャッシュの有効化
2. 不要な依存関係の削除
3. ビルド最適化設定の見直し

## 📊 無料プランの制限

### 現在の制限（2024年）
- **帯域幅**: 無制限
- **ビルド時間**: 500分/月
- **同時ビルド**: 1つ
- **ファイル数**: 20,000ファイル
- **ファイルサイズ**: 25MB/ファイル

### 制限を超えた場合
- 自動的にPro プラン（$20/月）への案内
- 一時的なサービス停止（課金なし）

## 🔗 関連リンク

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html)
- [React Router + SPA設定](https://reactrouter.com/en/main/guides/splatting)

---

## 💡 Tips

### パフォーマンス最適化
```bash
# ビルドサイズ確認
npm run build
du -sh build/

# 依存関係分析
npx vite-bundle-analyzer
```

### 開発効率向上
- プレビューURLでレビュー用リンク共有
- 本番環境と同じ設定でのテスト
- 自動デプロイでCI/CD構築

🎉 **これで完全無料の本格的なWebアプリデプロイが完了です！**