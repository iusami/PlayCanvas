# Football Canvas 認証システム管理ガイド

## 概要

Football Canvasは、Supabaseを使用した認証システムを実装しており、未認証ユーザーからの不正アクセスを防ぎ、個人のプレイデータを保護します。

> **📋 注意**: 認証機能の初期設定については、[AUTH_SETUP.md](../AUTH_SETUP.md)を参照してください。このドキュメントでは、**アカウント管理と承認機能**に特化した内容を扱います。

## 認証方式

### 1. メール・パスワード認証

- **サインアップ**: メールアドレスとパスワードでアカウント作成
- **サインイン**: 既存アカウントでのログイン
- **パスワード要件**: 6文字以上

### 2. ソーシャル認証

- **Google OAuth**: Googleアカウントでのログイン
- **GitHub OAuth**: GitHubアカウントでのログイン

## アカウント有効化フロー

### 現在の実装（メール確認）

1. **ユーザー登録**
   - ユーザーがサインアップフォームで情報を入力
   - Supabaseに新規ユーザーとして登録される

2. **確認メール送信**
   - Supabaseから確認メールが自動送信される
   - メール内のリンクをクリックでアカウント有効化

3. **アカウント有効化**
   - メール確認後、ユーザーは即座にアプリケーションにアクセス可能

### メール確認の仕組み

```typescript
// src/contexts/AuthContext.tsx
const signUp = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // メール認証完了後のリダイレクト先
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { error }
}
```

## アカウント管理

### Supabaseダッシュボードでの管理

アカウントの許可・不許可は、Supabaseダッシュボードで行います：

#### アクセス方法
1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. 該当プロジェクト（football-canvas-auth）を選択
3. 左サイドバーの「Authentication」→「Users」を選択

#### 管理可能な操作

1. **ユーザー一覧表示**
   - 登録済みユーザーの一覧表示
   - ユーザーのメールアドレス、登録日時、最終ログイン日時を確認
   - アカウントの確認状態（Confirmed/Unconfirmed）を確認

2. **アカウント許可・不許可管理**
   
   **✅ 許可（アカウント有効化）**
   - **メール確認済みユーザー**: 自動的にアプリケーションアクセス可能
   - **メール未確認ユーザー**: 管理者がメール確認を代行可能
     - ユーザー詳細画面で「Confirm email」ボタンをクリック
   
   **❌ 不許可（アカウント無効化）**
   - **一時停止**: ユーザーをブロック状態にする
     - 「Block user」ボタンでアクセス停止
     - 必要に応じて「Unblock user」で復旧可能
   - **完全削除**: ユーザーアカウントを永久削除
     - 「Delete user」ボタンで完全削除（復元不可）

3. **ユーザー詳細管理**
   - **基本情報**: メールアドレス、ID、作成日時
   - **認証状態**: 
     - `email_confirmed_at`: メール確認日時
     - `last_sign_in_at`: 最終ログイン日時
     - `banned_until`: ブロック解除日時（ブロック中の場合）
   - **メタデータ編集**: ユーザー属性の追加・変更
   - **セッション管理**: アクティブセッションの確認・無効化

### 実際の運用手順

#### 新規ユーザーの承認手順

1. **新規登録の通知確認**
   - Supabaseダッシュボードで定期的にユーザー一覧をチェック
   - 新規ユーザー（Unconfirmed状態）を確認

2. **ユーザー情報の検証**
   - 登録メールアドレスの妥当性確認
   - 必要に応じてユーザーに連絡を取り、本人確認

3. **アカウント有効化**
   - **自動承認**: ユーザーがメール確認リンクをクリック
   - **手動承認**: 管理者が「Confirm email」ボタンをクリック

#### 問題ユーザーの対処手順

1. **一時停止**
   - 不適切な利用が疑われる場合
   - ユーザー詳細画面→「Block user」
   - 理由をメモとして記録（メタデータに追加）

2. **アカウント復旧**
   - 問題解決後、「Unblock user」で復旧
   - 復旧日時と理由をメタデータに記録

3. **完全削除**
   - 重大な違反や悪意のある利用の場合
   - 「Delete user」で永久削除
   - 削除前に必要なデータのバックアップを取得

#### ユーザーの手動承認（現在未実装）

現在のシステムでは自動承認（メール確認のみ）ですが、手動承認が必要な場合は以下の方法で実装可能です：

**実装パターン1: カスタムフィールドでの管理**
```sql
-- users テーブルにカラム追加
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB;

-- 承認状態を追加
UPDATE auth.users 
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  '{"approved": false}'::jsonb
WHERE id = 'user-id';
```

**実装パターン2: RLS（Row Level Security）での制御**
```sql
-- approved ユーザーのみアクセス可能
CREATE POLICY "Approved users only" ON public.plays
FOR ALL USING (
  auth.jwt() ->> 'user_metadata' ->> 'approved' = 'true'
);
```

## セキュリティ設定

### Row Level Security (RLS)

各ユーザーは自分のデータのみアクセス可能：

```sql
-- プレイテーブルのRLS設定例
CREATE POLICY "Users can view own plays" ON public.plays
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plays" ON public.plays
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 環境変数

認証に必要な環境変数は`.env`ファイルで管理：

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## テスト環境での認証

### テスト環境での認証バイパス

E2Eテストやユニットテストでは、`VITE_TEST_MODE=true`で認証をバイパス：

```typescript
// src/components/Auth/PrivateRoute.tsx
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'
if (isTestMode) {
  return <>{children}</>
}
```

### テスト用モックユーザー

```typescript
// test/utils/testUtils.tsx
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  // ... その他のユーザープロパティ
}
```

## トラブルシューティング

### よくある問題

1. **確認メールが届かない**
   - スパムフォルダを確認
   - Supabaseのメール設定を確認
   - メールアドレスの入力ミスがないか確認

2. **ログインできない**
   - パスワードの入力ミス
   - アカウントがまだ確認されていない
   - ブラウザのcookieやlocalStorageをクリア

3. **ソーシャルログインが失敗する**
   - OAuth設定の確認
   - リダイレクトURLの設定確認

### デバッグ方法

```typescript
// 認証状態の確認
supabase.auth.onAuthStateChange((event, session) => {
  console.log('認証状態変更:', event, session)
})

// 現在のセッション取得
const { data: { session } } = await supabase.auth.getSession()
console.log('現在のセッション:', session)
```

## 今後の拡張

### 管理者承認機能の実装案

1. **管理者ダッシュボード作成**
   - 未承認ユーザー一覧表示
   - 承認・拒否ボタンの実装

2. **承認待ち画面**
   - 未承認ユーザー向けの待機画面
   - 承認状況の通知機能

3. **権限管理**
   - 管理者権限の設定
   - 役割ベースのアクセス制御

## 関連ファイル

- `src/contexts/AuthContext.tsx` - 認証コンテキスト
- `src/components/Auth/` - 認証関連コンポーネント
- `src/components/Auth/PrivateRoute.tsx` - 認証保護ルート
- `src/main.tsx` - ルーティング設定
- `test/utils/testUtils.tsx` - テスト用認証ユーティリティ