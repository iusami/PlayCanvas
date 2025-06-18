import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AutoBackupManager } from '../../src/utils/autoBackup'
import { BackupManager } from '../../src/utils/backup'
import { SettingsStorage } from '../../src/utils/storage'
import { localStorageMock } from '../setup'

// モジュールをモック
vi.mock('../../src/utils/backup', () => ({
  BackupManager: {
    exportAllData: vi.fn(),
    downloadBackup: vi.fn(),
    importAllData: vi.fn(),
  }
}))

vi.mock('../../src/utils/storage', () => ({
  SettingsStorage: {
    getSettings: vi.fn(),
    updateAutoBackupSettings: vi.fn(),
  }
}))

describe('AutoBackupManager', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('shouldCreateBackup', () => {
    it('自動バックアップが無効の場合、falseを返すこと', async () => {
      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
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
      })

      const result = await AutoBackupManager.shouldCreateBackup()
      expect(result).toBe(false)
    })

    it('初回バックアップの場合、trueを返すこと', async () => {
      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'weekly',
          maxBackupFiles: 5,
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: undefined // 初回バックアップ
        },
        theme: 'light',
        language: 'ja'
      })

      const result = await AutoBackupManager.shouldCreateBackup()
      expect(result).toBe(true)
    })

    it('毎日間隔で24時間経過した場合、trueを返すこと', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'daily',
          maxBackupFiles: 5,
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: yesterday
        },
        theme: 'light',
        language: 'ja'
      })

      const result = await AutoBackupManager.shouldCreateBackup()
      expect(result).toBe(true)
    })

    it('毎日間隔でまだ24時間経過していない場合、falseを返すこと', async () => {
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'daily',
          maxBackupFiles: 5,
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: oneHourAgo
        },
        theme: 'light',
        language: 'ja'
      })

      const result = await AutoBackupManager.shouldCreateBackup()
      expect(result).toBe(false)
    })
  })

  describe('createAutoBackup', () => {
    it('自動バックアップを正常に作成できること', async () => {
      const mockBackupData = {
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
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

      vi.mocked(BackupManager.exportAllData).mockResolvedValue({
        success: true,
        message: 'エクスポート成功',
        data: mockBackupData
      })

      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'weekly',
          maxBackupFiles: 5,
          includeSettings: true,
          customFileName: 'test-backup',
          lastBackupDate: undefined
        },
        theme: 'light',
        language: 'ja'
      })

      const result = await AutoBackupManager.createAutoBackup()

      expect(result.success).toBe(true)
      expect(result.message).toContain('自動バックアップ')
      expect(result.filename).toContain('test-backup')
      expect(SettingsStorage.updateAutoBackupSettings).toHaveBeenCalled()
    })

    it('エクスポートが失敗した場合、エラーを返すこと', async () => {
      vi.mocked(BackupManager.exportAllData).mockResolvedValue({
        success: false,
        message: 'エクスポート失敗'
      })

      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'weekly',
          maxBackupFiles: 5,
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: undefined
        },
        theme: 'light',
        language: 'ja'
      })

      const result = await AutoBackupManager.createAutoBackup()

      expect(result.success).toBe(false)
      expect(result.message).toBe('エクスポート失敗')
    })

    it('最大ファイル数を超えた場合、古いファイルを削除すること', async () => {
      const mockBackupData = {
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        data: { plays: [], playlists: [], formations: [], settings: {} },
        metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
      }

      vi.mocked(BackupManager.exportAllData).mockResolvedValue({
        success: true,
        message: 'エクスポート成功',
        data: mockBackupData
      })

      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'weekly',
          maxBackupFiles: 2, // 最大2ファイル
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: undefined
        },
        theme: 'light',
        language: 'ja'
      })

      // 既存の2つのバックアップファイルを設定
      const existingBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-2024-01-01T00-00-00.json',
          createdAt: new Date('2024-01-01'),
          size: 1000,
          data: mockBackupData
        },
        {
          id: 'backup-2',
          filename: 'auto-backup-2024-01-02T00-00-00.json',
          createdAt: new Date('2024-01-02'),
          size: 1000,
          data: mockBackupData
        }
      ]
      localStorage.setItem('football-canvas-auto-backups', JSON.stringify(existingBackups))

      const result = await AutoBackupManager.createAutoBackup()

      expect(result.success).toBe(true)

      // 保存されたバックアップリストを確認
      const savedBackups = JSON.parse(localStorage.getItem('football-canvas-auto-backups') || '[]')
      expect(savedBackups).toHaveLength(2) // 最大数を維持
    })
  })

  describe('getAutoBackupList', () => {
    it('空のバックアップリストを正常に取得できること', async () => {
      const backups = await AutoBackupManager.getAutoBackupList()
      expect(backups).toEqual([])
    })

    it('バックアップリストを正常に取得できること', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-2024-01-01T00-00-00.json',
          createdAt: '2024-01-01T00:00:00.000Z',
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      localStorage.setItem('football-canvas-auto-backups', JSON.stringify(mockBackups))

      const backups = await AutoBackupManager.getAutoBackupList()

      expect(backups).toHaveLength(1)
      expect(backups[0].id).toBe('backup-1')
      expect(backups[0].createdAt).toBeInstanceOf(Date)
    })
  })

  describe('deleteAutoBackup', () => {
    it('指定したバックアップファイルを削除できること', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-1.json',
          createdAt: new Date(),
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        },
        {
          id: 'backup-2',
          filename: 'auto-backup-2.json',
          createdAt: new Date(),
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      localStorage.setItem('football-canvas-auto-backups', JSON.stringify(mockBackups))

      const result = await AutoBackupManager.deleteAutoBackup('backup-1')

      expect(result.success).toBe(true)
      expect(result.message).toContain('削除しました')

      const remainingBackups = await AutoBackupManager.getAutoBackupList()
      expect(remainingBackups).toHaveLength(1)
      expect(remainingBackups[0].id).toBe('backup-2')
    })

    it('存在しないバックアップファイルを削除しようとした場合、エラーを返すこと', async () => {
      const result = await AutoBackupManager.deleteAutoBackup('non-existent-id')

      expect(result.success).toBe(false)
      expect(result.message).toContain('見つかりません')
    })
  })

  describe('cleanupOldBackups', () => {
    it('クリーンアップが不要な場合、メッセージを返すこと', async () => {
      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'weekly',
          maxBackupFiles: 5,
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: undefined
        },
        theme: 'light',
        language: 'ja'
      })

      // 最大数以下のバックアップファイルを設定
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-1.json',
          createdAt: new Date('2024-01-01'),
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      localStorage.setItem('football-canvas-auto-backups', JSON.stringify(mockBackups))

      const result = await AutoBackupManager.cleanupOldBackups()

      expect(result.success).toBe(true)
      expect(result.message).toContain('クリーンアップが必要なファイルはありません')
      expect(result.deletedCount).toBe(0)
    })

    it('古いバックアップファイルをクリーンアップできること', async () => {
      vi.mocked(SettingsStorage.getSettings).mockResolvedValue({
        autoBackup: {
          enabled: true,
          interval: 'weekly',
          maxBackupFiles: 2, // 最大2ファイル
          includeSettings: true,
          customFileName: undefined,
          lastBackupDate: undefined
        },
        theme: 'light',
        language: 'ja'
      })

      // 最大数を超えるバックアップファイルを設定
      const mockBackups = [
        {
          id: 'backup-1',
          filename: 'auto-backup-1.json',
          createdAt: new Date('2024-01-01'),
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        },
        {
          id: 'backup-2',
          filename: 'auto-backup-2.json',
          createdAt: new Date('2024-01-02'),
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        },
        {
          id: 'backup-3',
          filename: 'auto-backup-3.json',
          createdAt: new Date('2024-01-03'),
          size: 1000,
          data: {
            version: '1.0.0',
            timestamp: '2024-01-01T00:00:00.000Z',
            data: { plays: [], playlists: [], formations: [], settings: {} },
            metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
          }
        }
      ]
      localStorage.setItem('football-canvas-auto-backups', JSON.stringify(mockBackups))

      const result = await AutoBackupManager.cleanupOldBackups()

      expect(result.success).toBe(true)
      expect(result.message).toContain('1個の古いバックアップファイルを削除しました')
      expect(result.deletedCount).toBe(1)

      const remainingBackups = await AutoBackupManager.getAutoBackupList()
      expect(remainingBackups).toHaveLength(2)
      // 新しいファイルが残っているか確認（作成日時順でソート）
      expect(remainingBackups.map(b => b.id)).toEqual(['backup-3', 'backup-2'])
    })
  })
})