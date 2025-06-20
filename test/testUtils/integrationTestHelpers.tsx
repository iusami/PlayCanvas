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
  
  // CI環境では追加のクリーンアップを設定
  if (process.env.CI) {
    // 各テスト後に完全なクリーンアップを実行
    afterEach(async () => {
      cleanup()
      
      // タイマーとイベントリスナーをクリア（安全にチェック）
      try {
        vi.clearAllTimers()
      } catch (e) {
        // タイマーモックがない場合は無視
      }
      vi.clearAllMocks()
      
      // DOMを完全にクリア
      document.body.innerHTML = ''
      document.head.innerHTML = ''
      
      // ローカルストレージもクリア
      if (typeof localStorage !== 'undefined') {
        localStorage.clear()
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear()
      }
      
      // 少し待機してクリーンアップを確実にする
      await new Promise(resolve => setTimeout(resolve, 10))
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
  // CI環境では事前にクリーンアップ
  if (process.env.CI) {
    cleanup()
    document.body.innerHTML = ''
    // 小さな遅延を追加してクリーンアップを確実にする
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  const result = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
  
  // CI環境では追加の待機
  if (process.env.CI) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return result
}