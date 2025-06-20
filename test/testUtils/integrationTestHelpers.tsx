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
    
    // DOM を完全に初期化
    const rootElement = document.getElementById('root')
    if (rootElement) {
      rootElement.innerHTML = ''
    }
    document.body.innerHTML = '<div id="root"></div>'
    
    // 前のレンダリングの完全なクリアを待機
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  const result = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
  
  // CI環境では React コンポーネントの完全な初期化を待機
  if (process.env.CI) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // DOM が安定するまで待機
    await new Promise(resolve => {
      const observer = new MutationObserver(() => {
        // DOM 変更が止まったら解決
        setTimeout(() => {
          observer.disconnect()
          resolve(undefined)
        }, 100)
      })
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      })
      
      // 最大3秒でタイムアウト
      setTimeout(() => {
        observer.disconnect()
        resolve(undefined)
      }, 3000)
    })
  }
  
  return result
}