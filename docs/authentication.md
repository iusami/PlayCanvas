# Football Canvas 認証システム管理ガイド

## 概要

Football Canvasは、Supabaseを使用した認証システムを実装しており、管理者によるユーザー管理と認証により、安全なアクセス制御を提供しています。

> **📋 注意**: 認証機能の初期設定については、[AUTH_SETUP.md](../AUTH_SETUP.md)を参照してください。このドキュメントでは、**管理者によるユーザー管理**に特化した内容を扱います。

## 認証方式

### メール・パスワード認証（管理者事前登録制）

- **ユーザー登録**: 管理者がSupabaseダッシュボードで事前にアカウント作成
- **サインイン**: 管理者が登録したアカウントでのログイン
- **パスワード要件**: 6文字以上
- **セルフサインアップ**: 無効（セキュリティ強化のため）

## ユーザー管理フロー

### 管理者による事前ユーザー登録制（現在の実装）

1. **管理者による事前登録**
   - 管理者がSupabaseダッシュボードで新規ユーザーを作成
   - メールアドレスとパスワードを設定
   - ユーザーにログイン情報を安全な方法で通知

2. **ユーザーログイン**
   - ユーザーが管理者から受け取ったログイン情報でアクセス
   - 認証成功後、即座にアプリケーション利用可能

3. **セキュリティ利点**
   - 不正な自己登録を防止
   - 管理者による完全なアクセス制御
   - 事前承認済みユーザーのみアクセス可能

### 認証システムの技術実装

#### シンプルな認証チェック

```typescript
// src/components/Auth/PrivateRoute.tsx
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  // テスト環境では認証をバイパス
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'
  if (isTestMode) {
    return <>{children}</>
  }

  // ローディング中の表示
  if (loading) {
    return <LoadingScreen />
  }

  // 未認証の場合は認証ページを表示
  if (!user) {
    return <AuthPage />
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}
```

#### 認証コンテキストの簡素化

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
}
```

セルフサインアップ機能とソーシャルログイン機能は削除され、シンプルな認証システムになりました。

#### ユーザー自身によるパスワード変更機能

認証済みユーザーは自分のパスワードを変更することができます：

```typescript
// src/components/Auth/PasswordChangeForm.tsx
// パスワード変更フォームをモーダルで提供
// - 新しいパスワード入力（6文字以上）
// - パスワード確認入力
// - バリデーション機能
// - エラーハンドリング
```

**パスワード変更機能の特徴：**
- ヘッダーの「パスワード変更」ボタンからアクセス
- モーダル形式でユーザーフレンドリーな操作
- リアルタイムバリデーション（6文字以上、確認一致）
- 変更後もログイン状態を維持
- 適切なエラーメッセージとローディング状態の表示

### Supabase設定

管理者によるユーザー管理を適切に行うための設定：

#### Authentication設定
1. Supabaseダッシュボード → 「Authentication」→「Settings」
2. **Enable sign ups**: OFF（セルフサインアップを無効化）
3. **Email confirmations**: ON（推奨）
4. **Secure email change**: ON（推奨）

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

#### 新規ユーザーの登録手順

1. **アカウント作成の準備**
   - ユーザーからのアクセス申請を受理
   - メールアドレスの妥当性確認
   - 利用目的や所属の確認（必要に応じて）

2. **Supabaseでのアカウント作成**
   - Supabaseダッシュボード → 「Authentication」→「Users」
   - 「Add user」ボタンをクリック
   - **Email**: ユーザーのメールアドレスを入力
   - **Password**: 初期パスワードを設定（後でユーザーが変更可能）
   - **Email confirm**: チェックを入れる（即座に有効化）

3. **ユーザーへの通知**
   - 安全な方法でログイン情報をユーザーに送信
   - 初回ログイン時のパスワード変更を推奨
   - アプリケーションのURL とログイン方法を案内

4. **アカウント有効性の確認**
   - ユーザーが正常にログインできることを確認
   - 必要に応じて初期設定のサポート

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

### システム機能強化案

1. **役割ベースアクセス制御（RBAC）**
   - 管理者、編集者、閲覧者などの役割定義
   - 役割に応じた機能制限

2. **一括ユーザー管理**
   - CSVファイルからの一括インポート
   - ユーザー情報の一括エクスポート

3. **監査ログ機能**
   - ユーザーの操作履歴記録
   - アクセスログの管理

## 関連ファイル

- `src/contexts/AuthContext.tsx` - 認証コンテキスト（簡素化済み、パスワード変更機能付き）
- `src/components/Auth/AuthPage.tsx` - 認証ページ（ログインのみ）
- `src/components/Auth/LoginForm.tsx` - ログインフォーム
- `src/components/Auth/PasswordChangeForm.tsx` - パスワード変更フォーム
- `src/components/Auth/PrivateRoute.tsx` - 認証保護ルート（簡素化済み）
- `src/components/Header.tsx` - ヘッダーコンポーネント（パスワード変更UI統合済み）
- `test/components/Auth/PrivateRoute.test.tsx` - 認証テスト
- `test/components/Auth/PasswordChangeForm.test.tsx` - パスワード変更フォームテスト