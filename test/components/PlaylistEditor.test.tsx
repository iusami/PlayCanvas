import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PlaylistEditor from '../../src/components/PlaylistEditor'
import { Playlist, Play } from '../../src/types'

// テスト用のモックデータ
const mockPlays: Play[] = [
  {
    id: 'play-1',
    metadata: {
      title: 'オフェンスプレイ1',
      description: 'テスト用のオフェンスプレイ',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tags: ['offense'],
      playName: 'Quick Pass',
      offFormation: 'I-Formation',
      defFormation: '4-3',
      playType: 'offense'
    },
    field: {
      width: 800,
      height: 600,
      backgroundColor: '#4F7942',
      lineColor: '#FFFFFF',
      yardLines: true,
      hashMarks: true
    },
    players: [{ id: 'p1', x: 100, y: 100, type: 'circle', position: 'QB', color: '#000', fillColor: '#fff', strokeColor: '#000', size: 20, team: 'offense' }],
    arrows: [{ id: 'a1', points: [0, 0, 100, 100], type: 'straight', headType: 'normal', color: '#000', strokeWidth: 2 }],
    texts: [{ id: 't1', x: 50, y: 50, text: 'Test', fontSize: 16, fontFamily: 'Arial', color: '#000' }],
    textBoxEntries: []
  },
  {
    id: 'play-2',
    metadata: {
      title: 'ディフェンスプレイ1',
      description: 'テスト用のディフェンスプレイ',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['defense'],
      playName: 'Blitz',
      offFormation: 'Spread',
      defFormation: '3-4',
      playType: 'defense'
    },
    field: {
      width: 800,
      height: 600,
      backgroundColor: '#4F7942',
      lineColor: '#FFFFFF',
      yardLines: true,
      hashMarks: true
    },
    players: [],
    arrows: [],
    texts: [],
    textBoxEntries: []
  },
  {
    id: 'play-3',
    metadata: {
      title: 'スペシャルプレイ1',
      description: 'テスト用のスペシャルプレイ',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      tags: ['special'],
      playName: 'Punt',
      offFormation: 'Punt',
      defFormation: 'Punt Return',
      playType: 'special'
    },
    field: {
      width: 800,
      height: 600,
      backgroundColor: '#4F7942',
      lineColor: '#FFFFFF',
      yardLines: true,
      hashMarks: true
    },
    players: [],
    arrows: [],
    texts: [],
    textBoxEntries: []
  }
]

const mockPlaylist: Playlist = {
  id: 'playlist-1',
  title: 'テストプレイリスト',
  description: 'テスト用のプレイリスト',
  playIds: ['play-1', 'play-2'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

describe('PlaylistEditor', () => {
  const mockOnUpdatePlaylist = vi.fn()
  const mockOnBack = vi.fn()

  const defaultProps = {
    playlist: mockPlaylist,
    allPlays: mockPlays,
    onUpdatePlaylist: mockOnUpdatePlaylist,
    onBack: mockOnBack
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('プレイリスト編集画面が正しく表示されること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    expect(screen.getByText('プレイリスト編集')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テストプレイリスト')).toBeInTheDocument()
    expect(screen.getByDisplayValue('テスト用のプレイリスト')).toBeInTheDocument()
    expect(screen.getByText('プレイリスト内容 (2プレイ)')).toBeInTheDocument()
    expect(screen.getByText('利用可能なプレイ (1プレイ)')).toBeInTheDocument()
  })

  it('戻るボタンが機能すること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const backButton = screen.getByText('← 戻る')
    fireEvent.click(backButton)
    
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('プレイリスト内のプレイが正しく表示されること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    expect(screen.getByText('ディフェンスプレイ1')).toBeInTheDocument()
    expect(screen.getByText('Quick Pass')).toBeInTheDocument()
    expect(screen.getByText('Blitz')).toBeInTheDocument()
    
    // プレイの統計情報が表示されること
    expect(screen.getByText('プレイヤー: 1')).toBeInTheDocument()
    expect(screen.getByText('矢印: 1')).toBeInTheDocument()
    expect(screen.getByText('テキスト: 1')).toBeInTheDocument()
  })

  it('利用可能なプレイが正しく表示されること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    expect(screen.getByText('スペシャルプレイ1')).toBeInTheDocument()
    expect(screen.getByText('Punt')).toBeInTheDocument()
  })

  it('プレイリストにプレイを追加できること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // 追加ボタンをクリック
    const addButtons = screen.getAllByTitle('プレイリストに追加')
    fireEvent.click(addButtons[0])
    
    // プレイリスト内容が更新されることを確認
    expect(screen.getByText('プレイリスト内容 (3プレイ)')).toBeInTheDocument()
    expect(screen.getByText('利用可能なプレイ (0プレイ)')).toBeInTheDocument()
  })

  it('プレイリストからプレイを削除できること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // 削除ボタンをクリック
    const removeButtons = screen.getAllByTitle('プレイリストから削除')
    fireEvent.click(removeButtons[0])
    
    // プレイリスト内容が更新されることを確認
    expect(screen.getByText('プレイリスト内容 (1プレイ)')).toBeInTheDocument()
    expect(screen.getByText('利用可能なプレイ (2プレイ)')).toBeInTheDocument()
  })

  it('プレイの順序を上に移動できること', async () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // 初期状態の確認
    expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    expect(screen.getByText('ディフェンスプレイ1')).toBeInTheDocument()
    
    // 2番目のプレイを上に移動
    const upButtons = screen.getAllByTitle('上に移動')
    fireEvent.click(upButtons[1]) // 2番目の上矢印ボタン
    
    // 変更状態が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('⚠️ 変更が保存されていません')).toBeInTheDocument()
    })
  })

  it('プレイの順序を下に移動できること', async () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // 初期状態の確認
    expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    expect(screen.getByText('ディフェンスプレイ1')).toBeInTheDocument()
    
    // 1番目のプレイを下に移動
    const downButtons = screen.getAllByTitle('下に移動')
    fireEvent.click(downButtons[0]) // 1番目の下矢印ボタン
    
    // 変更状態が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('⚠️ 変更が保存されていません')).toBeInTheDocument()
    })
  })

  it('最初のプレイの上移動ボタンが無効になること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const upButtons = screen.getAllByTitle('上に移動')
    expect(upButtons[0]).toBeDisabled()
  })

  it('最後のプレイの下移動ボタンが無効になること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const downButtons = screen.getAllByTitle('下に移動')
    expect(downButtons[1]).toBeDisabled() // 2番目（最後）のプレイ
  })

  it('検索機能が正しく動作すること', async () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText('プレイを検索...')
    
    // 初期状態でスペシャルプレイが表示されていることを確認
    expect(screen.getByText('スペシャルプレイ1')).toBeInTheDocument()
    
    // "スペシャル"で検索
    fireEvent.change(searchInput, { target: { value: 'スペシャル' } })
    await waitFor(() => {
      expect(screen.getByText('スペシャルプレイ1')).toBeInTheDocument()
    })
    
    // "punt"で検索（プレイ名で検索）
    fireEvent.change(searchInput, { target: { value: 'punt' } })
    await waitFor(() => {
      expect(screen.getByText('スペシャルプレイ1')).toBeInTheDocument()
    })
    
    // マッチしない検索
    fireEvent.change(searchInput, { target: { value: 'xyz' } })
    await waitFor(() => {
      expect(screen.getByText('プレイが見つかりません')).toBeInTheDocument()
      expect(screen.getByText('検索条件を変更してみてください')).toBeInTheDocument()
    })
  })

  it('タイトルと説明を編集できること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    const descriptionInput = screen.getByDisplayValue('テスト用のプレイリスト')
    
    fireEvent.change(titleInput, { target: { value: '新しいタイトル' } })
    fireEvent.change(descriptionInput, { target: { value: '新しい説明' } })
    
    expect(titleInput).toHaveValue('新しいタイトル')
    expect(descriptionInput).toHaveValue('新しい説明')
  })

  it('変更がある場合に保存ボタンが有効になること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const saveButtons = screen.getAllByText('保存')
    const headerSaveButton = saveButtons[0] // ヘッダーの保存ボタン
    expect(headerSaveButton).toHaveProperty('disabled', true)
    
    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    fireEvent.change(titleInput, { target: { value: '変更されたタイトル' } })
    
    expect(headerSaveButton).not.toHaveProperty('disabled', true)
  })

  it('変更がある場合に警告バーが表示されること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // 初期状態では警告バーは非表示
    expect(screen.queryByText('⚠️ 変更が保存されていません')).not.toBeInTheDocument()
    
    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    fireEvent.change(titleInput, { target: { value: '変更されたタイトル' } })
    
    // 警告バーが表示される
    expect(screen.getByText('⚠️ 変更が保存されていません')).toBeInTheDocument()
  })

  it('保存機能が正しく動作すること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    fireEvent.change(titleInput, { target: { value: '新しいタイトル' } })
    
    // プレイを追加
    const addButtons = screen.getAllByTitle('プレイリストに追加')
    fireEvent.click(addButtons[0])
    
    // ヘッダーの保存ボタンをクリック（最初の保存ボタン）
    const saveButtons = screen.getAllByText('保存')
    fireEvent.click(saveButtons[0])
    
    // onUpdatePlaylistが正しい引数で呼ばれることを確認
    expect(mockOnUpdatePlaylist).toHaveBeenCalledWith({
      ...mockPlaylist,
      title: '新しいタイトル',
      playIds: ['play-1', 'play-2', 'play-3'],
      updatedAt: expect.any(Date)
    })
  })

  it('保存後に変更状態がリセットされること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    fireEvent.change(titleInput, { target: { value: '新しいタイトル' } })
    
    // 変更状態確認
    expect(screen.getByText('⚠️ 変更が保存されていません')).toBeInTheDocument()
    
    // 保存（ヘッダーの保存ボタン）
    const saveButtons = screen.getAllByText('保存')
    fireEvent.click(saveButtons[0])
    
    // 変更状態がリセットされる
    expect(screen.queryByText('⚠️ 変更が保存されていません')).not.toBeInTheDocument()
    expect(saveButtons[0]).toHaveProperty('disabled', true)
  })

  it('警告バーの保存ボタンも機能すること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    fireEvent.change(titleInput, { target: { value: '新しいタイトル' } })
    
    // 警告バーの保存ボタンをクリック
    const warningSaveButton = screen.getAllByText('保存')[1] // 警告バー内の保存ボタン
    fireEvent.click(warningSaveButton)
    
    expect(mockOnUpdatePlaylist).toHaveBeenCalled()
  })

  it('プレイリストが空の場合の表示が正しいこと', () => {
    const emptyPlaylist = { ...mockPlaylist, playIds: [] }
    render(<PlaylistEditor {...defaultProps} playlist={emptyPlaylist} />)
    
    expect(screen.getByText('プレイがありません')).toBeInTheDocument()
    expect(screen.getByText('右側からプレイを追加してください')).toBeInTheDocument()
    expect(screen.getByText('プレイリスト内容 (0プレイ)')).toBeInTheDocument()
    expect(screen.getByText('利用可能なプレイ (3プレイ)')).toBeInTheDocument()
  })

  it('利用可能なプレイが空の場合の表示が正しいこと', () => {
    const fullPlaylist = { ...mockPlaylist, playIds: ['play-1', 'play-2', 'play-3'] }
    render(<PlaylistEditor {...defaultProps} playlist={fullPlaylist} />)
    
    expect(screen.getByText('プレイが見つかりません')).toBeInTheDocument()
    expect(screen.getByText('利用可能なプレイ (0プレイ)')).toBeInTheDocument()
  })

  it('プレイの番号が正しく表示されること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
  })

  it('空白のタイトルでも保存できること', () => {
    render(<PlaylistEditor {...defaultProps} />)
    
    const titleInput = screen.getByDisplayValue('テストプレイリスト')
    fireEvent.change(titleInput, { target: { value: '   ' } })
    
    const saveButtons = screen.getAllByText('保存')
    fireEvent.click(saveButtons[0]) // ヘッダーの保存ボタン
    
    // トリムされた値で保存される
    expect(mockOnUpdatePlaylist).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '',
        description: 'テスト用のプレイリスト'
      })
    )
  })
})