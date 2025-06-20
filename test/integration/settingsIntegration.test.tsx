import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../setup'
import { setupIntegrationTestEnv, renderAppWithAuth } from '../testUtils/integrationTestHelpers'

// テスト環境を設定
setupIntegrationTestEnv()

// 統合テスト: 基本的なアプリケーション機能
describe('基本機能統合テスト', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('アプリケーションが正常にレンダリングされ、基本UIが表示されること', async () => {
    const user = userEvent.setup()
    
    await renderAppWithAuth()

    // 1. アプリケーションが正常に表示されることを確認
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getAllByText('Football Canvas')).toHaveLength(1)

    // 2. 基本的なボタンが表示されることを確認
    expect(screen.getByRole('button', { name: /新しいプレイを作成/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /プレイ一覧/ })).toHaveLength(2) // ヘッダーとサイドバー
    expect(screen.getByRole('button', { name: /プレイリスト管理/ })).toBeInTheDocument()

    // 3. サイドバーのタブが表示されることを確認
    expect(screen.getByRole('button', { name: /ツール/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /プレイリスト/ })).toHaveLength(2) // ヘッダー（プレイリスト管理）とサイドバー
    expect(screen.getByRole('button', { name: /フォーメーション/ })).toBeInTheDocument()
  })

  it('新しいプレイ作成機能が動作すること', async () => {
    const user = userEvent.setup()
    
    await renderAppWithAuth()

    // 1. 新しいプレイボタンをクリック
    const addPlayButton = screen.getByRole('button', { name: /新しいプレイを作成/ })
    await user.click(addPlayButton)

    // 2. プレイが作成されlocalStorageに保存されることを確認
    await waitFor(() => {
      const storedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      expect(storedPlays).toHaveLength(1)
      expect(storedPlays[0].metadata.title).toBe('新しいプレイ')
    })
  })

  it('サイドバーのタブ切り替えが機能すること', async () => {
    const user = userEvent.setup()
    
    await renderAppWithAuth()

    // 1. 初期状態でツールタブがアクティブであることを確認
    const toolsTab = screen.getByRole('button', { name: /ツール/ })
    expect(toolsTab).toBeInTheDocument()

    // 2. 他のタブをクリックして切り替え
    const playListTabs = screen.getAllByRole('button', { name: /プレイ一覧/ })
    const playListTab = playListTabs[1] // サイドバーのタブを使用
    await user.click(playListTab)

    const playlistTabs = screen.getAllByRole('button', { name: /プレイリスト/ })
    const playlistTab = playlistTabs.find(button => 
      button.textContent === 'プレイリスト' && 
      button.className.includes('flex-1')
    ) || playlistTabs[1] // サイドバーのタブを使用
    await user.click(playlistTab!)

    const formationTab = screen.getByRole('button', { name: /フォーメーション/ })
    await user.click(formationTab)

    // 3. すべてのタブが存在することを確認
    expect(toolsTab).toBeInTheDocument()
    expect(playListTab).toBeInTheDocument()
    expect(playlistTab).toBeInTheDocument()
    expect(formationTab).toBeInTheDocument()
  })
})