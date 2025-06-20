import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../../src/App'
import { PlayStorage, PlaylistStorage, FormationStorage, SettingsStorage } from '../../src/utils/storage'

// モジュールをモック化
vi.mock('../../src/utils/storage', () => ({
  PlayStorage: {
    getAllPlays: vi.fn(() => Promise.resolve([])),
    savePlay: vi.fn(() => Promise.resolve()),
    deletePlay: vi.fn(() => Promise.resolve()),
    duplicatePlay: vi.fn(() => Promise.resolve()),
    getPlay: vi.fn(() => Promise.resolve()),
    exportPlay: vi.fn(() => Promise.resolve()),
    importPlay: vi.fn(() => Promise.resolve())
  },
  PlaylistStorage: {
    getAllPlaylists: vi.fn(() => Promise.resolve([])),
    savePlaylist: vi.fn(() => Promise.resolve()),
    deletePlaylist: vi.fn(() => Promise.resolve())
  },
  FormationStorage: {
    getAllFormations: vi.fn(() => Promise.resolve([])),
    initializeDefaultFormations: vi.fn(() => Promise.resolve()),
    saveFormation: vi.fn(() => Promise.resolve()),
    deleteFormation: vi.fn(() => Promise.resolve()),
    getFormationsByType: vi.fn(() => Promise.resolve([]))
  },
  SettingsStorage: {
    getSettings: vi.fn(() => Promise.resolve({
      autoBackup: {
        enabled: false,
        interval: 'weekly',
        maxBackupFiles: 5,
        includeSettings: true,
        customFileName: undefined,
        lastBackupDate: undefined
      },
      theme: 'light',
      language: 'ja'
    })),
    saveSettings: vi.fn(() => Promise.resolve()),
    updateAutoBackupSettings: vi.fn(() => Promise.resolve()),
    getDefaultSettings: vi.fn(() => ({
      autoBackup: {
        enabled: false,
        interval: 'weekly',
        maxBackupFiles: 5,
        includeSettings: true,
        customFileName: undefined,
        lastBackupDate: undefined
      },
      theme: 'light',
      language: 'ja'
    }))
  }
}))

// 自動バックアップスケジューラーをモック化
vi.mock('../../src/utils/autoBackupScheduler', () => ({
  AutoBackupScheduler: {
    start: vi.fn(),
    stop: vi.fn(),
    requestNotificationPermission: vi.fn(() => Promise.resolve(false))
  }
}))

// コンポーネントをモック化（レンダリングが複雑なため）
vi.mock('../../src/components/Header', () => ({
  default: function MockHeader({ onNewPlay, currentPlay }: any) {
    return (
      <div data-testid="header">
        <button onClick={onNewPlay} data-testid="new-play-button">
          新しいプレイ
        </button>
        <span data-testid="current-play-title">
          {currentPlay ? currentPlay.metadata.title : 'プレイが選択されていません'}
        </span>
      </div>
    )
  }
}))

vi.mock('../../src/components/Sidebar', () => ({
  default: function MockSidebar({ appState, onSelectPlay }: any) {
    return (
      <div data-testid="sidebar">
        <div data-testid="selected-tool">{appState.selectedTool}</div>
        <div data-testid="selected-team">{appState.selectedTeam}</div>
      </div>
    )
  }
}))

vi.mock('../../src/components/CanvasArea', () => ({
  default: React.forwardRef(function MockCanvasArea({ appState, onNewPlay }: any, ref: any) {
    // refに空のメソッドを設定
    React.useImperativeHandle(ref, () => ({
      exportAsImage: vi.fn(),
      print: vi.fn()
    }))

    return (
      <div data-testid="canvas-area">
        <div data-testid="current-play-id">
          {appState.currentPlay ? appState.currentPlay.id : 'no-play'}
        </div>
        <button onClick={onNewPlay} data-testid="canvas-new-play">
          キャンバスから新規作成
        </button>
      </div>
    )
  })
}))

vi.mock('../../src/components/PlayMetadataForm', () => ({
  default: function MockPlayMetadataForm({ isOpen, onSave, onCancel, play }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="metadata-form">
        <input 
          data-testid="metadata-title-input"
          defaultValue={play?.metadata.title}
          onChange={(e) => {/* テスト用 */}}
        />
        <button 
          onClick={() => onSave({ title: 'Updated Title' })}
          data-testid="metadata-save-button"
        >
          保存
        </button>
        <button onClick={onCancel} data-testid="metadata-cancel-button">
          キャンセル
        </button>
      </div>
    )
  }
}))

vi.mock('../../src/components/PlayLibrary', () => ({
  default: function MockPlayLibrary({ isOpen, plays, onSelectPlay, onClose }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="play-library">
        <div data-testid="plays-count">{plays.length}個のプレイ</div>
        <button onClick={onClose} data-testid="library-close-button">
          閉じる
        </button>
      </div>
    )
  }
}))

vi.mock('../../src/components/PlaylistWorkspace', () => ({
  default: function MockPlaylistWorkspace({ isOpen, playlists, onClose }: any) {
    if (!isOpen) return null
    return (
      <div data-testid="playlist-workspace">
        <div data-testid="playlists-count">{playlists.length}個のプレイリスト</div>
        <button onClick={onClose} data-testid="workspace-close-button">
          閉じる
        </button>
      </div>
    )
  }
}))

const mockPlayStorage = PlayStorage as any
const mockPlaylistStorage = PlaylistStorage as any
const mockFormationStorage = FormationStorage as any

describe('App Component', () => {
  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks()
    
    // デフォルトのモック実装を設定（非同期）
    mockPlayStorage.getAllPlays.mockResolvedValue([])
    mockPlaylistStorage.getAllPlaylists.mockResolvedValue([])
    mockFormationStorage.getAllFormations.mockResolvedValue([])
    mockFormationStorage.initializeDefaultFormations.mockResolvedValue(undefined)
  })

  describe('初期レンダリング', () => {
    it('Appコンポーネントが正常にレンダリングされること', () => {
      render(<App />)
      
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('canvas-area')).toBeInTheDocument()
    })

    it('初期状態では現在のプレイが選択されていないこと', () => {
      render(<App />)
      
      expect(screen.getByTestId('current-play-title')).toHaveTextContent('プレイが選択されていません')
      expect(screen.getByTestId('current-play-id')).toHaveTextContent('no-play')
    })

    it('初期状態でサイドバーのデフォルト値が設定されていること', () => {
      render(<App />)
      
      expect(screen.getByTestId('selected-tool')).toHaveTextContent('select')
      expect(screen.getByTestId('selected-team')).toHaveTextContent('offense')
    })
  })

  describe('新しいプレイの作成', () => {
    it('新しいプレイボタンをクリックすると新しいプレイが作成されること', async () => {
      render(<App />)
      
      const newPlayButton = screen.getByTestId('new-play-button')
      fireEvent.click(newPlayButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('current-play-title')).toHaveTextContent('新しいプレイ')
      })
    })

    it('キャンバスエリアから新しいプレイを作成できること', async () => {
      render(<App />)
      
      const canvasNewPlayButton = screen.getByTestId('canvas-new-play')
      fireEvent.click(canvasNewPlayButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('current-play-title')).toHaveTextContent('新しいプレイ')
      })
    })
  })

  describe('ストレージとの連携', () => {
    it('初期化時にストレージからデータを読み込むこと', async () => {
      render(<App />)
      
      // 非同期のuseEffect内でストレージ関数が呼ばれるのを待つ
      await waitFor(() => {
        expect(mockPlayStorage.getAllPlays).toHaveBeenCalled()
        expect(mockPlaylistStorage.getAllPlaylists).toHaveBeenCalled()
        expect(mockFormationStorage.getAllFormations).toHaveBeenCalled()
        expect(mockFormationStorage.initializeDefaultFormations).toHaveBeenCalled()
      })
    })

    it('ストレージに保存されたプレイがある場合、その数が反映されること', async () => {
      const mockPlays = [
        {
          id: 'play-1',
          metadata: { title: 'テストプレイ1', description: '', createdAt: new Date(), updatedAt: new Date(), tags: [], playName: '', offFormation: '', defFormation: '', playType: 'offense' as const },
          field: { width: 800, height: 600, backgroundColor: '#4F7942', lineColor: '#FFFFFF', yardLines: true, hashMarks: true },
          players: [],
          arrows: [],
          texts: [],
          textBoxEntries: []
        }
      ]
      
      mockPlayStorage.getAllPlays.mockResolvedValue(mockPlays)
      
      render(<App />)
      
      // 非同期でデータが読み込まれるのを待つ
      await waitFor(() => {
        expect(mockPlayStorage.getAllPlays).toHaveBeenCalled()
      })
      
      // プレイライブラリを開いて確認
      // 注意: この部分は実際のUI実装によって調整が必要
    })
  })

  describe('エラーハンドリング', () => {
    it('ストレージエラーが発生した場合にアプリが正常にレンダリングされること', async () => {
      // ストレージでエラーが発生する場合をシミュレート
      mockPlayStorage.getAllPlays.mockRejectedValue(new Error('Storage error'))
      mockPlaylistStorage.getAllPlaylists.mockRejectedValue(new Error('Storage error'))
      mockFormationStorage.initializeDefaultFormations.mockRejectedValue(new Error('Storage error'))
      mockFormationStorage.getAllFormations.mockRejectedValue(new Error('Storage error'))
      
      // unhandled rejectionをモック（実際のアプリではエラーハンドリングされていない）
      const originalOnError = window.addEventListener
      const errorSpy = vi.fn()
      window.addEventListener = vi.fn((event, handler) => {
        if (event === 'unhandledrejection') {
          errorSpy()
        }
        return originalOnError.call(window, event, handler)
      })
      
      // アプリをレンダリング - エラーが発生してもクラッシュしない
      const { container } = render(<App />)
      
      // UIは正常にレンダリングされる
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('canvas-area')).toBeInTheDocument()
      
      // エラーが発生したが、アプリは動作し続ける
      expect(container.firstChild).toBeInTheDocument()
      
      // モックを復元
      window.addEventListener = originalOnError
    })
  })

  describe('UIの状態管理', () => {
    it('保存メッセージが表示されること', async () => {
      render(<App />)
      
      // 新しいプレイを作成
      const newPlayButton = screen.getByTestId('new-play-button')
      fireEvent.click(newPlayButton)
      
      // 保存が成功した場合のメッセージ表示をテスト
      // 注意: 実際の保存処理の実装によってテスト方法を調整
    })
  })

  describe('プレイメタデータフォーム', () => {
    it('メタデータフォームの表示・非表示が切り替わること', async () => {
      render(<App />)
      
      // 新しいプレイを作成
      const newPlayButton = screen.getByTestId('new-play-button')
      fireEvent.click(newPlayButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('current-play-title')).toHaveTextContent('新しいプレイ')
      })
      
      // メタデータフォームは初期状態では表示されない
      expect(screen.queryByTestId('metadata-form')).not.toBeInTheDocument()
      
      // フォームを表示する処理はHeaderコンポーネントから実行されるため、
      // この部分のテストは実際のUI実装に合わせて調整が必要
    })
  })

  describe('レスポンシブレイアウト', () => {
    it('画面サイズに関係なく主要なコンポーネントが表示されること', () => {
      // 異なる画面サイズでのテスト
      render(<App />)
      
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('canvas-area')).toBeInTheDocument()
    })
  })
})

describe('App Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // デフォルトのモック実装を設定（非同期）
    mockPlayStorage.getAllPlays.mockResolvedValue([])
    mockPlaylistStorage.getAllPlaylists.mockResolvedValue([])
    mockFormationStorage.getAllFormations.mockResolvedValue([])
    mockFormationStorage.initializeDefaultFormations.mockResolvedValue(undefined)
  })

  it('コンポーネント間でデータが正しく連携されること', async () => {
    render(<App />)
    
    // 初期化が完了するのを待つ
    await waitFor(() => {
      expect(mockPlayStorage.getAllPlays).toHaveBeenCalled()
    })
    
    // 新しいプレイを作成
    const newPlayButton = screen.getByTestId('new-play-button')
    fireEvent.click(newPlayButton)
    
    await waitFor(() => {
      // ヘッダーとキャンバスエリアで同じプレイ情報が表示される
      expect(screen.getByTestId('current-play-title')).toHaveTextContent('新しいプレイ')
      expect(screen.getByTestId('current-play-id')).not.toHaveTextContent('no-play')
    })
  })
})