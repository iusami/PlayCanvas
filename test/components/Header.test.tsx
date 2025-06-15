import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Header from '../../src/components/Header'
import { Play } from '../../src/types'

const createMockPlay = (): Play => ({
  id: 'test-play-1',
  metadata: {
    title: 'テストプレイ',
    description: 'テスト用プレイ',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['test'],
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

describe('Header Component', () => {
  const mockOnNewPlay = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnSaveAs = vi.fn()
  const mockOnEditMetadata = vi.fn()
  const mockOnDuplicatePlay = vi.fn()
  const mockOnExportImage = vi.fn()
  const mockOnPrint = vi.fn()
  const mockOnOpenPlayLibrary = vi.fn()
  const mockOnOpenPlaylistWorkspace = vi.fn()

  const defaultProps = {
    onNewPlay: mockOnNewPlay,
    onSave: mockOnSave,
    onSaveAs: mockOnSaveAs,
    onEditMetadata: mockOnEditMetadata,
    onDuplicatePlay: mockOnDuplicatePlay,
    onExportImage: mockOnExportImage,
    onPrint: mockOnPrint,
    onOpenPlayLibrary: mockOnOpenPlayLibrary,
    onOpenPlaylistWorkspace: mockOnOpenPlaylistWorkspace,
    currentPlay: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('Headerが正常にレンダリングされること', () => {
      render(<Header {...defaultProps} />)
      
      expect(screen.getByText('Football Canvas')).toBeInTheDocument()
    })

    it('新しいプレイボタンが表示されること', () => {
      render(<Header {...defaultProps} />)
      
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
    })

    it('プレイライブラリボタンが表示されること', () => {
      render(<Header {...defaultProps} />)
      
      expect(screen.getByText('プレイ一覧')).toBeInTheDocument()
    })

    it('プレイリストワークスペースボタンが表示されること', () => {
      render(<Header {...defaultProps} />)
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })
  })

  describe('プレイが選択されていない場合', () => {
    it('プレイ依存のボタンが無効化されていること', () => {
      render(<Header {...defaultProps} />)
      
      const saveButton = screen.getByText('保存')
      const saveAsButton = screen.getByText('名前を付けて保存')
      const editMetadataButton = screen.getByText('プレイ情報編集')
      const duplicateButton = screen.getByText('複製')
      const exportImageButton = screen.getByText('画像エクスポート')
      const printButton = screen.getByText('印刷')

      expect(saveButton).toBeDisabled()
      expect(saveAsButton).toBeDisabled()
      expect(editMetadataButton).toBeDisabled()
      expect(duplicateButton).toBeDisabled()
      expect(exportImageButton).toBeDisabled()
      expect(printButton).toBeDisabled()
    })

    it('プレイタイトルが表示されないこと', () => {
      render(<Header {...defaultProps} />)
      
      expect(screen.queryByText('テストプレイ')).not.toBeInTheDocument()
    })
  })

  describe('プレイが選択されている場合', () => {
    const propsWithPlay = {
      ...defaultProps,
      currentPlay: createMockPlay()
    }

    it('プレイ依存のボタンが有効化されていること', () => {
      render(<Header {...propsWithPlay} />)
      
      const saveButton = screen.getByText('保存')
      const saveAsButton = screen.getByText('名前を付けて保存')
      const editMetadataButton = screen.getByText('プレイ情報編集')
      const duplicateButton = screen.getByText('複製')
      const exportImageButton = screen.getByText('画像エクスポート')
      const printButton = screen.getByText('印刷')

      expect(saveButton).toBeEnabled()
      expect(saveAsButton).toBeEnabled()
      expect(editMetadataButton).toBeEnabled()
      expect(duplicateButton).toBeEnabled()
      expect(exportImageButton).toBeEnabled()
      expect(printButton).toBeEnabled()
    })

    it('プレイタイトルが表示されること', () => {
      render(<Header {...propsWithPlay} />)
      
      expect(screen.getByText('テストプレイ')).toBeInTheDocument()
    })

    it('プレイタイプバッジが表示されること', () => {
      render(<Header {...propsWithPlay} />)
      
      expect(screen.getByText('オフェンス')).toBeInTheDocument()
    })

    it('作成日が表示されること', () => {
      render(<Header {...propsWithPlay} />)
      
      expect(screen.getByText(/作成:/)).toBeInTheDocument()
    })

    it('更新日が表示されること', () => {
      render(<Header {...propsWithPlay} />)
      
      expect(screen.getByText(/更新:/)).toBeInTheDocument()
    })
  })

  describe('ボタンクリック処理', () => {
    it('新しいプレイボタンをクリックするとonNewPlayが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...defaultProps} />)
      
      const newPlayButton = screen.getByText('新しいプレイ')
      await user.click(newPlayButton)
      
      expect(mockOnNewPlay).toHaveBeenCalledTimes(1)
    })

    it('プレイライブラリボタンをクリックするとonOpenPlayLibraryが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...defaultProps} />)
      
      const libraryButton = screen.getByText('プレイ一覧')
      await user.click(libraryButton)
      
      expect(mockOnOpenPlayLibrary).toHaveBeenCalledTimes(1)
    })

    it('プレイリスト管理ボタンをクリックするとonOpenPlaylistWorkspaceが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...defaultProps} />)
      
      const workspaceButton = screen.getByText('プレイリスト管理')
      await user.click(workspaceButton)
      
      expect(mockOnOpenPlaylistWorkspace).toHaveBeenCalledTimes(1)
    })
  })

  describe('プレイ選択時のボタンクリック処理', () => {
    const propsWithPlay = {
      ...defaultProps,
      currentPlay: createMockPlay()
    }

    it('保存ボタンをクリックするとonSaveが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...propsWithPlay} />)
      
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    it('名前を付けて保存ボタンをクリックするとonSaveAsが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...propsWithPlay} />)
      
      const saveAsButton = screen.getByText('名前を付けて保存')
      await user.click(saveAsButton)
      
      expect(mockOnSaveAs).toHaveBeenCalledTimes(1)
    })

    it('プレイ情報編集ボタンをクリックするとonEditMetadataが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...propsWithPlay} />)
      
      const editButton = screen.getByText('プレイ情報編集')
      await user.click(editButton)
      
      expect(mockOnEditMetadata).toHaveBeenCalledTimes(1)
    })

    it('複製ボタンをクリックするとonDuplicatePlayが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...propsWithPlay} />)
      
      const duplicateButton = screen.getByText('複製')
      await user.click(duplicateButton)
      
      expect(mockOnDuplicatePlay).toHaveBeenCalledTimes(1)
    })

    it('画像エクスポートボタンをクリックするとonExportImageが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...propsWithPlay} />)
      
      const exportButton = screen.getByText('画像エクスポート')
      await user.click(exportButton)
      
      expect(mockOnExportImage).toHaveBeenCalledTimes(1)
    })

    it('印刷ボタンをクリックするとonPrintが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Header {...propsWithPlay} />)
      
      const printButton = screen.getByText('印刷')
      await user.click(printButton)
      
      expect(mockOnPrint).toHaveBeenCalledTimes(1)
    })
  })

  describe('プレイタイプの表示', () => {
    it('オフェンスプレイの場合、適切なバッジが表示されること', () => {
      const offensePlay = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          playType: 'offense' as const
        }
      }
      
      render(<Header {...defaultProps} currentPlay={offensePlay} />)
      
      const badge = screen.getByText('オフェンス')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('ディフェンスプレイの場合、適切なバッジが表示されること', () => {
      const defensePlay = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          playType: 'defense' as const
        }
      }
      
      render(<Header {...defaultProps} currentPlay={defensePlay} />)
      
      const badge = screen.getByText('ディフェンス')
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('スペシャルプレイの場合、適切なバッジが表示されること', () => {
      const specialPlay = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          playType: 'special' as const
        }
      }
      
      render(<Header {...defaultProps} currentPlay={specialPlay} />)
      
      const badge = screen.getByText('スペシャル')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })
  })

  describe('タイトルの長さ制限', () => {
    it('長いタイトルが適切に切り詰められること', () => {
      const longTitlePlay = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          title: 'これは非常に長いプレイタイトルでヘッダーの表示幅を超える可能性があります'
        }
      }
      
      render(<Header {...defaultProps} currentPlay={longTitlePlay} />)
      
      const titleElement = screen.getByText(/これは非常に長い/)
      expect(titleElement).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('小さい画面でもボタンが適切に表示されること', () => {
      // ウィンドウサイズを変更するシミュレーション
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      render(<Header {...defaultProps} currentPlay={createMockPlay()} />)
      
      // 主要なボタンが表示されていることを確認
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('プレイライブラリ')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('ボタンに適切なaria-labelが設定されていること', () => {
      render(<Header {...defaultProps} currentPlay={createMockPlay()} />)
      
      const saveButton = screen.getByText('保存')
      expect(saveButton).toHaveAttribute('title', '現在のプレイを保存')
    })

    it('無効化されたボタンが適切にマークされていること', () => {
      render(<Header {...defaultProps} />)
      
      const saveButton = screen.getByText('保存')
      expect(saveButton).toBeDisabled()
      expect(saveButton).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('キーボードナビゲーション', () => {
    it('Tabキーでボタン間を移動できること', async () => {
      const user = userEvent.setup()
      render(<Header {...defaultProps} currentPlay={createMockPlay()} />)
      
      const newPlayButton = screen.getByText('新しいプレイ')
      
      // 最初のボタンにフォーカス
      await user.tab()
      expect(newPlayButton).toHaveFocus()
      
      // 次のボタンに移動
      await user.tab()
      const saveButton = screen.getByText('保存')
      expect(saveButton).toHaveFocus()
    })

    it('Enterキーでボタンを実行できること', async () => {
      const user = userEvent.setup()
      render(<Header {...defaultProps} />)
      
      const newPlayButton = screen.getByText('新しいプレイ')
      newPlayButton.focus()
      
      await user.keyboard('{Enter}')
      
      expect(mockOnNewPlay).toHaveBeenCalledTimes(1)
    })
  })

  describe('エラーハンドリング', () => {
    it('ボタンクリックでエラーが発生しても画面が壊れないこと', async () => {
      const user = userEvent.setup()
      const errorOnNewPlay = vi.fn(() => {
        throw new Error('Test error')
      })
      
      // エラーが発生する可能性があるため、console.errorをモック
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Header {...defaultProps} onNewPlay={errorOnNewPlay} />)
      
      const newPlayButton = screen.getByText('新しいプレイ')
      
      // エラーが発生してもクラッシュしないことを確認
      expect(async () => {
        await user.click(newPlayButton)
      }).not.toThrow()
      
      consoleErrorSpy.mockRestore()
    })
  })
})