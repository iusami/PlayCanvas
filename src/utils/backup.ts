import { PlayStorage, PlaylistStorage, FormationStorage, SettingsStorage } from './storage'
import { Play, Playlist, FormationTemplate } from '../types'

// バックアップデータの型定義
export interface BackupData {
  version: string
  timestamp: string
  data: {
    plays: Play[]
    playlists: Playlist[]
    formations: FormationTemplate[]
    settings: any
  }
  metadata: {
    totalPlays: number
    totalPlaylists: number
    totalFormations: number
    exportedBy: string
    appVersion: string
  }
}

// バックアップ結果の型定義
export interface BackupResult {
  success: boolean
  message: string
  data?: BackupData
  error?: Error
}

// インポート結果の型定義
export interface ImportResult {
  success: boolean
  message: string
  imported: {
    plays: number
    playlists: number
    formations: number
    settingsRestored: boolean
  }
  errors?: string[]
}

// バックアップユーティリティクラス
export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0.0'
  private static readonly APP_VERSION = '1.0.0'

  /**
   * 全データの一括エクスポート
   */
  static exportAllData(): BackupResult {
    try {
      // 全データを取得
      const plays = PlayStorage.getAllPlays()
      const playlists = PlaylistStorage.getAllPlaylists()
      const formations = FormationStorage.getAllFormations()
      const settings = SettingsStorage.getSettings()

      // バックアップデータを構築
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        data: {
          plays,
          playlists,
          formations,
          settings
        },
        metadata: {
          totalPlays: plays.length,
          totalPlaylists: playlists.length,
          totalFormations: formations.length,
          exportedBy: 'user',
          appVersion: this.APP_VERSION
        }
      }

      return {
        success: true,
        message: `${plays.length}個のプレイ、${playlists.length}個のプレイリスト、${formations.length}個のフォーメーションをエクスポートしました`,
        data: backupData
      }
    } catch (error) {
      console.error('データのエクスポートに失敗しました:', error)
      return {
        success: false,
        message: 'データのエクスポートに失敗しました',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  /**
   * バックアップファイルをダウンロード
   */
  static downloadBackup(backupData: BackupData): void {
    try {
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // ファイル名を生成（タイムスタンプ付き）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `football-canvas-backup-${timestamp}.json`
      
      // ダウンロードリンクを作成して実行
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // クリーンアップ
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('バックアップファイルのダウンロードに失敗しました:', error)
      throw new Error('バックアップファイルのダウンロードに失敗しました')
    }
  }

  /**
   * バックアップデータの検証
   */
  static validateBackupData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 基本構造チェック
    if (!data || typeof data !== 'object') {
      errors.push('無効なバックアップファイル形式です')
      return { valid: false, errors }
    }

    // バージョンチェック
    if (!data.version || typeof data.version !== 'string') {
      errors.push('バックアップバージョン情報が見つかりません')
    }

    // タイムスタンプチェック
    if (!data.timestamp || !Date.parse(data.timestamp)) {
      errors.push('無効なタイムスタンプです')
    }

    // データ構造チェック
    if (!data.data || typeof data.data !== 'object') {
      errors.push('バックアップデータが見つかりません')
      return { valid: false, errors }
    }

    // 各データ型のチェック
    const { plays, playlists, formations, settings } = data.data

    if (!Array.isArray(plays)) {
      errors.push('プレイデータが無効です')
    }

    if (!Array.isArray(playlists)) {
      errors.push('プレイリストデータが無効です')
    }

    if (!Array.isArray(formations)) {
      errors.push('フォーメーションデータが無効です')
    }

    if (settings && typeof settings !== 'object') {
      errors.push('設定データが無効です')
    }

    // プレイデータの詳細チェック
    if (Array.isArray(plays)) {
      plays.forEach((play: any, index: number) => {
        if (!play.id || !play.metadata || !play.field || !Array.isArray(play.players)) {
          errors.push(`プレイ ${index + 1} のデータが無効です`)
        }
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * バックアップデータの一括インポート
   */
  static importAllData(backupData: BackupData, options: {
    overwrite?: boolean
    skipDuplicates?: boolean
  } = {}): ImportResult {
    const { overwrite = false, skipDuplicates = true } = options
    const imported = {
      plays: 0,
      playlists: 0,
      formations: 0,
      settingsRestored: false
    }
    const errors: string[] = []

    try {
      // データ検証
      const validation = this.validateBackupData(backupData)
      if (!validation.valid) {
        return {
          success: false,
          message: 'バックアップデータが無効です',
          imported,
          errors: validation.errors
        }
      }

      const { plays, playlists, formations, settings } = backupData.data

      // 既存データの取得（重複チェック用）
      const existingPlays = PlayStorage.getAllPlays()
      const existingPlaylists = PlaylistStorage.getAllPlaylists()
      const existingFormations = FormationStorage.getAllFormations()

      // プレイのインポート
      if (Array.isArray(plays)) {
        plays.forEach((play: Play) => {
          try {
            const exists = existingPlays.some(existing => 
              existing.metadata.title === play.metadata.title ||
              (overwrite && existing.id === play.id)
            )

            if (!exists || overwrite) {
              const importedPlay: Play = {
                ...play,
                id: overwrite ? play.id : crypto.randomUUID(),
                metadata: {
                  ...play.metadata,
                  title: overwrite ? play.metadata.title : `${play.metadata.title} (インポート)`,
                  createdAt: new Date(play.metadata.createdAt),
                  updatedAt: new Date(),
                }
              }
              PlayStorage.savePlay(importedPlay)
              imported.plays++
            } else if (!skipDuplicates) {
              errors.push(`プレイ "${play.metadata.title}" は既に存在します`)
            }
          } catch (error) {
            errors.push(`プレイ "${play.metadata.title}" のインポートに失敗しました`)
          }
        })
      }

      // プレイリストのインポート
      if (Array.isArray(playlists)) {
        playlists.forEach((playlist: Playlist) => {
          try {
            const exists = existingPlaylists.some(existing => 
              existing.title === playlist.title ||
              (overwrite && existing.id === playlist.id)
            )

            if (!exists || overwrite) {
              const importedPlaylist: Playlist = {
                ...playlist,
                id: overwrite ? playlist.id : crypto.randomUUID(),
                title: overwrite ? playlist.title : `${playlist.title} (インポート)`,
                createdAt: new Date(playlist.createdAt),
                updatedAt: new Date(),
              }
              PlaylistStorage.savePlaylist(importedPlaylist)
              imported.playlists++
            } else if (!skipDuplicates) {
              errors.push(`プレイリスト "${playlist.title}" は既に存在します`)
            }
          } catch (error) {
            errors.push(`プレイリスト "${playlist.title}" のインポートに失敗しました`)
          }
        })
      }

      // フォーメーションのインポート
      if (Array.isArray(formations)) {
        formations.forEach((formation: FormationTemplate) => {
          try {
            const exists = existingFormations.some(existing => 
              existing.name === formation.name ||
              (overwrite && existing.id === formation.id)
            )

            if (!exists || overwrite) {
              const importedFormation: FormationTemplate = {
                ...formation,
                id: overwrite ? formation.id : crypto.randomUUID(),
                name: overwrite ? formation.name : `${formation.name} (インポート)`,
                createdAt: new Date(formation.createdAt),
                updatedAt: new Date(),
              }
              FormationStorage.saveFormation(importedFormation)
              imported.formations++
            } else if (!skipDuplicates) {
              errors.push(`フォーメーション "${formation.name}" は既に存在します`)
            }
          } catch (error) {
            errors.push(`フォーメーション "${formation.name}" のインポートに失敗しました`)
          }
        })
      }

      // 設定のインポート
      if (settings && typeof settings === 'object' && overwrite) {
        try {
          SettingsStorage.saveSettings(settings)
          imported.settingsRestored = true
        } catch (error) {
          errors.push('設定の復元に失敗しました')
        }
      }

      const totalImported = imported.plays + imported.playlists + imported.formations
      const message = totalImported > 0 
        ? `${imported.plays}個のプレイ、${imported.playlists}個のプレイリスト、${imported.formations}個のフォーメーションをインポートしました`
        : 'インポートできるデータがありませんでした'

      return {
        success: totalImported > 0 || imported.settingsRestored,
        message,
        imported,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('データのインポートに失敗しました:', error)
      return {
        success: false,
        message: 'データのインポートに失敗しました',
        imported,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * ファイルからバックアップデータを読み込み
   */
  static async readBackupFile(file: File): Promise<{ success: boolean; data?: BackupData; error?: string }> {
    try {
      if (!file.type.includes('json')) {
        return { success: false, error: 'JSONファイルを選択してください' }
      }

      const text = await file.text()
      const data = JSON.parse(text)
      
      const validation = this.validateBackupData(data)
      if (!validation.valid) {
        return { 
          success: false, 
          error: `無効なバックアップファイルです: ${validation.errors.join(', ')}` 
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error('バックアップファイルの読み込みに失敗しました:', error)
      return { 
        success: false, 
        error: 'ファイルの読み込みに失敗しました。有効なJSONファイルかご確認ください。' 
      }
    }
  }

  /**
   * バックアップデータの統計情報を取得
   */
  static getBackupStats(backupData: BackupData): {
    totalItems: number
    breakdown: { plays: number; playlists: number; formations: number }
    backupDate: string
    appVersion: string
  } {
    const { plays, playlists, formations } = backupData.data
    return {
      totalItems: plays.length + playlists.length + formations.length,
      breakdown: {
        plays: plays.length,
        playlists: playlists.length,
        formations: formations.length
      },
      backupDate: new Date(backupData.timestamp).toLocaleString('ja-JP'),
      appVersion: backupData.metadata.appVersion || 'Unknown'
    }
  }
}