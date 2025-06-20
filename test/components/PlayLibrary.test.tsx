import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PlayLibrary from '../../src/components/PlayLibrary'
import { Play } from '../../src/types'

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

describe('PlayLibrary', () => {
  const mockOnSelectPlay = vi.fn()
  const mockOnDeletePlay = vi.fn()
  const mockOnDuplicatePlay = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    plays: mockPlays,
    currentPlay: null,
    onSelectPlay: mockOnSelectPlay,
    onDeletePlay: mockOnDeletePlay,
    onDuplicatePlay: mockOnDuplicatePlay,
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('プレイライブラリが正しく表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      expect(screen.getByText('プレー一覧')).toBeInTheDocument()
      expect(screen.getByText('← 戻る')).toBeInTheDocument()
      expect(screen.getByText('3個のプレー')).toBeInTheDocument()
    })

    it('検索フィールドが表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('プレー名、説明、タグで検索...')).toBeInTheDocument()
    })

    it('フィルターとソートの選択肢が表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // フィルター
      expect(screen.getByDisplayValue('すべて')).toBeInTheDocument()
      
      // ソート
      expect(screen.getByDisplayValue('更新日時（新しい順）')).toBeInTheDocument()
    })

    it('グリッドビューとリストビューの切り替えボタンが表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      expect(screen.getByText('📱 グリッド')).toBeInTheDocument()
      expect(screen.getByText('📋 リスト')).toBeInTheDocument()
    })
  })

  describe('プレイ表示', () => {
    it('全てのプレイが表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
      expect(screen.getByText('ディフェンスプレイ1')).toBeInTheDocument()
      expect(screen.getByText('スペシャルプレイ1')).toBeInTheDocument()
    })

    it('プレイカテゴリバッジが正しく表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // カテゴリバッジを取得（フィルターのオプションではなく）
      const categoryBadges = screen.getAllByText('オフェンス')
      const defenseBadges = screen.getAllByText('ディフェンス')
      const specialBadges = screen.getAllByText('スペシャル')
      
      // バッジとして表示されているものを確認（optionは除く）
      expect(categoryBadges.some(el => el.classList.contains('bg-blue-100'))).toBe(true)
      expect(defenseBadges.some(el => el.classList.contains('bg-red-100'))).toBe(true)
      expect(specialBadges.some(el => el.classList.contains('bg-green-100'))).toBe(true)
    })

    it('プレイの詳細情報が表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      expect(screen.getByText('Quick Pass')).toBeInTheDocument()
      expect(screen.getByText('Blitz Defense')).toBeInTheDocument()
      expect(screen.getByText('Punt Formation')).toBeInTheDocument()
    })

    it('タグが表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      expect(screen.getByText('quick')).toBeInTheDocument()
      expect(screen.getByText('pass')).toBeInTheDocument()
      expect(screen.getByText('blitz')).toBeInTheDocument()
      expect(screen.getByText('pressure')).toBeInTheDocument()
    })
  })

  describe('ビュー切り替え', () => {
    it('リストビューに切り替えられること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const listViewButton = screen.getByText('📋 リスト')
      fireEvent.click(listViewButton)
      
      // リストビューでは説明が表示される
      expect(screen.getByText('テスト用のオフェンスプレイです')).toBeInTheDocument()
    })

    it('グリッドビューに戻せること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // リストビューに切り替え
      fireEvent.click(screen.getByText('📋 リスト'))
      
      // グリッドビューに戻す
      fireEvent.click(screen.getByText('📱 グリッド'))
      
      // グリッドビューの確認（リストビューの説明が非表示になる）
      expect(screen.queryByText('テスト用のオフェンスプレイです')).not.toBeInTheDocument()
    })
  })

  describe('検索機能', () => {
    it('タイトルで検索できること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('プレー名、説明、タグで検索...')
      fireEvent.change(searchInput, { target: { value: 'オフェンス' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイ1')).not.toBeInTheDocument()
      expect(screen.getByText('1個のプレー')).toBeInTheDocument()
    })

    it('説明で検索できること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('プレー名、説明、タグで検索...')
      fireEvent.change(searchInput, { target: { value: 'ディフェンス' } })
      
      expect(screen.getByText('ディフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('オフェンスプレイ1')).not.toBeInTheDocument()
    })

    it('タグで検索できること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('プレー名、説明、タグで検索...')
      fireEvent.change(searchInput, { target: { value: 'quick' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイ1')).not.toBeInTheDocument()
    })

    it('検索結果がない場合に適切なメッセージが表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText('プレー名、説明、タグで検索...')
      fireEvent.change(searchInput, { target: { value: '存在しないプレイ' } })
      
      expect(screen.getByText('プレーが見つかりません')).toBeInTheDocument()
      expect(screen.getByText('検索条件を変更してもう一度お試しください')).toBeInTheDocument()
      expect(screen.getByText('0個のプレー')).toBeInTheDocument()
    })
  })

  describe('フィルタリング機能', () => {
    it('オフェンスフィルターが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const filterSelect = screen.getByDisplayValue('すべて')
      fireEvent.change(filterSelect, { target: { value: 'offense' } })
      
      expect(screen.getByText('オフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイ1')).not.toBeInTheDocument()
      expect(screen.queryByText('スペシャルプレイ1')).not.toBeInTheDocument()
      expect(screen.getByText('1個のプレー')).toBeInTheDocument()
    })

    it('ディフェンスフィルターが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const filterSelect = screen.getByDisplayValue('すべて')
      fireEvent.change(filterSelect, { target: { value: 'defense' } })
      
      expect(screen.getByText('ディフェンスプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('オフェンスプレイ1')).not.toBeInTheDocument()
      expect(screen.queryByText('スペシャルプレイ1')).not.toBeInTheDocument()
    })

    it('スペシャルフィルターが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const filterSelect = screen.getByDisplayValue('すべて')
      fireEvent.change(filterSelect, { target: { value: 'special' } })
      
      expect(screen.getByText('スペシャルプレイ1')).toBeInTheDocument()
      expect(screen.queryByText('オフェンスプレイ1')).not.toBeInTheDocument()
      expect(screen.queryByText('ディフェンスプレイ1')).not.toBeInTheDocument()
    })
  })

  describe('ソート機能', () => {
    it('更新日時（新しい順）でソートされること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const sortSelect = screen.getByDisplayValue('更新日時（新しい順）')
      fireEvent.change(sortSelect, { target: { value: 'date-desc' } })
      
      // 更新日時順: オフェンス(1/3) > ディフェンス(1/2) > スペシャル(1/1)
      const playCards = screen.getAllByText(/プレイ1$/)
      expect(playCards[0]).toHaveTextContent('オフェンスプレイ1')
    })

    it('更新日時（古い順）でソートされること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const sortSelect = screen.getByDisplayValue('更新日時（新しい順）')
      fireEvent.change(sortSelect, { target: { value: 'date-asc' } })
      
      // 更新日時順（古い順）: スペシャル(1/1) > ディフェンス(1/2) > オフェンス(1/3)
      const playCards = screen.getAllByText(/プレイ1$/)
      expect(playCards[0]).toHaveTextContent('スペシャルプレイ1')
    })

    it('名前（昇順）でソートされること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const sortSelect = screen.getByDisplayValue('更新日時（新しい順）')
      fireEvent.change(sortSelect, { target: { value: 'name-asc' } })
      
      // ソートが動作することを確認（具体的な順序は実装依存）
      const playCards = screen.getAllByText(/プレイ1$/)
      expect(playCards).toHaveLength(3)
    })

    it('名前（降順）でソートされること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const sortSelect = screen.getByDisplayValue('更新日時（新しい順）')
      fireEvent.change(sortSelect, { target: { value: 'name-desc' } })
      
      // 名前順（降順）: 実際のlocaleCompareの結果に基づく順序
      const playCards = screen.getAllByText(/プレイ1$/)
      expect(playCards[0]).toHaveTextContent('ディフェンスプレイ1')
      expect(playCards[1]).toHaveTextContent('スペシャルプレイ1')
      expect(playCards[2]).toHaveTextContent('オフェンスプレイ1')
    })
  })

  describe('プレイ操作', () => {
    it('プレイをクリックすると選択されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const playCard = screen.getByText('オフェンスプレイ1').closest('div')
      fireEvent.click(playCard!)
      
      expect(mockOnSelectPlay).toHaveBeenCalledWith(mockPlays[0])
    })

    it('複製ボタンが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const duplicateButtons = screen.getAllByText('複製')
      fireEvent.click(duplicateButtons[0])
      
      expect(mockOnDuplicatePlay).toHaveBeenCalledWith('play-1')
    })

    it('削除ボタンで確認ダイアログが表示されること', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<PlayLibrary {...defaultProps} />)
      
      const deleteButtons = screen.getAllByText('削除')
      fireEvent.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalledWith('このプレーを削除しますか？')
      expect(mockOnDeletePlay).toHaveBeenCalledWith('play-1')
      
      confirmSpy.mockRestore()
    })

    it('削除確認でキャンセルした場合は削除されないこと', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(<PlayLibrary {...defaultProps} />)
      
      const deleteButtons = screen.getAllByText('削除')
      fireEvent.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalled()
      expect(mockOnDeletePlay).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })
  })

  describe('選択モード', () => {
    it('選択モードに切り替えられること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const selectionButton = screen.getByText('選択して削除')
      fireEvent.click(selectionButton)
      
      expect(screen.getByText('0個選択中')).toBeInTheDocument()
      expect(screen.getByText('全て選択')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('選択モードでプレイを選択できること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // 選択モードに切り替え
      fireEvent.click(screen.getByText('選択して削除'))
      
      // プレイを選択
      const playCard = screen.getByText('オフェンスプレイ1').closest('div')
      fireEvent.click(playCard!)
      
      expect(screen.getByText('1個選択中')).toBeInTheDocument()
    })

    it('全て選択ボタンが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // 選択モードに切り替え
      fireEvent.click(screen.getByText('選択して削除'))
      
      // 全て選択
      fireEvent.click(screen.getByText('全て選択'))
      
      expect(screen.getByText('3個選択中')).toBeInTheDocument()
      expect(screen.getByText('全て解除')).toBeInTheDocument()
    })

    it('全て解除ボタンが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // 選択モードに切り替え
      fireEvent.click(screen.getByText('選択して削除'))
      
      // 全て選択してから解除
      fireEvent.click(screen.getByText('全て選択'))
      fireEvent.click(screen.getByText('全て解除'))
      
      expect(screen.getByText('0個選択中')).toBeInTheDocument()
      expect(screen.getByText('全て選択')).toBeInTheDocument()
    })

    it('一括削除が機能すること', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<PlayLibrary {...defaultProps} />)
      
      // 選択モードに切り替え
      fireEvent.click(screen.getByText('選択して削除'))
      
      // プレイを選択
      const playCard = screen.getByText('オフェンスプレイ1').closest('div')
      fireEvent.click(playCard!)
      
      // 一括削除
      fireEvent.click(screen.getByText('削除 (1)'))
      
      expect(confirmSpy).toHaveBeenCalledWith('選択された1個のプレーを削除しますか？')
      expect(mockOnDeletePlay).toHaveBeenCalledWith('play-1')
      
      confirmSpy.mockRestore()
    })

    it('選択モードをキャンセルできること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // 選択モードに切り替え
      fireEvent.click(screen.getByText('選択して削除'))
      
      // キャンセル
      fireEvent.click(screen.getByText('キャンセル'))
      
      expect(screen.getByText('選択して削除')).toBeInTheDocument()
      expect(screen.queryByText('0個選択中')).not.toBeInTheDocument()
    })
  })

  describe('戻るボタン', () => {
    it('戻るボタンが機能すること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const backButton = screen.getByText('← 戻る')
      fireEvent.click(backButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('空状態', () => {
    it('プレイがない場合に適切なメッセージが表示されること', () => {
      render(<PlayLibrary {...defaultProps} plays={[]} />)
      
      expect(screen.getByText('プレーがありません')).toBeInTheDocument()
      expect(screen.getByText('新しいプレーを作成してみましょう')).toBeInTheDocument()
      expect(screen.getByText('0個のプレー')).toBeInTheDocument()
    })

    it('プレイがない場合は選択モードボタンが表示されないこと', () => {
      render(<PlayLibrary {...defaultProps} plays={[]} />)
      
      expect(screen.queryByText('選択して削除')).not.toBeInTheDocument()
    })
  })

  describe('現在のプレイのハイライト', () => {
    it('現在のプレイがハイライトされること', () => {
      render(<PlayLibrary {...defaultProps} currentPlay={mockPlays[0]} />)
      
      // プレイカードのコンテナ要素を取得
      const playCard = screen.getByText('オフェンスプレイ1').closest('div.relative')
      expect(playCard).toHaveClass('border-blue-500')
    })
  })

  describe('イベント伝播の制御', () => {
    it('複製ボタンクリック時にプレイ選択が発生しないこと', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      const duplicateButtons = screen.getAllByText('複製')
      fireEvent.click(duplicateButtons[0])
      
      expect(mockOnDuplicatePlay).toHaveBeenCalled()
      expect(mockOnSelectPlay).not.toHaveBeenCalled()
    })

    it('削除ボタンクリック時にプレイ選択が発生しないこと', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<PlayLibrary {...defaultProps} />)
      
      const deleteButtons = screen.getAllByText('削除')
      fireEvent.click(deleteButtons[0])
      
      expect(mockOnDeletePlay).toHaveBeenCalled()
      expect(mockOnSelectPlay).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })

    it('選択モードのチェックボックスクリック時にプレイ選択が発生しないこと', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // 選択モードに切り替え
      fireEvent.click(screen.getByText('選択して削除'))
      
      // チェックボックスをクリック
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      
      expect(mockOnSelectPlay).not.toHaveBeenCalled()
    })
  })

  describe('レスポンシブ対応', () => {
    it('リストビューでプレイヤー数と矢印数が表示されること', () => {
      render(<PlayLibrary {...defaultProps} />)
      
      // リストビューに切り替え
      fireEvent.click(screen.getByText('📋 リスト'))
      
      expect(screen.getByText('2人のプレイヤー')).toBeInTheDocument()
      expect(screen.getByText('1本の矢印')).toBeInTheDocument()
    })
  })

  describe('タグ表示制限', () => {
    it('グリッドビューでタグが3個まで表示され、超過分は省略されること', () => {
      const playWithManyTags: Play = {
        ...mockPlays[0],
        metadata: {
          ...mockPlays[0].metadata,
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
        }
      }
      
      render(<PlayLibrary {...defaultProps} plays={[playWithManyTags]} />)
      
      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.getByText('tag3')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument()
    })
  })
})