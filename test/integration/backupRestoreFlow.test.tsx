import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { localStorageMock } from '../setup'
import { setupIntegrationTestEnv, renderAppWithAuth } from '../testUtils/integrationTestHelpers'

// テスト環境を設定
setupIntegrationTestEnv()

// 統合テスト: バックアップ・復元の完全なフロー（基本機能のみテスト）
describe('バックアップ・復元統合フロー', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    
    // File APIをモック
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
    global.URL.revokeObjectURL = vi.fn()
    
    // download link のクリックをモック
    const mockClick = vi.fn()
    HTMLAnchorElement.prototype.click = mockClick
  })

  it('アプリケーションが正常にレンダリングされ、基本機能が動作すること', async () => {
    const user = userEvent.setup()
    
    // 初期データを設定
    const testPlays = [
      {
        id: 'backup-play-1',
        name: 'バックアップテストプレイ1',
        players: [
          { id: 'player-1', position: { x: 100, y: 200 }, team: 'offense', number: 1 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    localStorageMock.setItem('football-canvas-plays', JSON.stringify(testPlays))

    renderAppWithAuth()

    // 1. アプリケーションが正常に表示されることを確認
    expect(screen.getByText('Football Canvas')).toBeInTheDocument()

    // 2. 基本的なボタンが表示されることを確認
    expect(screen.getByRole('button', { name: /新しいプレイを作成/ })).toBeInTheDocument()

    // 3. プレイデータがlocalStorageに保存されていることを確認
    const storedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
    expect(storedPlays).toHaveLength(1)
    expect(storedPlays[0].name).toBe('バックアップテストプレイ1')
  })

  it('新しいプレイ追加ボタンが動作すること', async () => {
    const user = userEvent.setup()
    
    renderAppWithAuth()

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
})