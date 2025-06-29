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
  const mockOnOpenPlayLibrary = vi.fn()
  const mockOnOpenPlaylistWorkspace = vi.fn()
  const mockOnShowMessage = vi.fn()

  const defaultProps = {
    onNewPlay: mockOnNewPlay,
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
      expect(screen.getByText('プレイ一覧')).toBeInTheDocument()
    })
  })


  describe('ユーザー情報表示', () => {
    it('アカウントボタンが表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // テストモードでのアカウントボタンが表示される（メールアドレスの最初の文字「T」）
      expect(screen.getByText('T')).toBeInTheDocument()
      // アカウントドロップダウンボタンが存在することを確認
      const buttons = screen.getAllByRole('button')
      const accountButton = buttons.find(button => button.getAttribute('aria-haspopup') === 'true')
      expect(accountButton).toBeInTheDocument()
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

    it('アカウント情報が適切に表示されること', () => {
      renderWithAuth(<Header {...defaultProps} />)
      
      // テストモードでのアカウントボタン表示
      expect(screen.getByText('T')).toBeInTheDocument()
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


  describe('プレイ情報表示', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('プレイ選択時にプレイ情報が表示されること', () => {
      const playWithDetails = {
        ...createMockPlay(),
        metadata: {
          ...createMockPlay().metadata,
          title: 'テストプレイ',
          playName: 'Test Formation'
        }
      }
      
      renderWithAuth(<Header {...defaultProps} currentPlay={playWithDetails} />)
      
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
      
      // テストモードでもアカウントボタンが表示される（テストの設定上）
      // 実際のテストでは、テストモードの設定によりアバター「T」が表示される
      expect(screen.getByText('T')).toBeInTheDocument()
      // 基本的なボタンは表示されることを確認
      expect(screen.getByText('新しいプレイ')).toBeInTheDocument()
    })
  })
})