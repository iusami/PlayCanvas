import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BackupManager, BackupData } from '@/utils/backup'
import { PlayStorage, PlaylistStorage, FormationStorage, SettingsStorage } from '@/utils/storage'
import { Play, Playlist, FormationTemplate } from '@/types'

// ストレージモジュールをモック
vi.mock('@/utils/storage', () => ({
  PlayStorage: {
    getAllPlays: vi.fn(),
    savePlay: vi.fn(),
  },
  PlaylistStorage: {
    getAllPlaylists: vi.fn(),
    savePlaylist: vi.fn(),
  },
  FormationStorage: {
    getAllFormations: vi.fn(),
    saveFormation: vi.fn(),
  },
  SettingsStorage: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
}))

describe('BackupManager', () => {
  const mockPlay: Play = {
    id: 'play-1',
    metadata: {
      title: 'Test Play',
      description: 'Test Description',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      tags: ['test'],
      playName: 'Play 1',
      offFormation: '11 Personnel',
      defFormation: '4-3',
      playType: 'offense'
    },
    field: {
      width: 800,
      height: 600,
      backgroundColor: '#00AA00',
      lineColor: '#FFFFFF',
      yardLines: true,
      hashMarks: true
    },
    players: [],
    arrows: [],
    texts: [],
    textBoxEntries: []
  }

  const mockPlaylist: Playlist = {
    id: 'playlist-1',
    title: 'Test Playlist',
    description: 'Test Playlist Description',
    playIds: ['play-1'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }

  const mockFormation: FormationTemplate = {
    id: 'formation-1',
    name: 'Test Formation',
    type: 'offense',
    description: 'Test Formation Description',
    players: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }

  const mockSettings = {
    theme: 'light',
    language: 'ja'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportAllData', () => {
    it('すべてのデータを正常にエクスポートできること', async () => {
      // モックデータの設定
      vi.mocked(PlayStorage.getAllPlays).mockReturnValue([mockPlay])
      vi.mocked(PlaylistStorage.getAllPlaylists).mockReturnValue([mockPlaylist])
      vi.mocked(FormationStorage.getAllFormations).mockReturnValue([mockFormation])
      vi.mocked(SettingsStorage.getSettings).mockReturnValue(mockSettings)

      const result = await BackupManager.exportAllData()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.data.plays).toHaveLength(1)
      expect(result.data!.data.playlists).toHaveLength(1)
      expect(result.data!.data.formations).toHaveLength(1)
      expect(result.data!.data.settings).toEqual(mockSettings)
      expect(result.data!.metadata.totalPlays).toBe(1)
      expect(result.data!.metadata.totalPlaylists).toBe(1)
      expect(result.data!.metadata.totalFormations).toBe(1)
    })

    it('データが空の場合でも正常にエクスポートできること', async () => {
      vi.mocked(PlayStorage.getAllPlays).mockReturnValue([])
      vi.mocked(PlaylistStorage.getAllPlaylists).mockReturnValue([])
      vi.mocked(FormationStorage.getAllFormations).mockReturnValue([])
      vi.mocked(SettingsStorage.getSettings).mockReturnValue({})

      const result = await BackupManager.exportAllData()

      expect(result.success).toBe(true)
      expect(result.data!.data.plays).toHaveLength(0)
      expect(result.data!.data.playlists).toHaveLength(0)
      expect(result.data!.data.formations).toHaveLength(0)
    })

    it('エラーが発生した場合、失敗を返すこと', async () => {
      vi.mocked(PlayStorage.getAllPlays).mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await BackupManager.exportAllData()

      expect(result.success).toBe(false)
      expect(result.message).toBe('データのエクスポートに失敗しました')
      expect(result.error).toBeDefined()
    })
  })

  describe('validateBackupData', () => {
    const validBackupData: BackupData = {
      version: '1.0.0',
      timestamp: '2023-01-01T00:00:00.000Z',
      data: {
        plays: [mockPlay],
        playlists: [mockPlaylist],
        formations: [mockFormation],
        settings: mockSettings
      },
      metadata: {
        totalPlays: 1,
        totalPlaylists: 1,
        totalFormations: 1,
        exportedBy: 'user',
        appVersion: '1.0.0'
      }
    }

    it('有効なバックアップデータを正常に検証できること', () => {
      const result = BackupManager.validateBackupData(validBackupData)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('無効なデータ構造を検出できること', () => {
      const result = BackupManager.validateBackupData(null)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('無効なバックアップファイル形式です')
    })

    it('バージョン情報が欠如している場合を検出できること', () => {
      const invalidData = { ...validBackupData, version: undefined }
      const result = BackupManager.validateBackupData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('バックアップバージョン情報が見つかりません')
    })

    it('データセクションが欠如している場合を検出できること', () => {
      const invalidData = { ...validBackupData, data: undefined }
      const result = BackupManager.validateBackupData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('バックアップデータが見つかりません')
    })

    it('無効なプレイデータを検出できること', () => {
      const invalidData = {
        ...validBackupData,
        data: {
          ...validBackupData.data,
          plays: [{ id: 'invalid' }] // 不完全なプレイオブジェクト
        }
      }
      const result = BackupManager.validateBackupData(invalidData)

      expect(result.valid).toBe(false)
      expect(result.errors.some(error => error.includes('プレイ 1 のデータが無効です'))).toBe(true)
    })
  })

  describe('importAllData', () => {
    const validBackupData: BackupData = {
      version: '1.0.0',
      timestamp: '2023-01-01T00:00:00.000Z',
      data: {
        plays: [mockPlay],
        playlists: [mockPlaylist],
        formations: [mockFormation],
        settings: mockSettings
      },
      metadata: {
        totalPlays: 1,
        totalPlaylists: 1,
        totalFormations: 1,
        exportedBy: 'user',
        appVersion: '1.0.0'
      }
    }

    beforeEach(() => {
      vi.mocked(PlayStorage.getAllPlays).mockReturnValue([])
      vi.mocked(PlaylistStorage.getAllPlaylists).mockReturnValue([])
      vi.mocked(FormationStorage.getAllFormations).mockReturnValue([])
    })

    it('新しいデータを正常にインポートできること', () => {
      const result = BackupManager.importAllData(validBackupData)

      expect(result.success).toBe(true)
      expect(result.imported.plays).toBe(1)
      expect(result.imported.playlists).toBe(1)
      expect(result.imported.formations).toBe(1)
      expect(vi.mocked(PlayStorage.savePlay)).toHaveBeenCalledTimes(1)
      expect(vi.mocked(PlaylistStorage.savePlaylist)).toHaveBeenCalledTimes(1)
      expect(vi.mocked(FormationStorage.saveFormation)).toHaveBeenCalledTimes(1)
    })

    it('上書きモードでデータをインポートできること', () => {
      const result = BackupManager.importAllData(validBackupData, { overwrite: true })

      expect(result.success).toBe(true)
      expect(result.imported.settingsRestored).toBe(true)
      expect(vi.mocked(SettingsStorage.saveSettings)).toHaveBeenCalledWith(mockSettings)
    })

    it('重複データをスキップできること', () => {
      // 既存データに同じタイトルのプレイが存在する場合
      vi.mocked(PlayStorage.getAllPlays).mockReturnValue([{
        ...mockPlay,
        id: 'existing-play',
        metadata: { ...mockPlay.metadata, title: 'Test Play' }
      }])

      const result = BackupManager.importAllData(validBackupData, { skipDuplicates: true })

      expect(result.success).toBe(true)
      expect(result.imported.plays).toBe(0) // 重複のためスキップ
    })

    it('無効なバックアップデータの場合、エラーを返すこと', () => {
      const invalidData = { invalid: 'data' } as any

      const result = BackupManager.importAllData(invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('readBackupFile', () => {
    it('有効なJSONファイルを正常に読み込めること', async () => {
      const validData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: { 
          plays: [], 
          playlists: [], 
          formations: [], 
          settings: {} 
        },
        metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
      }
      
      // File.prototypeのtextメソッドをモック
      const mockText = vi.fn().mockResolvedValue(JSON.stringify(validData))
      const file = { 
        type: 'application/json',
        text: mockText
      } as unknown as File

      const result = await BackupManager.readBackupFile(file)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('無効なファイル形式の場合、エラーを返すこと', async () => {
      const file = new File(['test'], 'backup.txt', { type: 'text/plain' })

      const result = await BackupManager.readBackupFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toBe('JSONファイルを選択してください')
    })

    it('無効なJSONの場合、エラーを返すこと', async () => {
      const file = new File(['invalid json'], 'backup.json', { type: 'application/json' })

      const result = await BackupManager.readBackupFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toContain('ファイルの読み込みに失敗しました')
    })
  })

  describe('getBackupStats', () => {
    it('バックアップ統計情報を正常に取得できること', () => {
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: {
          plays: [mockPlay, mockPlay],
          playlists: [mockPlaylist],
          formations: [mockFormation, mockFormation, mockFormation],
          settings: {}
        },
        metadata: {
          totalPlays: 2,
          totalPlaylists: 1,
          totalFormations: 3,
          exportedBy: 'user',
          appVersion: '1.0.0'
        }
      }

      const stats = BackupManager.getBackupStats(backupData)

      expect(stats.totalItems).toBe(6) // 2 + 1 + 3
      expect(stats.breakdown.plays).toBe(2)
      expect(stats.breakdown.playlists).toBe(1)
      expect(stats.breakdown.formations).toBe(3)
      expect(stats.appVersion).toBe('1.0.0')
      expect(stats.backupDate).toBeDefined()
    })
  })

  describe('downloadBackup', () => {
    it('ダウンロード機能が正常に動作すること', () => {
      // DOM操作のモック
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
      
      // グローバルなURL.createObjectURLをモック
      const originalURL = global.URL
      global.URL = {
        ...originalURL,
        createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: vi.fn()
      } as any

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: { plays: [], playlists: [], formations: [], settings: {} },
        metadata: { totalPlays: 0, totalPlaylists: 0, totalFormations: 0, exportedBy: 'user', appVersion: '1.0.0' }
      }

      expect(() => BackupManager.downloadBackup(backupData)).not.toThrow()

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.click).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink)

      // クリーンアップ
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
      global.URL = originalURL
    })
  })
})