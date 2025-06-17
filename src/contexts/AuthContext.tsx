import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// AuthContext の型定義
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: any }>
}

// AuthContext 作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider コンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // テスト環境の場合は認証をスキップ
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'

  useEffect(() => {
    if (isTestMode) {
      // テスト環境では即座にモックユーザーを設定
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      } as User
      
      setUser(mockUser)
      setSession({ user: mockUser } as Session)
      setLoading(false)
      return
    }

    // 初期セッション取得
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('セッション取得エラー:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('認証状態変更:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [isTestMode])

  // サインアップ
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

  // サインイン
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  // サインアウト
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // ソーシャルログイン
  const signInWithProvider = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithProvider
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// useAuth カスタムフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth は AuthProvider 内で使用してください')
  }
  return context
}