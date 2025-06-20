import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PlaylistManager from '../../src/components/PlaylistManager'
import { Playlist, Play } from '../../src/types'

// テスト用のモックデータ
const mockPlays: Play[] = [
  {
    id: 'play-1',
    metadata: {
      title: 'テストプレイ1',
      description: 'テスト用のプレイ1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tags: ['test'],
      playName: 'Test Play 1',
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
    players: [],
    arrows: [],
    texts: [],
    textBoxEntries: []
  },
  {
    id: 'play-2',
    metadata: {
      title: 'テストプレイ2',
      description: 'テスト用のプレイ2',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['test'],
      playName: 'Test Play 2',
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
  }
]

const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-1',
    title: 'オフェンスプレイ集',
    description: 'オフェンス専用のプレイ集',
    playIds: ['play-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'playlist-2', 
    title: 'ディフェンスプレイ集',
    description: 'ディフェンス専用のプレイ集',
    playIds: ['play-2', 'invalid-play-id'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
]

describe('PlaylistManager', () => {
  const mockOnCreatePlaylist = vi.fn()
  const mockOnUpdatePlaylist = vi.fn()
  const mockOnDeletePlaylist = vi.fn()
  const mockOnSelectPlaylist = vi.fn()

  const defaultProps = {
    playlists: mockPlaylists,
    plays: mockPlays,
    onCreatePlaylist: mockOnCreatePlaylist,
    onUpdatePlaylist: mockOnUpdatePlaylist,
    onDeletePlaylist: mockOnDeletePlaylist,
    onSelectPlaylist: mockOnSelectPlaylist,
    currentPlaylist: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('プレイリスト一覧が正しく表示されること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    expect(screen.getByText('プレイリスト')).toBeInTheDocument()
    expect(screen.getByText('オフェンスプレイ集')).toBeInTheDocument()
    expect(screen.getByText('ディフェンスプレイ集')).toBeInTheDocument()
    expect(screen.getByText('オフェンス専用のプレイ集')).toBeInTheDocument()
    expect(screen.getByText('ディフェンス専用のプレイ集')).toBeInTheDocument()
  })

  it('プレイリストの統計情報が正しく表示されること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    // 両方のプレイリストで「📄 1プレイ」が表示される（複数存在する）
    expect(screen.getAllByText('📄 1プレイ')).toHaveLength(2)
    
    // 2番目のプレイリストには無効なプレイの警告も表示される
    expect(screen.getByText('⚠️ 1個のプレイが見つかりません')).toBeInTheDocument()
  })

  it('新規作成ボタンをクリックするとフォームが表示されること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    const createButton = screen.getByText('+ 新規作成')
    fireEvent.click(createButton)
    
    expect(screen.getByText('タイトル *')).toBeInTheDocument()
    expect(screen.getByText('説明')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('プレイリスト名を入力...')).toBeInTheDocument()
    expect(screen.getByText('作成')).toBeInTheDocument()
    expect(screen.getByText('キャンセル')).toBeInTheDocument()
  })

  it('新しいプレイリストが正しく作成されること', async () => {
    render(<PlaylistManager {...defaultProps} />)
    
    // 新規作成フォームを開く
    fireEvent.click(screen.getByText('+ 新規作成'))
    
    // フォームに入力
    const titleInput = screen.getByPlaceholderText('プレイリスト名を入力...')
    const descriptionInput = screen.getByPlaceholderText('プレイリストの説明（オプション）')
    
    fireEvent.change(titleInput, { target: { value: '新しいプレイリスト' } })
    fireEvent.change(descriptionInput, { target: { value: '新しい説明' } })
    
    // 作成ボタンをクリック
    fireEvent.click(screen.getByText('作成'))
    
    // onCreatePlaylistが正しい引数で呼ばれることを確認
    expect(mockOnCreatePlaylist).toHaveBeenCalledWith({
      title: '新しいプレイリスト',
      description: '新しい説明',
      playIds: []
    })
  })

  it('タイトルが空の場合は作成ボタンが無効になること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    fireEvent.click(screen.getByText('+ 新規作成'))
    
    const createButton = screen.getByText('作成')
    expect(createButton).toBeDisabled()
    
    // スペースのみの場合も無効
    const titleInput = screen.getByPlaceholderText('プレイリスト名を入力...')
    fireEvent.change(titleInput, { target: { value: '   ' } })
    expect(createButton).toBeDisabled()
    
    // 有効なタイトルを入力すると有効になる
    fireEvent.change(titleInput, { target: { value: '有効なタイトル' } })
    expect(createButton).not.toBeDisabled()
  })

  it('キャンセルボタンでフォームが閉じること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    fireEvent.click(screen.getByText('+ 新規作成'))
    
    // 何か入力
    fireEvent.change(screen.getByPlaceholderText('プレイリスト名を入力...'), { 
      target: { value: 'テスト' } 
    })
    
    // キャンセル
    fireEvent.click(screen.getByText('キャンセル'))
    
    // フォームが非表示になり、入力がクリアされることを確認
    expect(screen.queryByText('タイトル *')).not.toBeInTheDocument()
    
    // 再度開いた時に入力がクリアされていることを確認
    fireEvent.click(screen.getByText('+ 新規作成'))
    expect(screen.getByPlaceholderText('プレイリスト名を入力...')).toHaveValue('')
  })

  it('プレイリストをクリックすると選択されること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    const firstPlaylist = screen.getByText('オフェンスプレイ集')
    fireEvent.click(firstPlaylist)
    
    expect(mockOnSelectPlaylist).toHaveBeenCalledWith(mockPlaylists[0])
  })

  it('選択されたプレイリストが視覚的にハイライトされること', () => {
    render(<PlaylistManager {...defaultProps} currentPlaylist={mockPlaylists[0]} />)
    
    // プレイリストのコンテナ要素を取得（最も外側のdiv要素）
    const selectedPlaylistContainer = screen.getByText('オフェンスプレイ集').closest('div.p-4')
    expect(selectedPlaylistContainer).toHaveClass('border-blue-500', 'bg-blue-50')
  })

  it('削除ボタンで確認ダイアログが表示され、削除されること', () => {
    // window.confirmをモック
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    render(<PlaylistManager {...defaultProps} />)
    
    const deleteButtons = screen.getAllByTitle('プレイリストを削除')
    fireEvent.click(deleteButtons[0])
    
    expect(confirmSpy).toHaveBeenCalledWith(
      'このプレイリストを削除しますか？\n※プレイ自体は削除されません'
    )
    expect(mockOnDeletePlaylist).toHaveBeenCalledWith('playlist-1')
    
    confirmSpy.mockRestore()
  })

  it('削除の確認ダイアログでキャンセルした場合は削除されないこと', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    render(<PlaylistManager {...defaultProps} />)
    
    const deleteButtons = screen.getAllByTitle('プレイリストを削除')
    fireEvent.click(deleteButtons[0])
    
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockOnDeletePlaylist).not.toHaveBeenCalled()
    
    confirmSpy.mockRestore()
  })

  it('プレイリストが空の場合は空状態メッセージが表示されること', () => {
    render(<PlaylistManager {...defaultProps} playlists={[]} />)
    
    expect(screen.getByText('プレイリストがありません')).toBeInTheDocument()
    expect(screen.getByText('新しいプレイリストを作成して、プレイを整理しましょう')).toBeInTheDocument()
  })

  it('含まれるプレイが正しく表示されること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    // 最初のプレイリストには「テストプレイ1」が含まれる
    expect(screen.getByText('• テストプレイ1')).toBeInTheDocument()
    
    // 2番目のプレイリストには「テストプレイ2」と削除済みプレイが含まれる
    expect(screen.getByText('• テストプレイ2')).toBeInTheDocument()
    expect(screen.getByText('• [削除済みのプレイ]')).toBeInTheDocument()
  })

  it('プレイが3個以上ある場合は「...他X個のプレイ」と表示されること', () => {
    const playlistWithManyPlays: Playlist = {
      id: 'playlist-many',
      title: 'たくさんのプレイ',
      description: '',
      playIds: ['play-1', 'play-2', 'play-3', 'play-4', 'play-5'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    render(<PlaylistManager {...defaultProps} playlists={[playlistWithManyPlays]} />)
    
    expect(screen.getByText('...他2個のプレイ')).toBeInTheDocument()
  })

  it('更新日時が正しく表示されること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    // toLocaleDateStringの結果をテスト
    const expectedDate = mockPlaylists[0].updatedAt.toLocaleDateString()
    expect(screen.getByText(`更新: ${expectedDate}`)).toBeInTheDocument()
  })

  it('削除ボタンクリック時にイベントの伝播が停止されること', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    render(<PlaylistManager {...defaultProps} />)
    
    const deleteButtons = screen.getAllByTitle('プレイリストを削除')
    fireEvent.click(deleteButtons[0])
    
    // 削除は実行されるが、プレイリストの選択は実行されない
    expect(mockOnDeletePlaylist).toHaveBeenCalledWith('playlist-1')
    expect(mockOnSelectPlaylist).not.toHaveBeenCalled()
    
    confirmSpy.mockRestore()
  })

  it('プレイリスト作成後にフォームがリセットされること', () => {
    render(<PlaylistManager {...defaultProps} />)
    
    // フォームを開いて入力
    fireEvent.click(screen.getByText('+ 新規作成'))
    fireEvent.change(screen.getByPlaceholderText('プレイリスト名を入力...'), { 
      target: { value: 'テストタイトル' } 
    })
    fireEvent.change(screen.getByPlaceholderText('プレイリストの説明（オプション）'), { 
      target: { value: 'テスト説明' } 
    })
    
    // 作成
    fireEvent.click(screen.getByText('作成'))
    
    // フォームが閉じることを確認
    expect(screen.queryByText('タイトル *')).not.toBeInTheDocument()
    
    // 再度開いた時にフィールドがクリアされていることを確認
    fireEvent.click(screen.getByText('+ 新規作成'))
    expect(screen.getByPlaceholderText('プレイリスト名を入力...')).toHaveValue('')
    expect(screen.getByPlaceholderText('プレイリストの説明（オプション）')).toHaveValue('')
  })
})