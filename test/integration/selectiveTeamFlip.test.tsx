import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../setup'
import { setupIntegrationTestEnv, renderAppWithAuth } from '../testUtils/integrationTestHelpers'

// テスト環境を設定
setupIntegrationTestEnv()

// 統合テスト: 選択的チーム反転機能（基本機能テスト）
describe('選択的チーム反転統合フロー', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('アプリケーションに選択的反転のUIコントロールが表示されること', async () => {
    const user = userEvent.setup()
    
    await renderAppWithAuth()

    // 1. アプリケーションが正常に表示されることを確認
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getAllByText('Football Canvas')).toHaveLength(1)

    // 2. 反転関連のUIコントロールが表示されることを確認
    expect(screen.getByRole('button', { name: /左右反転/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /上下反転/ })).toBeInTheDocument()

    // 3. 選択的反転のラジオボタンが表示されることを確認
    expect(screen.getByRole('radio', { name: /全て/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /オフェンス/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /ディフェンス/ })).toBeInTheDocument()
  })

  it('反転機能の選択オプションが操作できること', async () => {
    const user = userEvent.setup()
    
    await renderAppWithAuth()

    // 1. 初期状態で「全て」が選択されていることを確認
    const allOption = screen.getByRole('radio', { name: /全て/ })
    expect(allOption).toBeChecked()

    // 2. オフェンスオプションを選択
    const offenseOption = screen.getByRole('radio', { name: /オフェンス/ })
    await user.click(offenseOption)
    expect(offenseOption).toBeChecked()

    // 3. ディフェンスオプションを選択
    const defenseOption = screen.getByRole('radio', { name: /ディフェンス/ })
    await user.click(defenseOption)
    expect(defenseOption).toBeChecked()

    // 4. 全てオプションに戻る
    await user.click(allOption)
    expect(allOption).toBeChecked()
  })
})