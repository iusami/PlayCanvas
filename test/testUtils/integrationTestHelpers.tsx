import { render } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../../src/App'
import { AuthProvider } from '../../src/contexts/AuthContext'

/**
 * 統合テスト用のテストユーティリティ関数
 */

/**
 * テスト環境を設定
 * 統合テストで使用するため、VITE_TEST_MODEを有効にする
 */
export const setupIntegrationTestEnv = () => {
  vi.stubEnv('VITE_TEST_MODE', 'true')
}

/**
 * AppコンポーネントをAuthProviderでラップしてレンダリング
 * 統合テストで一貫したセットアップを提供
 * 
 * @returns Testing Library render result
 */
export const renderAppWithAuth = () => {
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}