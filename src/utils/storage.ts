import { Play, Playlist, FormationTemplate } from '../types'

const STORAGE_KEYS = {
  PLAYS: 'football-canvas-plays',
  PLAYLISTS: 'football-canvas-playlists',
  FORMATIONS: 'football-canvas-formations',
  SETTINGS: 'football-canvas-settings'
} as const

// Play関連のストレージ操作
export const PlayStorage = {
  // すべてのプレイを取得
  async getAllPlays(): Promise<Play[]> {
    try {
      const playsJson = localStorage.getItem(STORAGE_KEYS.PLAYS)
      if (!playsJson) return []
      
      const plays = JSON.parse(playsJson)
      // Date型を復元
      return plays.map((play: any) => ({
        ...play,
        metadata: {
          ...play.metadata,
          createdAt: new Date(play.metadata.createdAt),
          updatedAt: new Date(play.metadata.updatedAt)
        }
      }))
    } catch (error) {
      console.error('プレイの読み込みに失敗しました:', error)
      return []
    }
  },

  // 単一のプレイを取得
  async getPlay(id: string): Promise<Play | null> {
    const plays = await this.getAllPlays()
    return plays.find(play => play.id === id) || null
  },

  // プレイを保存
  async savePlay(play: Play): Promise<void> {
    try {
      const plays = await this.getAllPlays()
      const existingIndex = plays.findIndex(p => p.id === play.id)
      
      if (existingIndex >= 0) {
        // 既存のプレイを更新
        plays[existingIndex] = play
      } else {
        // 新しいプレイを追加
        plays.push(play)
      }
      
      localStorage.setItem(STORAGE_KEYS.PLAYS, JSON.stringify(plays))
    } catch (error) {
      console.error('プレイの保存に失敗しました:', error)
      throw new Error('プレイの保存に失敗しました')
    }
  },

  // プレイを削除
  async deletePlay(id: string): Promise<void> {
    try {
      const plays = await this.getAllPlays()
      const filteredPlays = plays.filter(play => play.id !== id)
      localStorage.setItem(STORAGE_KEYS.PLAYS, JSON.stringify(filteredPlays))
    } catch (error) {
      console.error('プレイの削除に失敗しました:', error)
      throw new Error('プレイの削除に失敗しました')
    }
  },

  // プレイを複製
  async duplicatePlay(id: string): Promise<Play | null> {
    try {
      const originalPlay = await this.getPlay(id)
      if (!originalPlay) return null

      const duplicatedPlay: Play = {
        ...originalPlay,
        id: crypto.randomUUID(),
        metadata: {
          ...originalPlay.metadata,
          title: `${originalPlay.metadata.title} (コピー)`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      await this.savePlay(duplicatedPlay)
      return duplicatedPlay
    } catch (error) {
      console.error('プレイの複製に失敗しました:', error)
      return null
    }
  },

  // プレイをJSONとしてエクスポート
  async exportPlay(id: string): Promise<string | null> {
    try {
      const play = await this.getPlay(id)
      if (!play) return null
      return JSON.stringify(play, null, 2)
    } catch (error) {
      console.error('プレイのエクスポートに失敗しました:', error)
      return null
    }
  },

  // JSONからプレイをインポート
  async importPlay(jsonString: string): Promise<Play | null> {
    try {
      const play = JSON.parse(jsonString)
      
      // 基本的なバリデーション
      if (!play.id || !play.metadata || !play.field || !Array.isArray(play.players)) {
        throw new Error('無効なプレイデータです')
      }

      // 新しいIDを生成して保存
      const importedPlay: Play = {
        ...play,
        id: crypto.randomUUID(),
        metadata: {
          ...play.metadata,
          title: `${play.metadata.title} (インポート)`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }

      await this.savePlay(importedPlay)
      return importedPlay
    } catch (error) {
      console.error('プレイのインポートに失敗しました:', error)
      return null
    }
  }
}

// Playlist関連のストレージ操作
export const PlaylistStorage = {
  // すべてのプレイリストを取得
  async getAllPlaylists(): Promise<Playlist[]> {
    try {
      const playlistsJson = localStorage.getItem(STORAGE_KEYS.PLAYLISTS)
      if (!playlistsJson) return []
      
      const playlists = JSON.parse(playlistsJson)
      // Date型を復元
      return playlists.map((playlist: any) => ({
        ...playlist,
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt)
      }))
    } catch (error) {
      console.error('プレイリストの読み込みに失敗しました:', error)
      return []
    }
  },

  // プレイリストを保存
  async savePlaylist(playlist: Playlist): Promise<void> {
    try {
      const playlists = await this.getAllPlaylists()
      const existingIndex = playlists.findIndex(p => p.id === playlist.id)
      
      if (existingIndex >= 0) {
        playlists[existingIndex] = playlist
      } else {
        playlists.push(playlist)
      }
      
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists))
    } catch (error) {
      console.error('プレイリストの保存に失敗しました:', error)
      throw new Error('プレイリストの保存に失敗しました')
    }
  },

  // プレイリストを削除
  async deletePlaylist(id: string): Promise<void> {
    try {
      const playlists = await this.getAllPlaylists()
      const filteredPlaylists = playlists.filter(playlist => playlist.id !== id)
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(filteredPlaylists))
    } catch (error) {
      console.error('プレイリストの削除に失敗しました:', error)
      throw new Error('プレイリストの削除に失敗しました')
    }
  }
}

// 設定関連のストレージ操作
export const SettingsStorage = {
  // 設定を取得
  async getSettings(): Promise<any> {
    try {
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      return settingsJson ? JSON.parse(settingsJson) : {}
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
      return {}
    }
  },

  // 設定を保存
  async saveSettings(settings: any): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('設定の保存に失敗しました:', error)
      throw new Error('設定の保存に失敗しました')
    }
  }
}

// ストレージ容量チェック
export const StorageUtils = {
  // 使用可能な容量をチェック
  checkStorageSpace(): { available: boolean; used: number; total: number } {
    try {
      const test = 'storage-test'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      
      // 概算の使用量を計算
      let used = 0
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length
        }
      }
      
      // ブラウザの制限は通常5MB程度
      const total = 5 * 1024 * 1024 // 5MB
      
      return {
        available: used < total * 0.9, // 90%を超えたら警告
        used,
        total
      }
    } catch (error) {
      return {
        available: false,
        used: 0,
        total: 0
      }
    }
  },

  // ストレージをクリア
  clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('ストレージのクリアに失敗しました:', error)
    }
  }
}

// Formation関連のストレージ操作
export const FormationStorage = {
  // すべてのフォーメーションテンプレートを取得
  async getAllFormations(): Promise<FormationTemplate[]> {
    try {
      const formationsJson = localStorage.getItem(STORAGE_KEYS.FORMATIONS)
      if (!formationsJson) return []
      
      const formations = JSON.parse(formationsJson)
      // Date型を復元し、centerプロパティの互換性を確保
      return formations.map((formation: any) => ({
        ...formation,
        createdAt: new Date(formation.createdAt),
        updatedAt: new Date(formation.updatedAt),
        center: formation.center || undefined // 古いデータとの互換性を保つ
      }))
    } catch (error) {
      console.error('フォーメーションテンプレートの読み込みに失敗しました:', error)
      return []
    }
  },

  // タイプ別フォーメーションを取得
  async getFormationsByType(type: 'offense' | 'defense'): Promise<FormationTemplate[]> {
    const formations = await this.getAllFormations()
    return formations.filter(formation => formation.type === type)
  },

  // 単一のフォーメーションを取得
  async getFormation(id: string): Promise<FormationTemplate | null> {
    const formations = await this.getAllFormations()
    return formations.find(formation => formation.id === id) || null
  },

  // フォーメーションを保存
  async saveFormation(formation: FormationTemplate): Promise<void> {
    try {
      const formations = await this.getAllFormations()
      const existingIndex = formations.findIndex(f => f.id === formation.id)
      
      if (existingIndex >= 0) {
        // 既存のフォーメーションを更新
        formations[existingIndex] = formation
      } else {
        // 新しいフォーメーションを追加
        formations.push(formation)
      }
      
      localStorage.setItem(STORAGE_KEYS.FORMATIONS, JSON.stringify(formations))
    } catch (error) {
      console.error('フォーメーションテンプレートの保存に失敗しました:', error)
      throw new Error('フォーメーションテンプレートの保存に失敗しました')
    }
  },

  // フォーメーションを削除
  async deleteFormation(id: string): Promise<void> {
    try {
      const formations = await this.getAllFormations()
      const filteredFormations = formations.filter(formation => formation.id !== id)
      localStorage.setItem(STORAGE_KEYS.FORMATIONS, JSON.stringify(filteredFormations))
    } catch (error) {
      console.error('フォーメーションテンプレートの削除に失敗しました:', error)
      throw new Error('フォーメーションテンプレートの削除に失敗しました')
    }
  },

  // デフォルトフォーメーションを初期化（空で開始）
  async initializeDefaultFormations(): Promise<void> {
    // デフォルトのフォーメーションテンプレートは提供しない
    // ユーザーが自分でカスタムフォーメーションを作成する
  }
}