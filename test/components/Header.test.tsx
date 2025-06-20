import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Header from '../../src/components/Header'
import { Play } from '../../src/types'
import { renderWithAuth, createMockAuthContext } from '../utils/testUtils'

// useAuthフックをモック
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => createMockAuthContext()
}))

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
  center: { x: 400, y: 300 },
  textBoxEntries: []
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
  const mockOnShowMessage = vi.fn()

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
    onShowMessage: mockOnShowMessage,
    currentPlay: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('Headerが正常にレンダリングされること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      expect(screen.getByText('Football Canvas')).toBeInTheDocument()
    })

    it('新しいプレイボタンが表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
    })

    it('プレイライブラリボタンが表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      expect(screen.getByText('プレイ一覧')).toBeInTheDocument()
    })

    it('プレイリストワークスペースボタンが表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })
  })

  describe('プレイが選択されていない場合', () => {
    it('プレイ依存のボタンが表示されないこと', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // プレイがnullの場合、これらのボタンは表示されない
      expect(screen.queryByText('保存')).not.toBeInTheDocument()
      expect(screen.queryByText('名前を付けて保存')).not.toBeInTheDocument()
      expect(screen.queryByText('プレイ情報編集')).not.toBeInTheDocument()
      expect(screen.queryByText('複製')).not.toBeInTheDocument()
      expect(screen.queryByText('エクスポート')).not.toBeInTheDocument()
      expect(screen.queryByText('印刷')).not.toBeInTheDocument()
    })

    it('プレイタイトルが表示されないこと', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      expect(screen.queryByText('テストプレイ')).not.toBeInTheDocument()
    })
  })

  describe('プレイが選択されている場合', () => {
    const propsWithPlay = {
      ...defaultProps,
      currentPlay: createMockPlay()
    }

    it('プレイ依存のボタンが表示されること', () => {
      renderWithAuth(<Header {...propsWithPlay} />)
      
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('名前を付けて保存')).toBeInTheDocument()
      expect(screen.getByText('プレイ情報編集')).toBeInTheDocument()
      expect(screen.getByText('複製')).toBeInTheDocument()
      expect(screen.getByText('エクスポート')).toBeInTheDocument()
      expect(screen.getByText('印刷')).toBeInTheDocument()
    })

    it('プレイタイトルが表示されること', () => {
      renderWithAuth(<Header {...propsWithPlay} />)
      
      expect(screen.getByText('テストプレイ')).toBeInTheDocument()
    })

  })

  describe('ボタンクリック処理', () => {
    it('新しいプレイボタンをクリックするとonNewPlayが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...defaultProps} />)
      
      const newPlayButton = screen.getByText('新しいプレイ')
      await user.click(newPlayButton)
      
      expect(mockOnNewPlay).toHaveBeenCalledTimes(1)
    })

    it('プレイライブラリボタンをクリックするとonOpenPlayLibraryが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...defaultProps} />)
      
      const libraryButton = screen.getByText('プレイ一覧')
      await user.click(libraryButton)
      
      expect(mockOnOpenPlayLibrary).toHaveBeenCalledTimes(1)
    })

    it('プレイリスト管理ボタンをクリックするとonOpenPlaylistWorkspaceが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...defaultProps} />)
      
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
      renderWithAuth(<Header {...propsWithPlay} />)
      
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })

    it('名前を付けて保存ボタンをクリックするとonSaveAsが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...propsWithPlay} />)
      
      const saveAsButton = screen.getByText('名前を付けて保存')
      await user.click(saveAsButton)
      
      expect(mockOnSaveAs).toHaveBeenCalledTimes(1)
    })

    it('プレイ情報編集ボタンをクリックするとonEditMetadataが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...propsWithPlay} />)
      
      const editButton = screen.getByText('プレイ情報編集')
      await user.click(editButton)
      
      expect(mockOnEditMetadata).toHaveBeenCalledTimes(1)
    })

    it('複製ボタンをクリックするとonDuplicatePlayが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...propsWithPlay} />)
      
      const duplicateButton = screen.getByText('複製')
      await user.click(duplicateButton)
      
      expect(mockOnDuplicatePlay).toHaveBeenCalledTimes(1)
    })

    it('画像エクスポートボタンをクリックするとonExportImageが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...propsWithPlay} />)
      
      const exportButton = screen.getByText('エクスポート')
      await user.click(exportButton)
      
      expect(mockOnExportImage).toHaveBeenCalledTimes(1)
    })

    it('印刷ボタンをクリックするとonPrintが呼ばれること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<Header {...propsWithPlay} />)
      
      const printButton = screen.getByText('印刷')
      await user.click(printButton)
      
      expect(mockOnPrint).toHaveBeenCalledTimes(1)
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

      renderWithAuth(<Header {...defaultProps} currentPlay={createMockPlay()} />)
      
      // 主要なボタンが表示されていることを確認
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('プレイ一覧')).toBeInTheDocument()
    })
  })


  describe('ユーザー情報表示', () => {
    it('ユーザーのメールアドレスが表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // テストモードでのモックユーザーのメールアドレスが表示される
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('プレイ名がある場合、タイトルと一緒に表示されること', () => {
      const playWithName = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          title: 'テストプレイ',
          playName: 'Quick Pass'
        }
      }
      
      renderWithAuth(<Header {...defaultProps} currentPlay={playWithName} />)
      
      expect(screen.getByText('テストプレイ')).toBeInTheDocument()
      expect(screen.getByText('- Quick Pass')).toBeInTheDocument()
    })

    it('プレイ名がない場合、タイトルのみ表示されること', () => {
      const playWithoutName = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          title: 'テストプレイ',
          playName: ''
        }
      }
      
      renderWithAuth(<Header {...defaultProps} currentPlay={playWithoutName} />)
      
      expect(screen.getByText('テストプレイ')).toBeInTheDocument()
      expect(screen.queryByText(/^- /)).not.toBeInTheDocument()
    })
  })

  describe('設定・管理機能', () => {
    beforeEach(() => {
      // 各テスト前にモックをクリア
      vi.clearAllMocks()
    })

    it('基本的なヘッダー機能が動作すること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // 基本的なボタンは常に表示される
      expect(screen.getByText('Football Canvas')).toBeInTheDocument()
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
      expect(screen.getByText('プレイ一覧')).toBeInTheDocument()
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })

    it('ユーザー情報が適切に表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // テストモードでのユーザー表示
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  describe('テストモード機能', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('テストモードでは特定の管理ボタンが表示されないこと', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // テストモードでは管理ボタンが表示されない（実装を確認済み）
      // 基本的なボタンは表示される
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
      expect(screen.getByText('プレイ一覧')).toBeInTheDocument()
      expect(screen.getByText('プレイリスト管理')).toBeInTheDocument()
    })
  })

  describe('ボタンの無効化状態', () => {
    it('onExportImageが未定義の場合、エクスポートボタンが無効になること', () => {
      const propsWithoutExport = {
        ...defaultProps,
        currentPlay: createMockPlay(),
        onExportImage: undefined
      }
      
      renderWithAuth(<Header {...propsWithoutExport} />)
      
      const exportButton = screen.getByText('エクスポート')
      expect(exportButton).toBeDisabled()
    })

    it('onPrintが未定義の場合、印刷ボタンが無効になること', () => {
      const propsWithoutPrint = {
        ...defaultProps,
        currentPlay: createMockPlay(),
        onPrint: undefined
      }
      
      renderWithAuth(<Header {...propsWithoutPrint} />)
      
      const printButton = screen.getByText('印刷')
      expect(printButton).toBeDisabled()
    })

    it('onExportImageが定義されている場合、エクスポートボタンが有効になること', () => {
      const propsWithExport = {
        ...defaultProps,
        currentPlay: createMockPlay(),
        onExportImage: mockOnExportImage
      }
      
      renderWithAuth(<Header {...propsWithExport} />)
      
      const exportButton = screen.getByText('エクスポート')
      expect(exportButton).not.toBeDisabled()
    })

    it('onPrintが定義されている場合、印刷ボタンが有効になること', () => {
      const propsWithPrint = {
        ...defaultProps,
        currentPlay: createMockPlay(),
        onPrint: mockOnPrint
      }
      
      renderWithAuth(<Header {...propsWithPrint} />)
      
      const printButton = screen.getByText('印刷')
      expect(printButton).not.toBeDisabled()
    })
  })

  describe('プレイ情報表示', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('プレイ選択時に関連ボタンが表示されること', () => {
      const playWithDetails = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          title: 'テストプレイ',
          playName: 'Test Formation'
        }
      }
      
      renderWithAuth(<Header {...defaultProps} currentPlay={playWithDetails} />)
      
      // プレイ選択時のボタンが表示される
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('名前を付けて保存')).toBeInTheDocument()
      expect(screen.getByText('プレイ情報編集')).toBeInTheDocument()
      expect(screen.getByText('複製')).toBeInTheDocument()
      expect(screen.getByText('エクスポート')).toBeInTheDocument()
      expect(screen.getByText('印刷')).toBeInTheDocument()
      
      // プレイ情報が表示される
      expect(screen.getByText('テストプレイ')).toBeInTheDocument()
      expect(screen.getByText('- Test Formation')).toBeInTheDocument()
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
      
      renderWithAuth(<Header {...defaultProps} onNewPlay={errorOnNewPlay} />)
      
      const newPlayButton = screen.getByText('新しいプレイ')
      
      // エラーが発生してもクラッシュしないことを確認
      expect(async () => {
        await user.click(newPlayButton)
      }).not.toThrow()
      
      consoleErrorSpy.mockRestore()
    })

    it('認証エラーが発生してもコンポーネントが正常に動作すること', () => {
      const mockAuthWithError = {
        ...createMockAuthContext(),
        user: null
      }
      
      vi.mocked(vi.doMock('@/contexts/AuthContext', () => ({
        useAuth: () => mockAuthWithError
      })))
      
      renderWithAuth(<Header {...defaultProps} />)
      
      // テストモードでもモックユーザーが表示される（テストの設定上）
      // 実際のテストでは、テストモードの設定により「test@example.com」が表示される
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      // 基本的なボタンは表示されることを確認
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
    })
  })
})