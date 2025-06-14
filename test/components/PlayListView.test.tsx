import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PlayListView from '../../src/components/PlayListView'
import { Play } from '../../src/types'

// テスト用のPlayデータを作成する関数
const createMockPlay = (id: string, title: string, options: Partial<Play> = {}): Play => ({
  id,
  metadata: {
    title,
    description: options.metadata?.description || `${title}の説明`,
    createdAt: options.metadata?.createdAt || new Date('2023-01-01'),
    updatedAt: options.metadata?.updatedAt || new Date('2023-01-02'),
    tags: options.metadata?.tags || ['tag1', 'tag2'],
    playName: options.metadata?.playName || `Play ${id}`,
    offFormation: options.metadata?.offFormation || 'I-Formation',
    defFormation: options.metadata?.defFormation || '4-3',
    playType: options.metadata?.playType || 'offense'
  },
  field: {
    width: 800,
    height: 600,
    backgroundColor: '#4F7942',
    lineColor: '#FFFFFF',
    yardLines: true,
    hashMarks: true
  },
  players: options.players || [],
  arrows: options.arrows || [],
  texts: options.texts || [],
  center: options.center,
  ...options
})

describe('PlayListView Component', () => {
  const mockOnSelectPlay = vi.fn()
  const mockOnDeletePlay = vi.fn()
  const mockOnDuplicatePlay = vi.fn()
  
  const mockPlays: Play[] = [
    createMockPlay('1', 'プレイ1', {
      metadata: {
        title: 'プレイ1',
        description: 'オフェンスプレイ',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-05'),
        tags: ['offense', 'run'],
        playName: 'Quick Draw',
        offFormation: 'I-Formation',
        defFormation: '4-3',
        playType: 'offense'
      },
      players: [{
        id: 'p1',
        x: 100,
        y: 100,
        type: 'circle',
        position: 'QB',
        color: '#000000',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        size: 20,
        team: 'offense'
      }],
      arrows: [{
        id: 'a1',
        points: [100, 100, 200, 200],
        type: 'straight',
        headType: 'normal',
        color: '#000000',
        strokeWidth: 2
      }],
      texts: [{
        id: 't1',
        x: 50,
        y: 50,
        text: 'Start',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000'
      }]
    }),
    createMockPlay('2', 'プレイ2', {
      metadata: {
        title: 'プレイ2',
        description: 'ディフェンスプレイ',
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-04'),
        tags: ['defense', 'blitz'],
        playName: 'Safety Blitz',
        offFormation: 'Shotgun',
        defFormation: '3-4',
        playType: 'defense'
      },
      players: [],
      arrows: [],
      texts: []
    }),
    createMockPlay('3', 'プレイ3', {
      metadata: {
        title: 'プレイ3',
        description: 'スペシャルプレイ',
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
        tags: ['special', 'punt'],
        playName: 'Punt Return',
        offFormation: 'Punt',
        defFormation: 'Punt Return',
        playType: 'special'
      },
      players: [],
      arrows: [],
      texts: []
    })
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('プレイリストが正常にレンダリングされること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.getByText('プレイ2')).toBeInTheDocument()
      expect(screen.getByText('プレイ3')).toBeInTheDocument()
    })

    it('プレイがない場合、適切なメッセージが表示されること', () => {
      render(
        <PlayListView 
          plays={[]}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      expect(screen.getByText('プレイがありません')).toBeInTheDocument()
      expect(screen.getByText('新しいプレイを作成して始めましょう')).toBeInTheDocument()
    })

    it('検索バーが表示されること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      expect(screen.getByPlaceholderText('プレイを検索...')).toBeInTheDocument()
    })

    it('ソート・表示モードの切り替えボタンが表示されること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      expect(screen.getByText('グリッド')).toBeInTheDocument()
      expect(screen.getByText('リスト')).toBeInTheDocument()
      expect(screen.getByDisplayValue('更新日')).toBeInTheDocument()
    })
  })

  describe('プレイの選択', () => {
    it('プレイをクリックするとonSelectPlayが呼ばれること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const playCard = screen.getByText('プレイ1').closest('div')
      await user.click(playCard!)

      expect(mockOnSelectPlay).toHaveBeenCalledWith(mockPlays[0])
    })

    it('現在選択されているプレイが正しくハイライトされること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={mockPlays[0]}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const selectedCard = screen.getByText('プレイ1').closest('[class*="border-blue-500"]')
      expect(selectedCard).toHaveClass('border-blue-500', 'bg-blue-50')
    })
  })

  describe('プレイの削除', () => {
    it('削除ボタンをクリックすると確認ダイアログが表示されること', async () => {
      const user = userEvent.setup()
      
      // window.confirm をモック化
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const deleteButton = screen.getAllByTitle('削除')[0]
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith('このプレイを削除しますか？')
      expect(mockOnDeletePlay).toHaveBeenCalledWith('1')
      
      confirmSpy.mockRestore()
    })

    it('削除確認でキャンセルした場合、削除されないこと', async () => {
      const user = userEvent.setup()
      
      // window.confirm をモック化（キャンセル）
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const deleteButton = screen.getAllByTitle('削除')[0]
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith('このプレイを削除しますか？')
      expect(mockOnDeletePlay).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })
  })

  describe('プレイの複製', () => {
    it('複製ボタンをクリックするとonDuplicatePlayが呼ばれること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const duplicateButton = screen.getAllByTitle('複製')[0]
      await user.click(duplicateButton)

      expect(mockOnDuplicatePlay).toHaveBeenCalledWith('1')
    })
  })

  describe('検索機能', () => {
    it('タイトルで検索できること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const searchInput = screen.getByPlaceholderText('プレイを検索...')
      await user.type(searchInput, 'プレイ1')

      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.queryByText('プレイ2')).not.toBeInTheDocument()
      expect(screen.queryByText('プレイ3')).not.toBeInTheDocument()
    })

    it('説明で検索できること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const searchInput = screen.getByPlaceholderText('プレイを検索...')
      await user.type(searchInput, 'オフェンス')

      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.queryByText('プレイ2')).not.toBeInTheDocument()
    })

    it('タグで検索できること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const searchInput = screen.getByPlaceholderText('プレイを検索...')
      await user.type(searchInput, 'defense')

      expect(screen.getByText('プレイ2')).toBeInTheDocument()
      expect(screen.queryByText('プレイ1')).not.toBeInTheDocument()
    })

    it('検索結果がない場合、適切なメッセージが表示されること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const searchInput = screen.getByPlaceholderText('プレイを検索...')
      await user.type(searchInput, '存在しないプレイ')

      expect(screen.getByText('条件に一致するプレイが見つかりません')).toBeInTheDocument()
      expect(screen.getByText('検索条件を変更してみてください')).toBeInTheDocument()
    })
  })

  describe('フィルタリング機能', () => {
    it('フォーメーションフィルターが正常に動作すること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      // フォーメーションフィルターボタンをクリック
      const formationButton = screen.getByText('I-Formation')
      await user.click(formationButton)

      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.queryByText('プレイ2')).not.toBeInTheDocument()
    })

    it('タグフィルターが正常に動作すること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      // タグフィルターボタンをクリック（複数ある場合は最初のボタンを選択）
      const tagButtons = screen.getAllByText('defense')
      const tagButton = tagButtons.find(button => button.tagName === 'BUTTON')
      expect(tagButton).toBeDefined()
      await user.click(tagButton!)

      expect(screen.getByText('プレイ2')).toBeInTheDocument()
      expect(screen.queryByText('プレイ1')).not.toBeInTheDocument()
    })

    it('すべてのフィルターをクリアできること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      // 検索とフィルターを適用
      const searchInput = screen.getByPlaceholderText('プレイを検索...')
      await user.type(searchInput, 'プレイ1')
      
      const tagButtons = screen.getAllByText('offense')
      const tagButton = tagButtons.find(button => button.tagName === 'BUTTON')
      expect(tagButton).toBeDefined()
      await user.click(tagButton!)

      // クリアボタンをクリック
      const clearButton = screen.getByText('すべてのフィルターをクリア')
      await user.click(clearButton)

      // すべてのプレイが表示されることを確認
      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.getByText('プレイ2')).toBeInTheDocument()
      expect(screen.getByText('プレイ3')).toBeInTheDocument()
    })
  })

  describe('ソート機能', () => {
    it('タイトルでソートできること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const sortSelect = screen.getByDisplayValue('更新日')
      await user.selectOptions(sortSelect, 'title')

      // ソート順を確認（具体的な確認は実装によって調整）
      expect(sortSelect).toHaveValue('title')
    })

    it('ソート順序を変更できること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const sortOrderButton = screen.getByText('↓')
      await user.click(sortOrderButton)

      expect(screen.getByText('↑')).toBeInTheDocument()
    })
  })

  describe('表示モード', () => {
    it('グリッド表示とリスト表示を切り替えられること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      // 初期状態はグリッド表示
      expect(screen.getByText('グリッド')).toHaveClass('bg-blue-500')

      // リスト表示に切り替え
      const listButton = screen.getByText('リスト')
      await user.click(listButton)

      expect(listButton).toHaveClass('bg-blue-500')
      expect(screen.getByText('グリッド')).toHaveClass('bg-gray-200')
    })
  })

  describe('プレイカード表示', () => {
    it('プレイカードに必要な情報が表示されること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      // プレイ1の情報が表示されていることを確認
      expect(screen.getByText('プレイ1')).toBeInTheDocument()
      expect(screen.getByText('オフェンスプレイ')).toBeInTheDocument()
      expect(screen.getByText('OFF: I-Formation')).toBeInTheDocument()
      expect(screen.getByText('DEF: 4-3')).toBeInTheDocument()
      expect(screen.getByText('プレイヤー: 1人')).toBeInTheDocument()
      expect(screen.getByText('矢印: 1本')).toBeInTheDocument()
      expect(screen.getByText('テキスト: 1個')).toBeInTheDocument()
    })

    it('タグが適切に表示されること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      expect(screen.getAllByText('offense').length).toBeGreaterThan(0)
      expect(screen.getAllByText('run').length).toBeGreaterThan(0)
    })

    it('作成日・更新日が表示されること', () => {
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      expect(screen.getAllByText(/作成:/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/更新:/).length).toBeGreaterThan(0)
    })
  })

  describe('プレイ数の表示', () => {
    it('フィルタ後のプレイ数が正しく表示されること', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      // 初期状態での表示
      expect(screen.getByText('3 / 3 件のプレイを表示')).toBeInTheDocument()

      // 検索でフィルタ
      const searchInput = screen.getByPlaceholderText('プレイを検索...')
      await user.type(searchInput, 'プレイ1')

      expect(screen.getByText('1 / 3 件のプレイを表示')).toBeInTheDocument()
    })
  })

  describe('イベント伝播の制御', () => {
    it('削除ボタンクリック時にプレイ選択が発生しないこと', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const deleteButton = screen.getAllByTitle('削除')[0]
      await user.click(deleteButton)

      expect(mockOnDeletePlay).toHaveBeenCalledWith('1')
      expect(mockOnSelectPlay).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })

    it('複製ボタンクリック時にプレイ選択が発生しないこと', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayListView 
          plays={mockPlays}
          currentPlay={null}
          onSelectPlay={mockOnSelectPlay}
          onDeletePlay={mockOnDeletePlay}
          onDuplicatePlay={mockOnDuplicatePlay}
        />
      )

      const duplicateButton = screen.getAllByTitle('複製')[0]
      await user.click(duplicateButton)

      expect(mockOnDuplicatePlay).toHaveBeenCalledWith('1')
      expect(mockOnSelectPlay).not.toHaveBeenCalled()
    })
  })
})