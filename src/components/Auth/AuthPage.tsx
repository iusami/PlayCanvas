import { LoginForm } from './LoginForm'

export function AuthPage() {
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
        <LoginForm />
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          このアプリケーションを使用するには管理者が事前に登録した<br />
          アカウントでのログインが必要です。
        </p>
      </div>
    </div>
  )
}