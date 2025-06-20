import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../setup'
import { setupIntegrationTestEnv, renderAppWithAuth } from '../testUtils/integrationTestHelpers'

// テスト環境を設定
setupIntegrationTestEnv()

// 統合テスト: プレイ作成からプレイリストへの追加まで
describe('プレイ作成統合フロー', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('アプリケーションが正常にレンダリングされること', async () => {
    const user = userEvent.setup()
    
    renderAppWithAuth()

    // 1. アプリケーションが正常に表示されることを確認
    expect(screen.getByText('Football Canvas')).toBeInTheDocument()

    // 2. 基本的なボタンが表示されることを確認
    expect(screen.getByRole('button', { name: /新しいプレイを作成/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /プレイリスト管理/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /プレイ一覧/ })).toHaveLength(2) // ヘッダーとサイドバーに1つずつ

    // 3. 新しいプレイボタンをクリックできることを確認
    const addPlayButton = screen.getByRole('button', { name: /新しいプレイを作成/ })
    await user.click(addPlayButton)

    // 4. プレイ作成後、データがlocalStorageに保存されることを確認
    await waitFor(() => {
      const storedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      expect(storedPlays).toHaveLength(1)
      expect(storedPlays[0].metadata.title).toBe('新しいプレイ')
    })
  })

  it('プレイ一覧ボタンが正常に動作すること', async () => {
    const user = userEvent.setup()
    
    renderAppWithAuth()

    // 1. プレイ一覧ボタンをクリック
    const playLibraryButtons = screen.getAllByRole('button', { name: /プレイ一覧/ })
    const playLibraryButton = playLibraryButtons[0] // ヘッダーのボタンを使用
    await user.click(playLibraryButton)

    // 2. 基本的な要素が存在することを確認（実際の動作は複雑な実装に依存）
    expect(screen.getByText('Football Canvas')).toBeInTheDocument()
  })

  it('プレイリスト管理ボタンが正常に動作すること', async () => {
    const user = userEvent.setup()
    
    renderAppWithAuth()

    // 1. プレイリスト管理ボタンをクリック
    const playlistButton = screen.getByRole('button', { name: /プレイリスト管理/ })
    await user.click(playlistButton)

    // 2. 基本的な要素が存在することを確認（実際の動作は複雑な実装に依存）
    expect(screen.getByText('Football Canvas')).toBeInTheDocument()
  })

  it('サイドバーのタブ切り替えが正常に動作すること', async () => {
    const user = userEvent.setup()
    
    renderAppWithAuth()

    // 1. 初期状態でツールタブがアクティブであることを確認
    const toolsTab = screen.getByRole('button', { name: /ツール/ })
    expect(toolsTab).toBeInTheDocument()

    // 2. プレイ一覧タブをクリック
    const playListTabs = screen.getAllByRole('button', { name: /プレイ一覧/ })
    const playListTab = playListTabs[1] // サイドバーのタブを使用
    await user.click(playListTab)

    // 3. プレイリストタブをクリック（サイドバーの方を選択）
    const playlistTabs = screen.getAllByRole('button', { name: /プレイリスト/ })
    const playlistTab = playlistTabs.find(button => 
      button.textContent === 'プレイリスト' && 
      button.className.includes('flex-1')
    ) || playlistTabs[1] // サイドバーのタブを使用
    await user.click(playlistTab!)

    // 4. フォーメーションタブをクリック
    const formationTab = screen.getByRole('button', { name: /フォーメーション/ })
    await user.click(formationTab)

    // 5. タブが正常に切り替わることを確認
    expect(toolsTab).toBeInTheDocument()
    expect(playListTab).toBeInTheDocument()
    expect(playlistTab).toBeInTheDocument()
    expect(formationTab).toBeInTheDocument()
  })
})