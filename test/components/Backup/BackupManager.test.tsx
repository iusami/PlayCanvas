import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BackupManager } from '@/components/Backup/BackupManager'
import { BackupManager as BackupUtil } from '@/utils/backup'

// BackupManagerモジュールをモック
vi.mock('@/utils/backup', () => ({
  BackupManager: {
    exportAllData: vi.fn(),
    downloadBackup: vi.fn(),
    importAllData: vi.fn(),
    readBackupFile: vi.fn(),
    getBackupStats: vi.fn(),
  }
}))

// StorageUtilsをモック
vi.mock('@/utils/storage', () => ({
  StorageUtils: {
    checkStorageSpace: vi.fn(() => ({
      available: true,
      used: 1024,
      total: 5 * 1024 * 1024
    }))
  }
}))

describe('BackupManager Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    onError: mockOnError
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // デフォルトのモック実装
    vi.mocked(BackupUtil.exportAllData).mockResolvedValue({
      success: true,
      message: 'エクスポート成功',
      data: {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          plays: [],
          playlists: [],
          formations: [],
          settings: {}
        },
        metadata: {
          totalPlays: 0,
          totalPlaylists: 0,
          totalFormations: 0,
          exportedBy: 'user',
          appVersion: '1.0.0'
        }
      }
    })

    vi.mocked(BackupUtil.getBackupStats).mockReturnValue({
      totalItems: 0,
      breakdown: { plays: 0, playlists: 0, formations: 0 },
      backupDate: '2023/1/1 0:00:00',
      appVersion: '1.0.0'
    })
  })

  describe('表示制御', () => {
    it('isOpenがfalseの場合、何も表示されないこと', () => {
      render(<BackupManager {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('データバックアップ')).not.toBeInTheDocument()
    })

    it('isOpenがtrueの場合、モーダルが表示されること', () => {
      render(<BackupManager {...defaultProps} />)

      expect(screen.getByText('データバックアップ')).toBeInTheDocument()
      expect(screen.getByText('エクスポート')).toBeInTheDocument()
      expect(screen.getByText('インポート')).toBeInTheDocument()
    })
  })

  describe('タブ機能', () => {
    it('デフォルトでエクスポートタブが選択されていること', () => {
      render(<BackupManager {...defaultProps} />)

      expect(screen.getByText('データをバックアップ')).toBeInTheDocument()
    })

    it('インポートタブに切り替えられること', () => {
      render(<BackupManager {...defaultProps} />)

      fireEvent.click(screen.getByText('インポート'))

      expect(screen.getByText('データを復元')).toBeInTheDocument()
    })
  })

  describe('エクスポート機能', () => {
    it('エクスポートボタンをクリックするとエクスポート処理が実行されること', async () => {
      render(<BackupManager {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /バックアップファイルをダウンロード/i })
      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(BackupUtil.exportAllData).toHaveBeenCalledTimes(2) // useEffect + ボタンクリック
        expect(BackupUtil.downloadBackup).toHaveBeenCalledTimes(1)
        expect(mockOnSuccess).toHaveBeenCalledWith('エクスポート成功')
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('エクスポートに失敗した場合、エラーメッセージが表示されること', async () => {
      // 最初のuseEffectでは成功、ボタンクリック時で失敗させる
      let callCount = 0
      vi.mocked(BackupUtil.exportAllData).mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            success: true,
            message: 'エクスポート成功',
            data: {
              version: '1.0.0',
              timestamp: '2023-01-01T00:00:00.000Z',
              data: { plays: [], playlists: [], formations: [], settings: {} },
              metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
            }
          }
        }
        return {
          success: false,
          message: 'エクスポート失敗'
        }
      })

      render(<BackupManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /バックアップファイルをダウンロード/i }))

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('エクスポート失敗')
      })
    })

    it('現在のデータ統計が表示されること', () => {
      render(<BackupManager {...defaultProps} />)

      expect(screen.getByText('プレイ:')).toBeInTheDocument()
      expect(screen.getByText('プレイリスト:')).toBeInTheDocument()
      expect(screen.getByText('フォーメーション:')).toBeInTheDocument()
      expect(screen.getByText('ストレージ使用量:')).toBeInTheDocument()
    })
  })

  describe('インポート機能', () => {
    beforeEach(() => {
      render(<BackupManager {...defaultProps} />)
      fireEvent.click(screen.getByText('インポート'))
    })

    it('ファイル選択フィールドが表示されること', () => {
      expect(screen.getByText('バックアップファイル選択')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /choose file/i }) || screen.getByText(/choose file/i) || screen.getByText(/ファイルを選択/)).toBeInTheDocument()
    })

    it('有効なファイルを選択すると、プレビューが表示されること', async () => {
      const mockBackupData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          plays: [{ id: 'play-1' }],
          playlists: [{ id: 'playlist-1' }],
          formations: [{ id: 'formation-1' }],
          settings: {}
        },
        metadata: {
          totalPlays: 1,
          totalPlaylists: 1,
          totalFormations: 1,
          exportedBy: 'user',
          appVersion: '1.0.0'
        }
      }

      vi.mocked(BackupUtil.readBackupFile).mockResolvedValue({
        success: true,
        data: mockBackupData
      })

      vi.mocked(BackupUtil.getBackupStats).mockReturnValue({
        totalItems: 3,
        breakdown: { plays: 1, playlists: 1, formations: 1 },
        backupDate: '2023/1/1 0:00:00',
        appVersion: '1.0.0'
      })

      const file = new File(['test'], 'backup.json', { type: 'application/json' })
      const fileInput = screen.getByLabelText('バックアップファイル選択') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(BackupUtil.readBackupFile).toHaveBeenCalledWith(file)
        expect(screen.getByText('バックアップ内容')).toBeInTheDocument()
      })
    })

    it('無効なファイルを選択するとエラーメッセージが表示されること', async () => {
      vi.mocked(BackupUtil.readBackupFile).mockResolvedValue({
        success: false,
        error: '無効なファイルです'
      })

      const file = new File(['invalid'], 'backup.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText('バックアップファイル選択') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('無効なファイルです')
      })
    })

    it('インポートオプションを変更できること', async () => {
      // まず有効なファイルを選択してプレビューを表示
      const mockBackupData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: { plays: [], playlists: [], formations: [], settings: {} },
        metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
      }

      vi.mocked(BackupUtil.readBackupFile).mockResolvedValue({
        success: true,
        data: mockBackupData
      })

      const file = new File(['test'], 'backup.json', { type: 'application/json' })
      const fileInput = screen.getByLabelText('バックアップファイル選択') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('インポートオプション')).toBeInTheDocument()
      })

      // 上書きオプションをチェック
      const overwriteCheckbox = screen.getByLabelText('既存データを上書きする')
      fireEvent.click(overwriteCheckbox)

      expect(overwriteCheckbox).toBeChecked()
      expect(screen.getByText('注意: 上書きモードでは既存のデータが置き換えられます。')).toBeInTheDocument()
    })

    it('インポートボタンをクリックするとインポート処理が実行されること', async () => {
      // プレビューを表示するための準備
      const mockBackupData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: { plays: [], playlists: [], formations: [], settings: {} },
        metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
      }

      vi.mocked(BackupUtil.readBackupFile).mockResolvedValue({
        success: true,
        data: mockBackupData
      })

      vi.mocked(BackupUtil.importAllData).mockResolvedValue({
        success: true,
        message: 'インポート成功',
        imported: { plays: 0, playlists: 0, formations: 0, settingsRestored: false }
      })

      const file = new File(['test'], 'backup.json', { type: 'application/json' })
      const fileInput = screen.getByLabelText('バックアップファイル選択') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText('データを復元')).toBeInTheDocument()
      })

      const importButton = screen.getByRole('button', { name: 'データを復元' })
      fireEvent.click(importButton)

      await waitFor(() => {
        expect(BackupUtil.importAllData).toHaveBeenCalledWith(mockBackupData, {
          overwrite: false,
          skipDuplicates: true
        })
        expect(mockOnSuccess).toHaveBeenCalledWith('インポート成功')
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('モーダル操作', () => {
    it('×ボタンをクリックするとモーダルが閉じること', () => {
      render(<BackupManager {...defaultProps} />)

      fireEvent.click(screen.getByText('×'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('ローディング中は×ボタンが無効化されること', async () => {
      vi.mocked(BackupUtil.exportAllData).mockImplementation(async () => {
        return new Promise(resolve => setTimeout(() => resolve({
          success: true,
          message: 'success',
          data: undefined
        }), 100))
      })

      render(<BackupManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /バックアップファイルをダウンロード/i }))

      // ローディング中の確認
      await waitFor(() => {
        expect(screen.getByText('エクスポート中...')).toBeInTheDocument()
      })

      const closeButton = screen.getByText('×')
      expect(closeButton).toBeDisabled()
    })
  })

  describe('エラーハンドリング', () => {
    it('予期しないエラーが発生した場合の処理', async () => {
      // useEffectとボタンクリックで異なる動作をさせる
      let callCount = 0
      vi.mocked(BackupUtil.exportAllData).mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          // 初回（useEffect）は正常なデータを返す
          return {
            success: true,
            message: 'success',
            data: {
              version: '1.0.0',
              timestamp: '2023-01-01T00:00:00.000Z',
              data: { plays: [], playlists: [], formations: [], settings: {} },
              metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
            }
          }
        }
        // 2回目（ボタンクリック時）はエラーを投げる
        throw new Error('Unexpected error')
      })

      render(<BackupManager {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /バックアップファイルをダウンロード/i }))

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('バックアップの作成に失敗しました')
      })
    })
  })
})