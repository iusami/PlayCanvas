import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { SettingsModal } from '@/components/Settings/SettingsModal'
import { SettingsStorage } from '@/utils/storage'
import { AutoBackupManager } from '@/utils/autoBackup'

// モジュールをモック
vi.mock('@/utils/storage', () => ({
  SettingsStorage: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    updateAutoBackupSettings: vi.fn(),
  }
}))

vi.mock('@/utils/autoBackup', () => ({
  AutoBackupManager: {
    getAutoBackupList: vi.fn(),
    createAutoBackup: vi.fn(),
    deleteAutoBackup: vi.fn(),
    downloadAutoBackup: vi.fn(),
  }
}))

describe('SettingsModal Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    onError: mockOnError
  }

  const mockSettings = {
    autoBackup: {
      enabled: false,
      interval: 'weekly' as const,
      maxBackupFiles: 5,
      includeSettings: true,
      customFileName: undefined,
      lastBackupDate: undefined
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(SettingsStorage.getSettings).mockResolvedValue(mockSettings)
    vi.mocked(SettingsStorage.saveSettings).mockResolvedValue()
    vi.mocked(AutoBackupManager.getAutoBackupList).mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
  })

  describe('表示制御', () => {
    it('isOpenがfalseの場合、何も表示されないこと', () => {
      render(<SettingsModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('設定')).not.toBeInTheDocument()
    })

    it('isOpenがtrueの場合、モーダルが表示されること', async () => {
      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /設定/i })).toBeInTheDocument()
        expect(screen.getByText('自動バックアップ')).toBeInTheDocument()
      })
    })
  })

  describe('表示内容', () => {
    it('デフォルトで自動バックアップ設定が表示されること', async () => {
      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('自動バックアップ設定')).toBeInTheDocument()
      })
    })
  })

  describe('自動バックアップ設定', () => {
    beforeEach(async () => {
      render(<SettingsModal {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('自動バックアップ設定')).toBeInTheDocument()
      })
    })

    it('自動バックアップを有効にできること', async () => {
      await waitFor(() => {
        const enableCheckbox = screen.getByLabelText('自動バックアップを有効にする')
        fireEvent.click(enableCheckbox)
        expect(enableCheckbox).toBeChecked()
      })
    })

    it('自動バックアップを有効にした場合、詳細設定が表示されること', async () => {
      await waitFor(() => {
        const enableCheckbox = screen.getByLabelText('自動バックアップを有効にする')
        fireEvent.click(enableCheckbox)
      })

      await waitFor(() => {
        expect(screen.getByText('バックアップ間隔')).toBeInTheDocument()
        expect(screen.getByText('保持するバックアップファイル数')).toBeInTheDocument()
      })
    })

    it('バックアップ間隔を変更できること', async () => {
      // まず自動バックアップを有効にする
      await waitFor(() => {
        const enableCheckbox = screen.getByLabelText('自動バックアップを有効にする')
        fireEvent.click(enableCheckbox)
      })

      await waitFor(() => {
        const intervalSelect = screen.getByDisplayValue('毎週')
        fireEvent.change(intervalSelect, { target: { value: 'daily' } })
        expect(intervalSelect).toHaveValue('daily')
      })
    })

    it('手動バックアップを作成できること', async () => {
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: true,
        message: 'バックアップを作成しました',
        filename: 'test-backup.json'
      })

      await waitFor(() => {
        const createBackupButton = screen.getByText('今すぐバックアップを作成')
        fireEvent.click(createBackupButton)
      })

      await waitFor(() => {
        expect(AutoBackupManager.createAutoBackup).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalledWith('バックアップを作成しました')
      })
    })

    it('手動バックアップが失敗した場合、エラーメッセージが表示されること', async () => {
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: false,
        message: 'バックアップの作成に失敗しました'
      })

      await waitFor(() => {
        const createBackupButton = screen.getByText('今すぐバックアップを作成')
        fireEvent.click(createBackupButton)
      })

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('バックアップの作成に失敗しました')
      })
    })
  })

  describe('自動バックアップ履歴', () => {
    it('バックアップ履歴が表示されること', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-2024-01-01.json',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          size: 1024,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      vi.mocked(AutoBackupManager.getAutoBackupList).mockResolvedValue(mockBackups)

      render(<SettingsModal {...defaultProps} />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('自動バックアップ'))
      })

      await waitFor(() => {
        expect(screen.getByText('自動バックアップ履歴')).toBeInTheDocument()
        expect(screen.getByText('auto-backup-2024-01-01.json')).toBeInTheDocument()
        expect(screen.getByText(/1 KB/)).toBeInTheDocument()
      })
    })

    it('バックアップファイルをダウンロードできること', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-2024-01-01.json',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          size: 1024,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      vi.mocked(AutoBackupManager.getAutoBackupList).mockResolvedValue(mockBackups)

      render(<SettingsModal {...defaultProps} />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('自動バックアップ'))
      })

      await waitFor(() => {
        const downloadButton = screen.getByText('ダウンロード')
        fireEvent.click(downloadButton)
      })

      expect(AutoBackupManager.downloadAutoBackup).toHaveBeenCalledWith('backup-1')
      expect(mockOnSuccess).toHaveBeenCalledWith('バックアップファイルをダウンロードしました')
    })

    it('バックアップファイルを削除できること', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-2024-01-01.json',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          size: 1024,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      vi.mocked(AutoBackupManager.getAutoBackupList).mockResolvedValue(mockBackups)
      vi.mocked(AutoBackupManager.deleteAutoBackup).mockResolvedValue({
        success: true,
        message: 'バックアップファイルを削除しました'
      })

      // window.confirmをモック
      const mockConfirm = vi.fn(() => true)
      Object.defineProperty(window, 'confirm', {
        value: mockConfirm,
        writable: true
      })

      render(<SettingsModal {...defaultProps} />)
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('自動バックアップ'))
      })

      await waitFor(() => {
        const deleteButton = screen.getByText('削除')
        fireEvent.click(deleteButton)
      })

      expect(mockConfirm).toHaveBeenCalledWith('このバックアップファイルを削除しますか？')
      expect(AutoBackupManager.deleteAutoBackup).toHaveBeenCalledWith('backup-1')
    })
  })

  describe('設定保存', () => {
    it('保存ボタンをクリックすると設定が保存されること', async () => {
      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        const saveButton = screen.getByText('保存')
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(SettingsStorage.saveSettings).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalledWith('設定を保存しました')
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('保存に失敗した場合、エラーメッセージが表示されること', async () => {
      vi.mocked(SettingsStorage.saveSettings).mockRejectedValue(new Error('保存エラー'))

      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        const saveButton = screen.getByText('保存')
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('設定の保存に失敗しました')
      })
    })
  })

  describe('モーダル操作', () => {
    it('×ボタンをクリックするとモーダルが閉じること', async () => {
      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /設定/i })).toBeInTheDocument()
      })

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('キャンセルボタンをクリックするとモーダルが閉じること', async () => {
      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /設定/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByText('キャンセル')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('ローディング中はボタンが無効化されること', async () => {
      vi.mocked(SettingsStorage.saveSettings).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        const saveButton = screen.getByText('保存')
        fireEvent.click(saveButton)
      })

      await waitFor(() => {
        expect(screen.getByText('保存中...')).toBeInTheDocument()
        const closeButton = screen.getByText('×')
        expect(closeButton).toBeDisabled()
      })
    })
  })
})