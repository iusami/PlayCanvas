import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからハッシュフラグメントを取得してセッションを処理
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('認証コールバックエラー:', error)
          setError('認証に失敗しました。再度お試しください。')
        } else if (data.session) {
          // 認証成功 - ホームページにリダイレクト
          window.location.href = '/'
        } else {
          setError('認証情報が見つかりません。')
        }
      } catch (err) {
        console.error('認証処理エラー:', err)
        setError('認証処理中にエラーが発生しました。')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            認証処理中...
          </h2>
          <p className="text-gray-600">
            しばらくお待ちください
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            認証エラー
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return null
}