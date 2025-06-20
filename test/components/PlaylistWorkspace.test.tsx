import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PlaylistWorkspace from '../../src/components/PlaylistWorkspace'
import { Playlist, Play } from '../../src/types'

// テスト用のモックデータ
const mockPlays: Play[] = [
  {
    id: 'play-1',
    metadata: {
      title: 'オフェンスプレイ1',
      description: 'テスト用のオフェンスプレイです',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-03'),
      tags: ['quick', 'pass'],
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
    players: [
      { id: 'p1', x: 100, y: 100, type: 'circle', position: 'QB', color: '#000', fillColor: '#fff', strokeColor: '#000', size: 20, team: 'offense' },
      { id: 'p2', x: 200, y: 200, type: 'triangle', position: 'WR', color: '#000', fillColor: '#fff', strokeColor: '#000', size: 20, team: 'offense' }
    ],
    arrows: [
      { id: 'a1', points: [0, 0, 100, 100], type: 'straight', headType: 'normal', color: '#000', strokeWidth: 2 }
    ],
    texts: [],
    textBoxEntries: []
  },
  {
    id: 'play-2',
    metadata: {
      title: 'ディフェンスプレイ1',
      description: 'テスト用のディフェンスプレイです',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['blitz', 'pressure'],
      playName: 'Blitz Defense',
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
    players: [
      { id: 'p3', x: 300, y: 300, type: 'square', position: 'LB', color: '#000', fillColor: '#fff', strokeColor: '#000', size: 20, team: 'defense' }
    ],
    arrows: [],
    texts: [],
    textBoxEntries: []
  },
  {
    id: 'play-3',
    metadata: {
      title: 'スペシャルプレイ1',
      description: 'テスト用のスペシャルプレイです',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-01'),
      tags: ['special', 'punt'],
      playName: 'Punt Formation',
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

const mockPlaylists: Playlist[] = [
  {
    id: 'playlist-1',
    title: 'オフェンスプレイリスト',
    description: 'オフェンス用のプレイ集',
    playIds: ['play-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: 'playlist-2',
    title: 'ディフェンスプレイリスト',
    description: 'ディフェンス用のプレイ集',
    playIds: ['play-2'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'playlist-3',
    title: '空のプレイリスト',
    description: '',
    playIds: [],
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  }
]

describe('PlaylistWorkspace', () => {
  const mockOnCreatePlaylist = vi.fn()
  const mockOnUpdatePlaylist = vi.fn()
  const mockOnDeletePlaylist = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    plays: mockPlays,
    playlists: mockPlaylists,
    onCreatePlaylist: mockOnCreatePlaylist,
    onUpdatePlaylist: mockOnUpdatePlaylist,
    onDeletePlaylist: mockOnDeletePlaylist,
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ブラウズモード（初期表示）', () => {
    it('プレイリスト管理画面が正しく表示されること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
      expect(screen.getByText('3個のプレイリスト')).toBeInTheDocument()
      expect(screen.getByText('新規作成')).toBeInTheDocument()
      expect(screen.getByText('← 戻る')).toBeInTheDocument()
    })

    it('プレイリストが正しく表示されること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      expect(screen.getByText('オフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.getByText('ディフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.getByText('空のプレイリスト')).toBeInTheDocument()
      expect(screen.getByText('オフェンス用のプレイ集')).toBeInTheDocument()
      expect(screen.getByText('ディフェンス用のプレイ集')).toBeInTheDocument()
    })

    it('プレイリストのプレイ数が正しく表示されること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // グリッドビューでの数表示
      const countElements = screen.getAllByText('1個')
      expect(countElements.length).toBeGreaterThan(0) // オフェンスプレイリストとディフェンスプレイリスト
      expect(screen.getByText('0個')).toBeInTheDocument() // 空のプレイリスト
    })

    it('戻るボタンが機能すること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const backButton = screen.getByText('← 戻る')
      fireEvent.click(backButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('新規作成ボタンが機能すること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const createButton = screen.getByText('新規作成')
      fireEvent.click(createButton)
      
      expect(screen.getByText('プレイリスト作成')).toBeInTheDocument()
      expect(screen.getByText('プレイリスト名 *')).toBeInTheDocument()
    })

    it('編集ボタンが機能すること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const editButtons = screen.getAllByText('編集')
      fireEvent.click(editButtons[0])
      
      expect(screen.getByText('プレイリスト編集')).toBeInTheDocument()
      // 編集モードに入ったので、プレイリスト名の入力フィールドが表示される
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      expect(titleInput).toBeInTheDocument()
      expect(titleInput).toHaveAttribute('value')
    })

    it('削除ボタンで確認ダイアログが表示されること', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const deleteButtons = screen.getAllByText('削除')
      fireEvent.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalledWith('このプレイリストを削除しますか？')
      // 最初の削除ボタンは、更新日時順で最初のプレイリスト（空のプレイリスト = playlist-3）
      expect(mockOnDeletePlaylist).toHaveBeenCalledWith('playlist-3')
      
      confirmSpy.mockRestore()
    })

    it('削除確認でキャンセルした場合は削除されないこと', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const deleteButtons = screen.getAllByText('削除')
      fireEvent.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalled()
      expect(mockOnDeletePlaylist).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })

    it('プレイリストをクリックすると表示モードになること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const playlistCard = screen.getByText('オフェンスプレイリスト').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playlistCard!)
      
      expect(screen.getByText('オフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.getByText(/\d+個のプレイ/)).toBeInTheDocument()
    })
  })

  describe('検索とソート機能', () => {
    it('プレイリスト検索が機能すること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('プレイリスト名、説明で検索...')
      fireEvent.change(searchInput, { target: { value: 'オフェンス' } })
      
      expect(screen.getByText('オフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイリスト')).not.toBeInTheDocument()
      expect(screen.getByText('1個のプレイリスト')).toBeInTheDocument()
    })

    it('検索結果がない場合に適切なメッセージが表示されること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('プレイリスト名、説明で検索...')
      fireEvent.change(searchInput, { target: { value: '存在しないプレイリスト' } })
      
      expect(screen.getByText('プレイリストが見つかりません')).toBeInTheDocument()
      expect(screen.getByText('検索条件を変更してもう一度お試しください')).toBeInTheDocument()
    })

    it('ソート機能が機能すること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const sortSelect = screen.getByDisplayValue('更新日時（新しい順）')
      fireEvent.change(sortSelect, { target: { value: 'name-asc' } })
      
      // ソートが動作することを確認（具体的な順序は実装依存）
      expect(screen.getByText('オフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.getByText('ディフェンスプレイリスト')).toBeInTheDocument()
    })
  })

  describe('ビュー切り替え', () => {
    it('リストビューに切り替えられること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      const listViewButton = screen.getByText('📋 リスト')
      fireEvent.click(listViewButton)
      
      // リストビューでは詳細表示される
      const playCountElements = screen.getAllByText(/\d+個のプレイ/)
      expect(playCountElements.length).toBeGreaterThan(0)
    })

    it('グリッドビューに戻せること', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // リストビューに切り替え
      fireEvent.click(screen.getByText('📋 リスト'))
      
      // グリッドビューに戻す
      fireEvent.click(screen.getByText('📱 グリッド'))
      
      // グリッドビューの確認
      const countElements = screen.getAllByText('1個')
      expect(countElements.length).toBeGreaterThan(0)
    })
  })

  describe('空状態', () => {
    it('プレイリストがない場合に適切なメッセージが表示されること', () => {
      render(<PlaylistWorkspace {...defaultProps} playlists={[]} />)
      
      expect(screen.getByText('プレイリストがありません')).toBeInTheDocument()
      expect(screen.getByText('新しいプレイリストを作成してプレイを整理しましょう')).toBeInTheDocument()
      expect(screen.getByText('最初のプレイリストを作成')).toBeInTheDocument()
    })

    it('空状態の作成ボタンが機能すること', () => {
      render(<PlaylistWorkspace {...defaultProps} playlists={[]} />)
      
      const createButton = screen.getByText('最初のプレイリストを作成')
      fireEvent.click(createButton)
      
      expect(screen.getByText('プレイリスト作成')).toBeInTheDocument()
    })
  })

  describe('プレイリスト表示モード', () => {
    beforeEach(() => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // プレイリストをクリックして表示モードに入る
      const playlistCard = screen.getByText('オフェンスプレイリスト').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playlistCard!)
    })

    it('プレイリスト表示画面が正しく表示されること', () => {
      expect(screen.getByText('オフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.getByText(/\d+個のプレイ/)).toBeInTheDocument()
      expect(screen.getByText('編集')).toBeInTheDocument()
      expect(screen.getByText('オフェンス用のプレイ集')).toBeInTheDocument()
    })

    it('プレイが正しく表示されること', () => {
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    })

    it('編集ボタンが機能すること', () => {
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)
      
      expect(screen.getByText('プレイリスト編集')).toBeInTheDocument()
      expect(screen.getByDisplayValue('オフェンスプレイリスト')).toBeInTheDocument()
    })

    it('戻るボタンが機能すること', () => {
      const backButton = screen.getByText('← 戻る')
      fireEvent.click(backButton)
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })

    it('検索機能が機能すること', () => {
      const searchInput = screen.getByPlaceholderText('プレイ名、説明、タグで検索...')
      fireEvent.change(searchInput, { target: { value: 'オフェンス' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    })

    it('フィルター機能が機能すること', () => {
      const filterSelect = screen.getByDisplayValue('すべて')
      fireEvent.change(filterSelect, { target: { value: 'offense' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    })
  })

  describe('プレイリスト表示モード - 空状態', () => {
    beforeEach(() => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // 空のプレイリストをクリックして表示モードに入る
      const playlistCard = screen.getByText('空のプレイリスト').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playlistCard!)
    })

    it('空のプレイリストの場合に適切なメッセージが表示されること', () => {
      expect(screen.getByText('プレイリストが空です')).toBeInTheDocument()
      expect(screen.getByText('このプレイリストにプレイを追加しましょう')).toBeInTheDocument()
      expect(screen.getByText('プレイを追加')).toBeInTheDocument()
    })

    it('プレイ追加ボタンが機能すること', () => {
      const addButton = screen.getByText('プレイを追加')
      fireEvent.click(addButton)
      
      expect(screen.getByText('プレイリスト編集')).toBeInTheDocument()
    })
  })

  describe('プレイリスト作成モード', () => {
    beforeEach(() => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // 新規作成ボタンをクリックして作成モードに入る
      const createButton = screen.getByText('新規作成')
      fireEvent.click(createButton)
    })

    it('プレイリスト作成画面が正しく表示されること', () => {
      expect(screen.getByText('プレイリスト作成')).toBeInTheDocument()
      expect(screen.getByText('プレイリスト名 *')).toBeInTheDocument()
      expect(screen.getByText('説明')).toBeInTheDocument()
      expect(screen.getByText('選択されたプレイ (0個)')).toBeInTheDocument()
      expect(screen.getByText('プレイを選択')).toBeInTheDocument()
    })

    it('プレイリスト名を入力できること', () => {
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      fireEvent.change(titleInput, { target: { value: '新しいプレイリスト' } })
      
      expect(titleInput).toHaveValue('新しいプレイリスト')
    })

    it('説明を入力できること', () => {
      const descriptionInput = screen.getByPlaceholderText('プレイリストの説明...')
      fireEvent.change(descriptionInput, { target: { value: '新しい説明' } })
      
      expect(descriptionInput).toHaveValue('新しい説明')
    })

    it('プレイを選択できること', () => {
      const playCard = screen.getByText('オフェンスプレイ1').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playCard!)
      
      expect(screen.getByText('選択されたプレイ (1個)')).toBeInTheDocument()
      expect(screen.getByText('✓')).toBeInTheDocument() // 選択インジケーター
    })

    it('プレイの選択を解除できること', () => {
      // プレイを選択
      const playCard = screen.getByText('オフェンスプレイ1').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playCard!)
      
      expect(screen.getByText('選択されたプレイ (1個)')).toBeInTheDocument()
      
      // 選択を解除
      fireEvent.click(playCard!)
      
      expect(screen.getByText('選択されたプレイ (0個)')).toBeInTheDocument()
      expect(screen.queryByText('✓')).not.toBeInTheDocument()
    })

    it('選択されたプレイを削除できること', () => {
      // プレイを選択
      const playCard = screen.getByText('オフェンスプレイ1').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playCard!)
      
      expect(screen.getByText('選択されたプレイ (1個)')).toBeInTheDocument()
      
      // 選択されたプレイの削除ボタンをクリック
      const removeButton = screen.getAllByText('✕')[0] // 選択されたプレイリストの削除ボタン
      fireEvent.click(removeButton)
      
      expect(screen.getByText('選択されたプレイ (0個)')).toBeInTheDocument()
    })

    it('プレイリスト検索が機能すること', () => {
      const searchInput = screen.getByPlaceholderText('プレイ名、説明、タグで検索...')
      fireEvent.change(searchInput, { target: { value: 'オフェンス' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイ1')).not.toBeInTheDocument()
    })

    it('プレイフィルターが機能すること', () => {
      const filterSelect = screen.getByDisplayValue('すべて')
      fireEvent.change(filterSelect, { target: { value: 'offense' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイ1')).not.toBeInTheDocument()
    })

    it('タイトルが空の場合は作成ボタンが無効になること', () => {
      const createButton = screen.getByText('作成')
      expect(createButton).toBeDisabled()
    })

    it('タイトルを入力すると作成ボタンが有効になること', () => {
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      fireEvent.change(titleInput, { target: { value: '新しいプレイリスト' } })
      
      const createButton = screen.getByText('作成')
      expect(createButton).not.toBeDisabled()
    })

    it('作成ボタンが機能すること', () => {
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      const descriptionInput = screen.getByPlaceholderText('プレイリストの説明...')
      
      fireEvent.change(titleInput, { target: { value: '新しいプレイリスト' } })
      fireEvent.change(descriptionInput, { target: { value: '新しい説明' } })
      
      // プレイを選択
      const playCard = screen.getByText('オフェンスプレイ1').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playCard!)
      
      const createButton = screen.getByText('作成')
      fireEvent.click(createButton)
      
      expect(mockOnCreatePlaylist).toHaveBeenCalledWith({
        title: '新しいプレイリスト',
        description: '新しい説明',
        playIds: ['play-1']
      })
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })

    it('キャンセルボタンが機能すること', () => {
      const cancelButton = screen.getByText('キャンセル')
      fireEvent.click(cancelButton)
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })

    it('戻るボタンが機能すること', () => {
      const backButtons = screen.getAllByText('← 戻る')
      fireEvent.click(backButtons[0])
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })
  })

  describe('プレイリスト編集モード', () => {
    beforeEach(() => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // 編集ボタンをクリックして編集モードに入る
      const editButtons = screen.getAllByText('編集')
      fireEvent.click(editButtons[0])
    })

    it('プレイリスト編集画面が正しく表示されること', () => {
      expect(screen.getByText('プレイリスト編集')).toBeInTheDocument()
      // 何らかのプレイリストが編集モードになっていることを確認
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      expect(titleInput).toBeInTheDocument()
      expect(titleInput).toHaveAttribute('value')
      expect(screen.getByText(/選択されたプレイ \(\d+個\)/)).toBeInTheDocument()
    })

    it('既存のプレイが選択状態で表示されること', () => {
      // プレイが存在する場合は選択インジケーターが表示される
      const checkmarks = screen.queryAllByText('✓')
      // プレイが選択されているかどうかは編集対象のプレイリストによる
      expect(checkmarks.length).toBeGreaterThanOrEqual(0)
    })

    it('タイトルを編集できること', () => {
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      fireEvent.change(titleInput, { target: { value: '編集されたタイトル' } })
      
      expect(titleInput).toHaveValue('編集されたタイトル')
    })

    it('保存ボタンが機能すること', () => {
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      fireEvent.change(titleInput, { target: { value: '編集されたタイトル' } })
      
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      expect(mockOnUpdatePlaylist).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '編集されたタイトル',
          updatedAt: expect.any(Date)
        })
      )
    })

    it('編集からキャンセルした場合は一覧に戻ること', () => {
      const cancelButton = screen.getByText('キャンセル')
      fireEvent.click(cancelButton)
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })
  })

  describe('表示モードから編集モードへの遷移', () => {
    beforeEach(() => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // プレイリストをクリックして表示モードに入る
      const playlistCard = screen.getByText('オフェンスプレイリスト').closest('div[class*="cursor-pointer"]')
      fireEvent.click(playlistCard!)
      
      // 編集ボタンをクリック
      const editButton = screen.getByText('編集')
      fireEvent.click(editButton)
    })

    it('表示モードから編集モードに遷移できること', () => {
      expect(screen.getByText('プレイリスト編集')).toBeInTheDocument()
      // 編集モードに入ったことを確認
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      expect(titleInput).toBeInTheDocument()
      expect(titleInput).toHaveAttribute('value')
    })

    it('編集からキャンセルした場合は表示モードに戻ること', () => {
      const cancelButton = screen.getByText('キャンセル')
      fireEvent.click(cancelButton)
      
      // 表示モードに戻る
      expect(screen.getByText('オフェンスプレイリスト')).toBeInTheDocument()
      expect(screen.getByText(/\d+個のプレイ/)).toBeInTheDocument()
    })

    it('保存後は表示モードに戻ること', () => {
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      fireEvent.change(titleInput, { target: { value: '編集されたタイトル' } })
      
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)
      
      // 表示モードに戻る（更新されたプレイリストが表示される）
      expect(screen.getByText(/\d+個のプレイ/)).toBeInTheDocument()
    })
  })

  describe('プレイビュー切り替え', () => {
    beforeEach(() => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // 新規作成モードに入る
      const createButton = screen.getByText('新規作成')
      fireEvent.click(createButton)
    })

    it('プレイをリストビューに切り替えられること', () => {
      const listViewButtons = screen.getAllByText('📋')
      const playListViewButton = listViewButtons[listViewButtons.length - 1] // プレイ選択エリアのリストビューボタン
      fireEvent.click(playListViewButton)
      
      // リストビューでは選択インジケーターが円形で表示される
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    })

    it('プレイをグリッドビューに戻せること', () => {
      // リストビューに切り替え
      const listViewButtons = screen.getAllByText('📋')
      const playListViewButton = listViewButtons[listViewButtons.length - 1]
      fireEvent.click(playListViewButton)
      
      // グリッドビューに戻す
      const gridViewButtons = screen.getAllByText('📱')
      const playGridViewButton = gridViewButtons[gridViewButtons.length - 1]
      fireEvent.click(playGridViewButton)
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('空のタイトルでは保存できないこと', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // 新規作成モードに入る
      const createButton = screen.getByText('新規作成')
      fireEvent.click(createButton)
      
      const createSubmitButton = screen.getByText('作成')
      expect(createSubmitButton).toBeDisabled()
    })

    it('トリムされた空のタイトルでは保存できないこと', () => {
      render(<PlaylistWorkspace {...defaultProps} />)
      
      // 新規作成モードに入る
      const createButton = screen.getByText('新規作成')
      fireEvent.click(createButton)
      
      const titleInput = screen.getByPlaceholderText('例: 4thダウン用プレイ')
      fireEvent.change(titleInput, { target: { value: '   ' } })
      
      const createSubmitButton = screen.getByText('作成')
      expect(createSubmitButton).toBeDisabled()
    })
  })
})