import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// テスト環境での環境変数チェック
const isTestEnv = import.meta.env.VITE_TEST_MODE === 'true' || 
                 (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')

if (!isTestEnv && !supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required')
}

if (!isTestEnv && !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required')
}

// テスト環境でのデフォルト値設定
const finalSupabaseUrl = supabaseUrl || (isTestEnv ? 'https://test.supabase.co' : '')
const finalSupabaseAnonKey = supabaseAnonKey || (isTestEnv ? 'test-key' : '')

// Supabase クライアントを作成
export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    // 認証フローの設定
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Cloudflare Pages での認証リダイレクト対応
    flowType: 'pkce'
  }
})

// 認証関連のヘルパー関数
export const auth = supabase.auth

// 型定義
export type { User, Session } from '@supabase/supabase-js'