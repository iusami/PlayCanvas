# 認証機能設定ガイド

## 🎯 概要

このアプリケーションはSupabase Authを使用した認証機能を実装しています。ユーザーはメール/パスワードまたはソーシャルログイン（Google、GitHub）でアクセスできます。

## 🚀 Supabase プロジェクト設定

### 1. Supabaseアカウント作成
1. [Supabase](https://supabase.com/) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2. 新しいプロジェクト作成
1. ダッシュボードから「New project」
2. プロジェクト情報を入力：
   - **Name**: `football-canvas-auth`
   - **Database Password**: 強力なパスワードを生成
   - **Region**: `Northeast Asia (Tokyo)` （推奨）
3. 「Create new project」をクリック（約2分で完了）

### 3. 認証設定
プロジェクト作成後、左サイドバーから「Authentication」→「Settings」

#### Site URL設定
- **Site URL**: `https://your-app-domain.pages.dev`
- **Redirect URLs**: 
  ```
  https://your-app-domain.pages.dev/auth/callback
  http://localhost:5173/auth/callback
  ```

#### メール設定（オプション）
- **Enable email confirmations**: ONにする（推奨）
- **Disable new user signups**: セキュリティ強化時にON

## 🔑 環境変数設定

### Supabaseプロジェクト情報取得
1. Supabaseダッシュボード → 「Settings」→「API」
2. 以下の値をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJ...`

### ローカル開発環境
`.env.local`ファイルを作成：
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Cloudflare Pages本番環境
Cloudflare Pagesダッシュボード：
1. プロジェクト → 「Settings」→「Environment variables」
2. 環境変数を追加：
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-anon-key-here`

## 🌐 ソーシャルログイン設定（オプション）

### Google OAuth設定
1. [Google Cloud Console](https://console.cloud.google.com/)
2. 新しいプロジェクトを作成
3. 「APIs & Services」→「Credentials」
4. 「OAuth 2.0 Client IDs」を作成：
   - **Authorized JavaScript origins**: 
     - `https://your-project-id.supabase.co`
     - `https://your-app-domain.pages.dev`
   - **Authorized redirect URIs**:
     - `https://your-project-id.supabase.co/auth/v1/callback`
5. Client IDとSecretをSupabaseに設定：
   - Supabase「Authentication」→「Providers」→「Google」
   - Enable ONにしてIDとSecretを入力

### GitHub OAuth設定
1. GitHub「Settings」→「Developer settings」→「OAuth Apps」
2. 「New OAuth App」：
   - **Homepage URL**: `https://your-app-domain.pages.dev`
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`
3. Client IDとSecretをSupabaseに設定：
   - Supabase「Authentication」→「Providers」→「GitHub」
   - Enable ONにしてIDとSecretを入力

## 🧪 テスト手順

### 1. ローカル開発テスト
```bash
# 環境変数設定後
npm run dev

# ブラウザで http://localhost:5173 にアクセス
# ログイン画面が表示されることを確認
```

### 2. アカウント作成テスト
1. 「アカウント作成」タブを選択
2. メールアドレスとパスワード（6文字以上）を入力
3. 確認メールが送信される
4. メール内のリンクをクリックして認証完了

### 3. ログインテスト
1. 作成したアカウントでログイン
2. メインアプリケーションにアクセス可能か確認
3. ヘッダーにユーザーメール表示を確認
4. ログアウト機能の動作確認

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### 1. 「VITE_SUPABASE_URL is required」エラー
**解決策**: 環境変数が正しく設定されているか確認
```bash
# ローカル開発の場合
cat .env.local

# 本番環境の場合
# Cloudflare Pagesの環境変数設定を確認
```

#### 2. 認証コールバックで無限ループ
**解決策**: Redirect URLsが正しく設定されているか確認
- Supabase「Authentication」→「Settings」→「Redirect URLs」

#### 3. ソーシャルログインが動作しない
**解決策**: OAuth設定を確認
- Google/GitHubの認証情報が正しいか
- Callback URLが正確か
- Supabaseで該当プロバイダーがEnableされているか

#### 4. メール認証が届かない
**解決策**: 
- スパムフォルダを確認
- Supabaseの「Authentication」→「Templates」でメール設定確認
- 開発環境では認証をスキップする設定も可能

## 📊 セキュリティ設定

### Row Level Security（RLS）
将来的にユーザーデータを分離する場合：
```sql
-- ユーザーテーブル作成例
CREATE TABLE user_plays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  play_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE user_plays ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（ユーザーは自分のデータのみアクセス）
CREATE POLICY "Users can view own plays" ON user_plays
  FOR SELECT USING (auth.uid() = user_id);
```

### パスワードポリシー
Supabase「Authentication」→「Settings」で設定：
- **Minimum password length**: 8文字以上推奨
- **Password strength**: 強力なパスワード要求

## 🎉 完了

これで認証機能が完全に動作します！

### 実装完了事項
✅ メール/パスワード認証  
✅ ソーシャルログイン（Google、GitHub）  
✅ セッション管理  
✅ 自動リダイレクト  
✅ ユーザー情報表示  
✅ ログアウト機能  
✅ 認証状態によるアクセス制御  

---

## 📞 サポート

問題が発生した場合：
1. [Supabase ドキュメント](https://supabase.com/docs/guides/auth)
2. [React + Supabase ガイド](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
3. このプロジェクトのIssue作成

🔒 **これでアプリケーションは完全にプライベートになりました！**