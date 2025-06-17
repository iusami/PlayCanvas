import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function PendingApprovalPage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {/* アイコン */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          {/* タイトル */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            承認待ち
          </h2>

          {/* メッセージ */}
          <div className="text-gray-600 mb-6 space-y-3">
            <p>
              <strong>{user?.email}</strong><br />
              でのアカウント申請を受け付けました。
            </p>
            <p>
              管理者による確認・承認後、確認メールをお送りします。<br />
              メール内のリンクをクリックすると、アプリケーションをご利用いただけます。
            </p>
            <p className="text-sm text-gray-500">
              ※ 承認には1〜2営業日お時間をいただく場合があります。
            </p>
          </div>

          {/* 注意事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ご注意</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>確認メールが迷惑メールフォルダに振り分けられる場合があります</li>
                  <li>承認が完了するまでアプリケーションにはアクセスできません</li>
                  <li>お急ぎの場合は管理者までお問い合わせください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              承認状況を確認
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              別のアカウントでログイン
            </button>
          </div>

          {/* フッター情報 */}
          <div className="mt-8 text-xs text-gray-400 border-t border-gray-200 pt-4">
            <p>Football Canvas - アカウント管理システム</p>
          </div>
        </div>
      </div>
    </div>
  )
}