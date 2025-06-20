import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../src/App'
import { localStorageMock } from '../setup'

// 統合テスト: バックアップ・復元の完全なフロー
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

  it('データのバックアップとファイルダウンロードが正常に動作すること', async () => {
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
      },
      {
        id: 'backup-play-2',
        name: 'バックアップテストプレイ2',
        players: [
          { id: 'player-2', position: { x: 150, y: 250 }, team: 'defense', number: 2 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    const testPlaylists = [
      {
        id: 'backup-playlist-1',
        name: 'バックアップテストプレイリスト',
        plays: ['backup-play-1', 'backup-play-2'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const testSettings = {
      theme: 'dark',
      autoSave: true,
      backupSettings: {
        autoBackup: true,
        backupInterval: 24,
        maxBackups: 10
      }
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify(testPlays))
    localStorageMock.setItem('football-canvas-playlists', JSON.stringify(testPlaylists))
    localStorageMock.setItem('football-canvas-settings', JSON.stringify(testSettings))

    render(<App />)

    // 1. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    // 2. バックアップタブを選択
    const backupTab = screen.getByRole('tab', { name: /バックアップ/ })
    await user.click(backupTab)

    // 3. バックアップを実行
    const backupButton = screen.getByRole('button', { name: /バックアップを作成/ })
    await user.click(backupButton)

    // 4. バックアップファイルがダウンロードされることを確認
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
    })

    // 5. バックアップデータの内容が正しいことを確認
    const createObjectURLCall = vi.mocked(global.URL.createObjectURL).mock.calls[0]
    const backupBlob = createObjectURLCall[0] as Blob
    
    const backupText = await backupBlob.text()
    const backupData = JSON.parse(backupText)

    expect(backupData.plays).toEqual(testPlays)
    expect(backupData.playlists).toEqual(testPlaylists)
    expect(backupData.settings).toEqual(testSettings)
    expect(backupData.version).toBeDefined()
    expect(backupData.timestamp).toBeDefined()
  })

  it('バックアップファイルの復元が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    // 復元用のバックアップデータを準備
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      plays: [
        {
          id: 'restored-play-1',
          name: '復元されたプレイ1',
          players: [
            { id: 'restored-player-1', position: { x: 300, y: 400 }, team: 'offense', number: 10 }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      playlists: [
        {
          id: 'restored-playlist-1',
          name: '復元されたプレイリスト',
          plays: ['restored-play-1'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      settings: {
        theme: 'light',
        autoSave: false,
        backupSettings: {
          autoBackup: false,
          backupInterval: 12,
          maxBackups: 5
        }
      }
    }

    const backupFile = new File([JSON.stringify(backupData)], 'test-backup.json', {
      type: 'application/json'
    })

    render(<App />)

    // 1. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    // 2. バックアップタブを選択
    const backupTab = screen.getByRole('tab', { name: /バックアップ/ })
    await user.click(backupTab)

    // 3. ファイル選択
    const fileInput = screen.getByLabelText(/バックアップファイルを選択/)
    await user.upload(fileInput, backupFile)

    // 4. 復元を実行
    const restoreButton = screen.getByRole('button', { name: /復元を実行/ })
    await user.click(restoreButton)

    // 5. 確認ダイアログで確定
    const confirmButton = screen.getByRole('button', { name: /確定/ })
    await user.click(confirmButton)

    // 6. データが復元されたことを確認
    await waitFor(() => {
      const restoredPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const restoredPlaylists = JSON.parse(localStorageMock.getItem('football-canvas-playlists') || '[]')
      const restoredSettings = JSON.parse(localStorageMock.getItem('football-canvas-settings') || '{}')

      expect(restoredPlays).toEqual(backupData.plays)
      expect(restoredPlaylists).toEqual(backupData.playlists)
      expect(restoredSettings).toEqual(backupData.settings)
    })

    // 7. UIが更新されていることを確認
    await waitFor(() => {
      expect(screen.getByText('復元されたプレイ1')).toBeInTheDocument()
      expect(screen.getByText('復元されたプレイリスト')).toBeInTheDocument()
    })
  })

  it('自動バックアップが設定に基づいて実行されること', async () => {
    const user = userEvent.setup()
    
    // 自動バックアップが有効な設定を準備
    const autoBackupSettings = {
      theme: 'dark',
      autoSave: true,
      backupSettings: {
        autoBackup: true,
        backupInterval: 1, // 1時間間隔でテスト
        maxBackups: 3
      }
    }

    localStorageMock.setItem('football-canvas-settings', JSON.stringify(autoBackupSettings))
    
    // 最後のバックアップ時刻を2時間前に設定
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    localStorageMock.setItem('football-canvas-last-auto-backup', twoHoursAgo)

    // タイマーをモック
    vi.useFakeTimers()

    render(<App />)

    // 1. 自動バックアップスケジューラーが開始されることを確認
    await waitFor(() => {
      // スケジューラーが開始されているかの間接的確認
      expect(screen.getByText('Football Canvas')).toBeInTheDocument()
    })

    // 2. 時間を進めて自動バックアップをトリガー
    vi.advanceTimersByTime(60 * 60 * 1000) // 1時間進める

    // 3. 自動バックアップが実行されることを確認
    await waitFor(() => {
      const lastBackupTime = localStorageMock.getItem('football-canvas-last-auto-backup')
      expect(lastBackupTime).not.toBe(twoHoursAgo) // 更新されている
    })

    vi.useRealTimers()
  })

  it('不正なバックアップファイルの復元でエラーハンドリングが動作すること', async () => {
    const user = userEvent.setup()
    
    // 不正なバックアップファイルを準備
    const invalidBackupFile = new File(['invalid json content'], 'invalid-backup.json', {
      type: 'application/json'
    })

    render(<App />)

    // 1. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    // 2. バックアップタブを選択
    const backupTab = screen.getByRole('tab', { name: /バックアップ/ })
    await user.click(backupTab)

    // 3. 不正なファイルを選択
    const fileInput = screen.getByLabelText(/バックアップファイルを選択/)
    await user.upload(fileInput, invalidBackupFile)

    // 4. 復元を実行
    const restoreButton = screen.getByRole('button', { name: /復元を実行/ })
    await user.click(restoreButton)

    // 5. エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/バックアップファイルが不正です/)).toBeInTheDocument()
    })

    // 6. データが変更されていないことを確認
    const originalPlays = localStorageMock.getItem('football-canvas-plays')
    const originalPlaylists = localStorageMock.getItem('football-canvas-playlists')
    
    expect(originalPlays).toBeNull() // 初期状態のまま
    expect(originalPlaylists).toBeNull() // 初期状態のまま
  })

  it('バックアップファイルのバージョン互換性チェックが動作すること', async () => {
    const user = userEvent.setup()
    
    // 異なるバージョンのバックアップデータを準備
    const futureVersionBackup = {
      version: '99.0.0', // 未来のバージョン
      timestamp: new Date().toISOString(),
      plays: [],
      playlists: [],
      settings: {}
    }

    const futureVersionFile = new File([JSON.stringify(futureVersionBackup)], 'future-version.json', {
      type: 'application/json'
    })

    render(<App />)

    // 1. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    // 2. バックアップタブを選択
    const backupTab = screen.getByRole('tab', { name: /バックアップ/ })
    await user.click(backupTab)

    // 3. 未来のバージョンのファイルを選択
    const fileInput = screen.getByLabelText(/バックアップファイルを選択/)
    await user.upload(fileInput, futureVersionFile)

    // 4. 復元を実行
    const restoreButton = screen.getByRole('button', { name: /復元を実行/ })
    await user.click(restoreButton)

    // 5. バージョン警告が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/バックアップファイルのバージョンが新しすぎます/)).toBeInTheDocument()
    })
  })
})