import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PlayMetadataForm from '../../src/components/PlayMetadataForm'
import { Play } from '../../src/types'

const createMockPlay = (): Play => ({
  id: 'test-play-1',
  metadata: {
    title: 'テストプレイ',
    description: 'テスト用プレイ',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['test', 'offense'],
    playName: 'Test Play',
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
  center: { x: 400, y: 300 }
})

describe('PlayMetadataForm Component', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    play: createMockPlay(),
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    isOpen: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('フォームが開いている場合、正常にレンダリングされること', () => {
      render(<PlayMetadataForm {...defaultProps} />)
      
      expect(screen.getByText('プレイ情報編集')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テストプレイ')).toBeInTheDocument()
      expect(screen.getByDisplayValue('テスト用プレイ')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test, offense')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('フォームが閉じている場合、何も表示されないこと', () => {
      render(<PlayMetadataForm {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('プレイ情報編集')).not.toBeInTheDocument()
    })
  })

  describe('フォーム要素', () => {
    it('タイトル入力フィールドが正しく動作すること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const titleInput = screen.getByDisplayValue('テストプレイ')
      await user.clear(titleInput)
      await user.type(titleInput, '新しいタイトル')
      
      expect(titleInput).toHaveValue('新しいタイトル')
    })

    it('説明入力フィールドが正しく動作すること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const descriptionInput = screen.getByDisplayValue('テスト用プレイ')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, '新しい説明')
      
      expect(descriptionInput).toHaveValue('新しい説明')
    })

    it('プレイタイプセレクトが正しく動作すること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const playTypeSelect = screen.getByRole('combobox')
      await user.selectOptions(playTypeSelect, 'defense')
      
      expect(playTypeSelect).toHaveValue('defense')
    })

    it('タグ入力フィールドが正しく動作すること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const tagsInput = screen.getByDisplayValue('test, offense')
      await user.clear(tagsInput)
      await user.type(tagsInput, 'パス, ショート')
      
      expect(tagsInput).toHaveValue('パス, ショート')
    })

    it('プレイタイプのすべてのオプションが表示されること', () => {
      render(<PlayMetadataForm {...defaultProps} />)
      
      expect(screen.getByRole('option', { name: 'オフェンス' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'ディフェンス' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'スペシャルチーム' })).toBeInTheDocument()
    })
  })

  describe('フォーム送信', () => {
    it('保存ボタンをクリックするとonSaveが正しいデータで呼ばれること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      // フォームデータを変更
      const titleInput = screen.getByDisplayValue('テストプレイ')
      await user.clear(titleInput)
      await user.type(titleInput, '更新されたタイトル')
      
      const playTypeSelect = screen.getByRole('combobox')
      await user.selectOptions(playTypeSelect, 'defense')
      
      // フォームを送信
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith({
        title: '更新されたタイトル',
        description: 'テスト用プレイ',
        tags: ['test', 'offense'],
        playType: 'defense',
        updatedAt: expect.any(Date)
      })
    })

    it('空のタグが除外されること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const tagsInput = screen.getByDisplayValue('test, offense')
      await user.clear(tagsInput)
      await user.type(tagsInput, 'タグ1, , タグ2, , , タグ3')
      
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['タグ1', 'タグ2', 'タグ3']
        })
      )
    })

    it('タグの前後の空白が除去されること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const tagsInput = screen.getByDisplayValue('test, offense')
      await user.clear(tagsInput)
      await user.type(tagsInput, ' タグ1 , タグ2 ,  タグ3  ')
      
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['タグ1', 'タグ2', 'タグ3']
        })
      )
    })

    it('タグが空の場合、空配列になること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const tagsInput = screen.getByDisplayValue('test, offense')
      await user.clear(tagsInput)
      
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: []
        })
      )
    })
  })

  describe('キャンセル機能', () => {
    it('キャンセルボタンをクリックするとonCancelが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<PlayMetadataForm {...defaultProps} />)
      
      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('キャンセルボタンはtype="button"であること', () => {
      render(<PlayMetadataForm {...defaultProps} />)
      
      const cancelButton = screen.getByText('キャンセル')
      expect(cancelButton).toHaveAttribute('type', 'button')
    })
  })

  describe('UI/UX', () => {
    it('適切なCSSクラスが適用されていること', () => {
      render(<PlayMetadataForm {...defaultProps} />)
      
      const saveButton = screen.getByText('保存')
      expect(saveButton).toHaveClass('flex-1', 'bg-blue-500', 'text-white')
      
      const cancelButton = screen.getByText('キャンセル')
      expect(cancelButton).toHaveClass('flex-1', 'bg-gray-500', 'text-white')
    })

    it('ボタンが適切なtype属性を持っていること', () => {
      render(<PlayMetadataForm {...defaultProps} />)
      
      const saveButton = screen.getByText('保存')
      const cancelButton = screen.getByText('キャンセル')
      
      expect(saveButton).toHaveAttribute('type', 'submit')
      expect(cancelButton).toHaveAttribute('type', 'button')
    })
  })

  describe('プロパティ変更対応', () => {
    it('isOpenがfalseに変更された場合、フォームが非表示になること', () => {
      const { rerender } = render(<PlayMetadataForm {...defaultProps} />)
      
      expect(screen.getByText('プレイ情報編集')).toBeInTheDocument()
      
      rerender(<PlayMetadataForm {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('プレイ情報編集')).not.toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('playTypeが未定義の場合、デフォルト値が使用されること', () => {
      const playWithoutPlayType = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          playType: undefined as any
        }
      }
      
      render(<PlayMetadataForm {...defaultProps} play={playWithoutPlayType} />)
      
      const playTypeSelect = screen.getByRole('combobox')
      expect(playTypeSelect).toHaveValue('offense')
    })

    it('tagsが空配列の場合、空文字列が表示されること', () => {
      const playWithEmptyTags = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          tags: []
        }
      }
      
      render(<PlayMetadataForm {...defaultProps} play={playWithEmptyTags} />)
      
      // 空の場合、プレースホルダーが表示される
      expect(screen.getByPlaceholderText('タグをカンマ区切りで入力（例: パス, ショート, 3rd Down）')).toHaveValue('')
    })
  })
})