import { createClient } from '@supabase/supabase-js'

// Supabase 設定
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required')
}

// Supabase クライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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