import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthPage } from './AuthPage'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  // テスト環境では認証をバイパス
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'
  if (isTestMode) {
    return <>{children}</>
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は認証ページを表示
  if (!user) {
    return <AuthPage />
  }

  // 認証済みの場合は子コンポーネントを表示
  return <>{children}</>
}