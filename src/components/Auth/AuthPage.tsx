import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚡ Football Canvas
          </h1>
          <p className="text-gray-600">
            アメリカンフットボールのサイン作成ツール
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          このアプリケーションを使用するには認証が必要です。<br />
          アカウントを作成するか、既存のアカウントでログインしてください。
        </p>
      </div>
    </div>
  )
}