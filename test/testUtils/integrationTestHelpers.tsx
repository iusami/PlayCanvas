import { render, cleanup } from '@testing-library/react'
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
  
  // CI環境では標準的なクリーンアップのみ
  if (process.env.CI) {
    // 各テスト後にクリーンアップを実行
    afterEach(() => {
      cleanup()
    })
  }
}

/**
 * AppコンポーネントをAuthProviderでラップしてレンダリング
 * 統合テストで一貫したセットアップを提供
 * 
 * @returns Testing Library render result
 */
export const renderAppWithAuth = async () => {
  const result = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
  
  // React コンポーネントのレンダリング完了を待機
  await new Promise(resolve => setTimeout(resolve, 0))
  
  return result
}