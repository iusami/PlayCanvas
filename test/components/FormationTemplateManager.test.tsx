import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import FormationTemplateManager from '../../src/components/FormationTemplateManager'
import { FormationTemplate, Player } from '../../src/types'

const createMockFormations = (): FormationTemplate[] => [
  {
    id: 'formation-1',
    name: 'I-Formation',
    description: 'Classic offensive formation',
    type: 'offense',
    players: [
      {
        id: 'qb',
        x: 400,
        y: 300,
        type: 'circle',
        position: 'QB',
        color: '#000000',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        size: 20,
        team: 'offense'
      },
      {
        id: 'rb',
        x: 350,
        y: 400,
        type: 'circle',
        position: 'RB',
        color: '#000000',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        size: 20,
        team: 'offense'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'formation-2',
    name: '4-3 Defense',
    description: 'Standard defensive formation',
    type: 'defense',
    players: [
      {
        id: 'de1',
        x: 200,
        y: 280,
        type: 'triangle',
        position: 'DE',
        color: '#000000',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        size: 20,
        team: 'defense'
      },
      {
        id: 'de2',
        x: 600,
        y: 280,
        type: 'triangle',
        position: 'DE',
        color: '#000000',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        size: 20,
        team: 'defense'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

const createMockPlayers = (): Player[] => [
  {
    id: 'player-1',
    x: 400,
    y: 300,
    type: 'circle',
    position: 'QB',
    color: '#000000',
    fillColor: '#ffffff',
    strokeColor: '#000000',
    size: 20,
    team: 'offense'
  },
  {
    id: 'player-2',
    x: 200,
    y: 200,
    type: 'triangle',
    position: 'LB',
    color: '#000000',
    fillColor: '#ffffff',
    strokeColor: '#000000',
    size: 20,
    team: 'defense'
  }
]

// window.confirmのモック
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true
})

describe('FormationTemplateManager Component', () => {
  const mockOnApplyFormation = vi.fn()
  const mockOnSaveCurrentAsTemplate = vi.fn()
  const mockOnDeleteFormation = vi.fn()

  const defaultProps = {
    formations: createMockFormations(),
    currentFormationType: 'offense' as const,
    onApplyFormation: mockOnApplyFormation,
    onSaveCurrentAsTemplate: mockOnSaveCurrentAsTemplate,
    onDeleteFormation: mockOnDeleteFormation,
    currentPlayers: createMockPlayers()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('コンポーネントが正常にレンダリングされること', () => {
      render(<FormationTemplateManager {...defaultProps} />)
      
      expect(screen.getByText('フォーメーションテンプレート')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('現在のオフェンス配置をテンプレート化')).toBeInTheDocument()
    })

    it('選択されたタイプのフォーメーションが表示されること', () => {
      render(<FormationTemplateManager {...defaultProps} />)
      
      // オフェンスフォーメーションが表示される
      expect(screen.getByText('I-Formation')).toBeInTheDocument()
      expect(screen.getByText('Classic offensive formation')).toBeInTheDocument()
      expect(screen.getByText('2人のプレイヤー')).toBeInTheDocument()
      
      // ディフェンスフォーメーションは表示されない
      expect(screen.queryByText('4-3 Defense')).not.toBeInTheDocument()
    })

    it('フォーメーションタイプセレクトが正しく動作すること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const typeSelect = screen.getByRole('combobox')
      await user.selectOptions(typeSelect, 'defense')
      
      // ディフェンスフォーメーションが表示される
      expect(screen.getByText('4-3 Defense')).toBeInTheDocument()
      expect(screen.getByText('Standard defensive formation')).toBeInTheDocument()
      
      // オフェンスフォーメーションは表示されない
      expect(screen.queryByText('I-Formation')).not.toBeInTheDocument()
    })
  })

  describe('新規テンプレート作成', () => {
    it('テンプレート作成ボタンが表示されること', () => {
      render(<FormationTemplateManager {...defaultProps} />)
      
      expect(screen.getByText('現在のオフェンス配置をテンプレート化')).toBeInTheDocument()
      expect(screen.getByText('(1人のプレイヤー)')).toBeInTheDocument()
    })

    it('プレイヤーがいない場合、作成ボタンが無効になること', () => {
      const propsWithoutPlayers = {
        ...defaultProps,
        currentPlayers: []
      }
      
      render(<FormationTemplateManager {...propsWithoutPlayers} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      expect(createButton).toBeDisabled()
    })

    it('作成フォームが正しく表示されること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      await user.click(createButton)
      
      expect(screen.getByText('テンプレート名')).toBeInTheDocument()
      expect(screen.getByText('説明（任意）')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('例: Custom 3-4 Defense')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('フォーメーションの特徴や用途を記入')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('テンプレート名を入力できること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      await user.click(createButton)
      
      const nameInput = screen.getByPlaceholderText('例: Custom 3-4 Defense')
      await user.type(nameInput, 'カスタムフォーメーション')
      
      expect(nameInput).toHaveValue('カスタムフォーメーション')
    })

    it('説明を入力できること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      await user.click(createButton)
      
      const descriptionInput = screen.getByPlaceholderText('フォーメーションの特徴や用途を記入')
      await user.type(descriptionInput, 'テスト用の説明')
      
      expect(descriptionInput).toHaveValue('テスト用の説明')
    })

    it('テンプレート名が空の場合、保存ボタンが無効になること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      await user.click(createButton)
      
      const saveButton = screen.getByText('保存')
      expect(saveButton).toBeDisabled()
    })

    it('テンプレートを保存できること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      await user.click(createButton)
      
      const nameInput = screen.getByPlaceholderText('例: Custom 3-4 Defense')
      const descriptionInput = screen.getByPlaceholderText('フォーメーションの特徴や用途を記入')
      
      await user.type(nameInput, 'カスタムフォーメーション')
      await user.type(descriptionInput, 'テスト用の説明')
      
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSaveCurrentAsTemplate).toHaveBeenCalledWith(
        'カスタムフォーメーション',
        'テスト用の説明',
        'offense'
      )
    })

    it('キャンセルボタンでフォームが閉じること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const createButton = screen.getByText('現在のオフェンス配置をテンプレート化')
      await user.click(createButton)
      
      const nameInput = screen.getByPlaceholderText('例: Custom 3-4 Defense')
      await user.type(nameInput, 'テスト名前')
      
      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)
      
      // フォームが閉じて、作成ボタンが再表示される
      expect(screen.getByText('現在のオフェンス配置をテンプレート化')).toBeInTheDocument()
      expect(screen.queryByPlaceholderText('例: Custom 3-4 Defense')).not.toBeInTheDocument()
    })
  })

  describe('フォーメーション一覧', () => {
    it('フォーメーションがない場合、メッセージが表示されること', () => {
      const propsWithoutFormations = {
        ...defaultProps,
        formations: []
      }
      
      render(<FormationTemplateManager {...propsWithoutFormations} />)
      
      expect(screen.getByText(/テンプレートがありません/)).toBeInTheDocument()
    })

    it('フォーメーション情報が正しく表示されること', () => {
      render(<FormationTemplateManager {...defaultProps} />)
      
      expect(screen.getByText('I-Formation')).toBeInTheDocument()
      expect(screen.getByText('Classic offensive formation')).toBeInTheDocument()
      expect(screen.getByText('2人のプレイヤー')).toBeInTheDocument()
      expect(screen.getByText('適用')).toBeInTheDocument()
      expect(screen.getByText('削除')).toBeInTheDocument()
    })

    it('フォーメーションを適用できること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const applyButton = screen.getByText('適用')
      await user.click(applyButton)
      
      expect(mockOnApplyFormation).toHaveBeenCalledWith(createMockFormations()[0])
    })

    it('フォーメーションを削除できること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)
      
      expect(window.confirm).toHaveBeenCalledWith('"I-Formation"を削除しますか？')
      expect(mockOnDeleteFormation).toHaveBeenCalledWith('formation-1')
    })

    it('削除確認でキャンセルした場合、削除されないこと', async () => {
      const user = userEvent.setup()
      vi.mocked(window.confirm).mockReturnValueOnce(false)
      
      render(<FormationTemplateManager {...defaultProps} />)
      
      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)
      
      expect(window.confirm).toHaveBeenCalled()
      expect(mockOnDeleteFormation).not.toHaveBeenCalled()
    })
  })

  describe('フィルタリング機能', () => {
    it('オフェンスとディフェンスが適切にフィルタリングされること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      // 初期状態：オフェンス
      expect(screen.getByText('I-Formation')).toBeInTheDocument()
      expect(screen.queryByText('4-3 Defense')).not.toBeInTheDocument()
      
      // ディフェンスに切り替え
      const typeSelect = screen.getByRole('combobox')
      await user.selectOptions(typeSelect, 'defense')
      
      expect(screen.queryByText('I-Formation')).not.toBeInTheDocument()
      expect(screen.getByText('4-3 Defense')).toBeInTheDocument()
    })

    it('現在のプレイヤーカウントがタイプに応じて変わること', async () => {
      const user = userEvent.setup()
      render(<FormationTemplateManager {...defaultProps} />)
      
      // オフェンス：1人のプレイヤー
      expect(screen.getByText('(1人のプレイヤー)')).toBeInTheDocument()
      
      // ディフェンスに切り替え
      const typeSelect = screen.getByRole('combobox')
      await user.selectOptions(typeSelect, 'defense')
      
      // ディフェンス：1人のプレイヤー
      expect(screen.getByText('現在のディフェンス配置をテンプレート化')).toBeInTheDocument()
      expect(screen.getByText('(1人のプレイヤー)')).toBeInTheDocument()
    })
  })

  describe('UI/UX', () => {
    it('適切なCSSクラスが適用されていること', () => {
      render(<FormationTemplateManager {...defaultProps} />)
      
      const applyButton = screen.getByText('適用')
      expect(applyButton).toHaveClass('px-3', 'py-1', 'text-xs', 'bg-green-500', 'text-white')
      
      const deleteButton = screen.getByText('削除')
      expect(deleteButton).toHaveClass('px-3', 'py-1', 'text-xs', 'bg-red-500', 'text-white')
    })

    it('スクロール可能なコンテナが設定されていること', () => {
      render(<FormationTemplateManager {...defaultProps} />)
      
      const container = screen.getByText('I-Formation').closest('.space-y-2')
      expect(container).toHaveClass('max-h-80', 'overflow-y-auto')
    })
  })

  describe('エラーハンドリング', () => {
    it('空のフォーメーション配列でもエラーが発生しないこと', () => {
      const propsWithEmptyFormations = {
        ...defaultProps,
        formations: []
      }
      
      expect(() => {
        render(<FormationTemplateManager {...propsWithEmptyFormations} />)
      }).not.toThrow()
    })

    it('空のプレイヤー配列でもエラーが発生しないこと', () => {
      const propsWithEmptyPlayers = {
        ...defaultProps,
        currentPlayers: []
      }
      
      expect(() => {
        render(<FormationTemplateManager {...propsWithEmptyPlayers} />)
      }).not.toThrow()
    })

    it('説明のないフォーメーションでもエラーが発生しないこと', () => {
      const formationWithoutDescription = {
        ...createMockFormations()[0],
        description: ''
      }
      
      const propsWithModifiedFormation = {
        ...defaultProps,
        formations: [formationWithoutDescription]
      }
      
      expect(() => {
        render(<FormationTemplateManager {...propsWithModifiedFormation} />)
      }).not.toThrow()
      
      expect(screen.getByText('I-Formation')).toBeInTheDocument()
    })
  })
})