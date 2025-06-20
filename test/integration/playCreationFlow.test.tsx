import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../src/App'
import { localStorageMock } from '../setup'

// 統合テスト: プレイ作成からプレイリストへの追加まで
describe('プレイ作成統合フロー', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('新しいプレイを作成してプレイリストに追加できること', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // 1. アプリケーションが正常に表示されることを確認
    expect(screen.getByText('Football Canvas')).toBeInTheDocument()

    // 2. 新しいプレイを作成
    const addPlayButton = screen.getByRole('button', { name: /新しいプレイを追加/ })
    await user.click(addPlayButton)

    // プレイ名を入力
    const playNameInput = screen.getByLabelText(/プレイ名/)
    await user.type(playNameInput, 'テスト統合プレイ')

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 3. プレイが作成されたことを確認
    await waitFor(() => {
      expect(screen.getByText('テスト統合プレイ')).toBeInTheDocument()
    })

    // 4. プレイリストを作成
    const createPlaylistButton = screen.getByRole('button', { name: /新しいプレイリストを作成/ })
    await user.click(createPlaylistButton)

    // プレイリスト名を入力
    const playlistNameInput = screen.getByLabelText(/プレイリスト名/)
    await user.type(playlistNameInput, 'テスト統合プレイリスト')

    // プレイリスト作成を確定
    const createButton = screen.getByRole('button', { name: /作成/ })
    await user.click(createButton)

    // 5. 作成したプレイをプレイリストに追加
    await waitFor(() => {
      expect(screen.getByText('テスト統合プレイリスト')).toBeInTheDocument()
    })

    // プレイを選択
    const playItem = screen.getByText('テスト統合プレイ')
    await user.click(playItem)

    // プレイリストに追加ボタンをクリック
    const addToPlaylistButton = screen.getByRole('button', { name: /プレイリストに追加/ })
    await user.click(addToPlaylistButton)

    // プレイリストを選択
    const playlistOption = screen.getByText('テスト統合プレイリスト')
    await user.click(playlistOption)

    // 6. プレイがプレイリストに追加されたことを確認
    await waitFor(() => {
      const playlistView = screen.getByTestId('playlist-view')
      expect(playlistView).toBeInTheDocument()
      expect(playlistView).toHaveTextContent('テスト統合プレイ')
    })

    // 7. データが localStorage に保存されていることを確認
    const storedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
    const storedPlaylists = JSON.parse(localStorageMock.getItem('football-canvas-playlists') || '[]')

    expect(storedPlays).toHaveLength(1)
    expect(storedPlays[0].name).toBe('テスト統合プレイ')
    
    expect(storedPlaylists).toHaveLength(1)
    expect(storedPlaylists[0].name).toBe('テスト統合プレイリスト')
    expect(storedPlaylists[0].plays).toHaveLength(1)
  })

  it('プレイ編集からプレイリスト更新までの完全なフローが動作すること', async () => {
    const user = userEvent.setup()
    
    // 初期データを設定
    const initialPlay = {
      id: 'test-play-1',
      name: '編集前プレイ',
      players: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const initialPlaylist = {
      id: 'test-playlist-1',
      name: 'テストプレイリスト',
      plays: ['test-play-1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([initialPlay]))
    localStorageMock.setItem('football-canvas-playlists', JSON.stringify([initialPlaylist]))

    render(<App />)

    // 1. プレイリストを開く
    const playlistItem = screen.getByText('テストプレイリスト')
    await user.click(playlistItem)

    // 2. プレイを編集
    const playItem = screen.getByText('編集前プレイ')
    await user.click(playItem)

    const editButton = screen.getByRole('button', { name: /編集/ })
    await user.click(editButton)

    // プレイ名を変更
    const playNameInput = screen.getByDisplayValue('編集前プレイ')
    await user.clear(playNameInput)
    await user.type(playNameInput, '編集後プレイ')

    // 保存
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 3. プレイリストに変更が反映されることを確認
    await waitFor(() => {
      expect(screen.getByText('編集後プレイ')).toBeInTheDocument()
      expect(screen.queryByText('編集前プレイ')).not.toBeInTheDocument()
    })

    // 4. データが正しく更新されていることを確認
    const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
    expect(updatedPlays[0].name).toBe('編集後プレイ')
  })

  it('プレイの削除がプレイリストからも削除されること', async () => {
    const user = userEvent.setup()
    
    // 初期データを設定
    const initialPlay = {
      id: 'test-play-delete',
      name: '削除予定プレイ',
      players: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const initialPlaylist = {
      id: 'test-playlist-delete',
      name: '削除テストプレイリスト',
      plays: ['test-play-delete'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([initialPlay]))
    localStorageMock.setItem('football-canvas-playlists', JSON.stringify([initialPlaylist]))

    render(<App />)

    // 1. プレイを削除
    const playItem = screen.getByText('削除予定プレイ')
    await user.click(playItem)

    const deleteButton = screen.getByRole('button', { name: /削除/ })
    await user.click(deleteButton)

    // 削除確認ダイアログで確定
    const confirmButton = screen.getByRole('button', { name: /確定/ })
    await user.click(confirmButton)

    // 2. プレイリストからも削除されていることを確認
    const playlistItem = screen.getByText('削除テストプレイリスト')
    await user.click(playlistItem)

    await waitFor(() => {
      expect(screen.queryByText('削除予定プレイ')).not.toBeInTheDocument()
    })

    // 3. データが正しく削除されていることを確認
    const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
    const updatedPlaylists = JSON.parse(localStorageMock.getItem('football-canvas-playlists') || '[]')

    expect(updatedPlays).toHaveLength(0)
    expect(updatedPlaylists[0].plays).toHaveLength(0)
  })

  it('複数のプレイを含むプレイリストの操作が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    // 複数のプレイを含む初期データを設定
    const initialPlays = [
      {
        id: 'play-1',
        name: 'プレイ1',
        players: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'play-2',
        name: 'プレイ2',
        players: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'play-3',
        name: 'プレイ3',
        players: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    const initialPlaylist = {
      id: 'multi-play-playlist',
      name: '複数プレイリスト',
      plays: ['play-1', 'play-2', 'play-3'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify(initialPlays))
    localStorageMock.setItem('football-canvas-playlists', JSON.stringify([initialPlaylist]))

    render(<App />)

    // 1. プレイリストを開く
    const playlistItem = screen.getByText('複数プレイリスト')
    await user.click(playlistItem)

    // 2. すべてのプレイが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.getByText('プレイ2')).toBeInTheDocument()
      expect(screen.getByText('プレイ3')).toBeInTheDocument()
    })

    // 3. プレイの順序を変更
    const playlistEditor = screen.getByTestId('playlist-editor')
    expect(playlistEditor).toBeInTheDocument()

    // プレイ2を選択して上に移動
    const play2Item = screen.getByText('プレイ2')
    await user.click(play2Item)

    const moveUpButton = screen.getByRole('button', { name: /上に移動/ })
    await user.click(moveUpButton)

    // 4. 順序が変更されたことを確認
    await waitFor(() => {
      const playItems = screen.getAllByTestId(/play-item/)
      expect(playItems[0]).toHaveTextContent('プレイ2')
      expect(playItems[1]).toHaveTextContent('プレイ1')
      expect(playItems[2]).toHaveTextContent('プレイ3')
    })

    // 5. 変更がデータに反映されていることを確認
    const updatedPlaylists = JSON.parse(localStorageMock.getItem('football-canvas-playlists') || '[]')
    expect(updatedPlaylists[0].plays).toEqual(['play-2', 'play-1', 'play-3'])
  })
})