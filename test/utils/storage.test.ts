import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlayStorage, PlaylistStorage, SettingsStorage, StorageUtils, FormationStorage } from '../../src/utils/storage'
import { Play, Playlist, FormationTemplate } from '../../src/types'
import { localStorageMock } from '../setup'

// テストデータの作成
const createMockPlay = (id: string = 'test-play-1', title: string = 'テストプレイ'): Play => ({
  id,
  metadata: {
    title,
    description: 'テスト用のプレイです',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    tags: ['テスト'],
    playName: 'テストプレイ名',
    offFormation: '4-3',
    defFormation: '3-4',
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
  players: [
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
    }
  ],
  arrows: [],
  texts: [],
  center: { x: 400, y: 300 }
})

const createMockPlaylist = (id: string = 'test-playlist-1', title: string = 'テストプレイリスト'): Playlist => ({
  id,
  title,
  description: 'テスト用のプレイリストです',
  playIds: ['test-play-1', 'test-play-2'],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
})

const createMockFormation = (id: string = 'test-formation-1', name: string = 'テストフォーメーション'): FormationTemplate => ({
  id,
  name,
  description: 'テスト用のフォーメーションです',
  type: 'offense',
  players: [
    {
      x: 400,
      y: 300,
      type: 'circle',
      position: 'QB',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense'
    }
  ],
  center: { x: 400, y: 300 },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
})

describe('PlayStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('getAllPlays', () => {
    it('空のlocalStorageからは空配列を返すこと', async () => {
      const plays = await PlayStorage.getAllPlays()
      expect(plays).toEqual([])
    })

    it('有効なJSONデータからプレイ配列を復元すること', async () => {
      const mockPlays = [createMockPlay()]
      localStorageMock.setItem('football-canvas-plays', JSON.stringify(mockPlays))

      const plays = await PlayStorage.getAllPlays()
      
      expect(plays).toHaveLength(1)
      expect(plays[0].id).toBe('test-play-1')
      expect(plays[0].metadata.title).toBe('テストプレイ')
      expect(plays[0].metadata.createdAt).toBeInstanceOf(Date)
      expect(plays[0].metadata.updatedAt).toBeInstanceOf(Date)
    })

    it('無効なJSONデータの場合は空配列を返すこと', async () => {
      localStorageMock.setItem('football-canvas-plays', 'invalid-json')

      const plays = await PlayStorage.getAllPlays()
      expect(plays).toEqual([])
    })
  })

  describe('getPlay', () => {
    it('指定したIDのプレイを返すこと', async () => {
      const mockPlays = [createMockPlay('play-1'), createMockPlay('play-2', 'プレイ2')]
      localStorageMock.setItem('football-canvas-plays', JSON.stringify(mockPlays))

      const play = await PlayStorage.getPlay('play-2')
      
      expect(play).not.toBeNull()
      expect(play?.id).toBe('play-2')
      expect(play?.metadata.title).toBe('プレイ2')
    })

    it('存在しないIDの場合はnullを返すこと', async () => {
      const mockPlays = [createMockPlay()]
      localStorageMock.setItem('football-canvas-plays', JSON.stringify(mockPlays))

      const play = await PlayStorage.getPlay('non-existent-id')
      expect(play).toBeNull()
    })
  })

  describe('savePlay', () => {
    it('新しいプレイを保存できること', async () => {
      const newPlay = createMockPlay()
      
      await PlayStorage.savePlay(newPlay)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'football-canvas-plays',
        JSON.stringify([newPlay])
      )
    })

    it('既存のプレイを更新できること', async () => {
      const originalPlay = createMockPlay()
      const updatedPlay = { ...originalPlay, metadata: { ...originalPlay.metadata, title: '更新されたプレイ' } }
      
      localStorageMock.setItem('football-canvas-plays', JSON.stringify([originalPlay]))
      
      await PlayStorage.savePlay(updatedPlay)
      
      const savedPlays = JSON.parse(localStorageMock.store['football-canvas-plays'])
      expect(savedPlays).toHaveLength(1)
      expect(savedPlays[0].metadata.title).toBe('更新されたプレイ')
    })

    it('保存エラーが発生した場合は例外をスローすること', async () => {
      // localStorageのsetItemをエラーにする
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const newPlay = createMockPlay()
      
      await expect(async () => await PlayStorage.savePlay(newPlay)).rejects.toThrow('プレイの保存に失敗しました')
    })
  })

  describe('deletePlay', () => {
    it('指定したIDのプレイを削除できること', async () => {
      const mockPlays = [createMockPlay('play-1'), createMockPlay('play-2')]
      localStorageMock.setItem('football-canvas-plays', JSON.stringify(mockPlays))

      await PlayStorage.deletePlay('play-1')

      const savedPlays = JSON.parse(localStorageMock.store['football-canvas-plays'])
      expect(savedPlays).toHaveLength(1)
      expect(savedPlays[0].id).toBe('play-2')
    })

    it('削除エラーが発生した場合は例外をスローすること', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      await expect(async () => await PlayStorage.deletePlay('test-id')).rejects.toThrow('プレイの削除に失敗しました')
    })
  })

  describe('duplicatePlay', () => {
    it('指定したIDのプレイを複製できること', async () => {
      const originalPlay = createMockPlay('original-id', 'オリジナルプレイ')
      localStorageMock.setItem('football-canvas-plays', JSON.stringify([originalPlay]))

      const duplicatedPlay = await PlayStorage.duplicatePlay('original-id')

      expect(duplicatedPlay).not.toBeNull()
      expect(duplicatedPlay?.id).not.toBe('original-id') // 新しいIDが生成される
      expect(duplicatedPlay?.metadata.title).toBe('オリジナルプレイ (コピー)')
      expect(duplicatedPlay?.metadata.createdAt).toBeInstanceOf(Date)
      expect(duplicatedPlay?.metadata.updatedAt).toBeInstanceOf(Date)
    })

    it('存在しないIDの場合はnullを返すこと', async () => {
      const duplicatedPlay = await PlayStorage.duplicatePlay('non-existent-id')
      expect(duplicatedPlay).toBeNull()
    })
  })

  describe('exportPlay & importPlay', () => {
    it('プレイをJSONとしてエクスポートできること', async () => {
      const mockPlay = createMockPlay()
      localStorageMock.setItem('football-canvas-plays', JSON.stringify([mockPlay]))

      const exportedJson = await PlayStorage.exportPlay('test-play-1')
      
      expect(exportedJson).not.toBeNull()
      expect(() => JSON.parse(exportedJson!)).not.toThrow()
    })

    it('JSONからプレイをインポートできること', async () => {
      const mockPlay = createMockPlay('original-id', 'インポート元プレイ')
      const jsonString = JSON.stringify(mockPlay)

      const importedPlay = await PlayStorage.importPlay(jsonString)

      expect(importedPlay).not.toBeNull()
      expect(importedPlay?.id).not.toBe('original-id') // 新しいIDが生成される
      expect(importedPlay?.metadata.title).toBe('インポート元プレイ (インポート)')
    })

    it('無効なJSONの場合はnullを返すこと', async () => {
      const importedPlay = await PlayStorage.importPlay('invalid-json')
      expect(importedPlay).toBeNull()
    })
  })
})

describe('PlaylistStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('getAllPlaylists', () => {
    it('空のlocalStorageからは空配列を返すこと', async () => {
      const playlists = await PlaylistStorage.getAllPlaylists()
      expect(playlists).toEqual([])
    })

    it('有効なJSONデータからプレイリスト配列を復元すること', async () => {
      const mockPlaylists = [createMockPlaylist()]
      localStorageMock.setItem('football-canvas-playlists', JSON.stringify(mockPlaylists))

      const playlists = await PlaylistStorage.getAllPlaylists()
      
      expect(playlists).toHaveLength(1)
      expect(playlists[0].id).toBe('test-playlist-1')
      expect(playlists[0].createdAt).toBeInstanceOf(Date)
      expect(playlists[0].updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('savePlaylist & deletePlaylist', () => {
    it('新しいプレイリストを保存できること', async () => {
      const newPlaylist = createMockPlaylist()
      
      await PlaylistStorage.savePlaylist(newPlaylist)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'football-canvas-playlists',
        JSON.stringify([newPlaylist])
      )
    })

    it('プレイリストを削除できること', async () => {
      const mockPlaylists = [createMockPlaylist('playlist-1'), createMockPlaylist('playlist-2')]
      localStorageMock.setItem('football-canvas-playlists', JSON.stringify(mockPlaylists))

      await PlaylistStorage.deletePlaylist('playlist-1')

      const savedPlaylists = JSON.parse(localStorageMock.store['football-canvas-playlists'])
      expect(savedPlaylists).toHaveLength(1)
      expect(savedPlaylists[0].id).toBe('playlist-2')
    })
  })
})

describe('SettingsStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('設定を保存・取得できること', async () => {
    const testSettings = { theme: 'dark', language: 'ja' }
    
    await SettingsStorage.saveSettings(testSettings)
    const retrievedSettings = await SettingsStorage.getSettings()
    
    expect(retrievedSettings).toEqual(testSettings)
  })

  it('設定が存在しない場合は空オブジェクトを返すこと', async () => {
    const settings = await SettingsStorage.getSettings()
    expect(settings).toEqual({})
  })
})

describe('StorageUtils', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('checkStorageSpace', () => {
    it('ストレージ容量情報を返すこと', () => {
      const spaceInfo = StorageUtils.checkStorageSpace()
      
      expect(spaceInfo).toHaveProperty('available')
      expect(spaceInfo).toHaveProperty('used')
      expect(spaceInfo).toHaveProperty('total')
      expect(typeof spaceInfo.available).toBe('boolean')
      expect(typeof spaceInfo.used).toBe('number')
      expect(typeof spaceInfo.total).toBe('number')
    })
  })

  describe('clearAll', () => {
    it('すべてのストレージキーをクリアできること', () => {
      // テストデータを設定
      localStorageMock.setItem('football-canvas-plays', '[]')
      localStorageMock.setItem('football-canvas-playlists', '[]')
      localStorageMock.setItem('football-canvas-formations', '[]')
      localStorageMock.setItem('football-canvas-settings', '{}')

      StorageUtils.clearAll()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('football-canvas-plays')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('football-canvas-playlists')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('football-canvas-formations')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('football-canvas-settings')
    })
  })
})

describe('FormationStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('getAllFormations', () => {
    it('空のlocalStorageからは空配列を返すこと', async () => {
      const formations = await FormationStorage.getAllFormations()
      expect(formations).toEqual([])
    })

    it('有効なJSONデータからフォーメーション配列を復元すること', async () => {
      const mockFormations = [createMockFormation()]
      localStorageMock.setItem('football-canvas-formations', JSON.stringify(mockFormations))

      const formations = await FormationStorage.getAllFormations()
      
      expect(formations).toHaveLength(1)
      expect(formations[0].id).toBe('test-formation-1')
      expect(formations[0].createdAt).toBeInstanceOf(Date)
      expect(formations[0].updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('getFormationsByType', () => {
    it('指定したタイプのフォーメーションのみを返すこと', async () => {
      const offenseFormation = createMockFormation('offense-1', 'オフェンス')
      const defenseFormation = { ...createMockFormation('defense-1', 'ディフェンス'), type: 'defense' as const }
      
      localStorageMock.setItem('football-canvas-formations', JSON.stringify([offenseFormation, defenseFormation]))

      const offenseFormations = await FormationStorage.getFormationsByType('offense')
      const defenseFormations = await FormationStorage.getFormationsByType('defense')
      
      expect(offenseFormations).toHaveLength(1)
      expect(offenseFormations[0].type).toBe('offense')
      expect(defenseFormations).toHaveLength(1)
      expect(defenseFormations[0].type).toBe('defense')
    })
  })

  describe('saveFormation & deleteFormation', () => {
    it('新しいフォーメーションを保存できること', async () => {
      const newFormation = createMockFormation()
      
      await FormationStorage.saveFormation(newFormation)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'football-canvas-formations',
        JSON.stringify([newFormation])
      )
    })

    it('フォーメーションを削除できること', async () => {
      const mockFormations = [createMockFormation('formation-1'), createMockFormation('formation-2')]
      localStorageMock.setItem('football-canvas-formations', JSON.stringify(mockFormations))

      await FormationStorage.deleteFormation('formation-1')

      const savedFormations = JSON.parse(localStorageMock.store['football-canvas-formations'])
      expect(savedFormations).toHaveLength(1)
      expect(savedFormations[0].id).toBe('formation-2')
    })
  })
})