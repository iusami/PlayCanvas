import { BackupManager, BackupData } from './backup'
import { SettingsStorage } from './storage'
import { AutoBackupSettings } from '../types'

/**
 * 自動バックアップファイルの情報
 */
interface AutoBackupFileInfo {
  id: string
  filename: string
  createdAt: Date
  size: number
  data: BackupData
}

/**
 * 自動バックアップ管理クラス
 */
export class AutoBackupManager {
  private static readonly STORAGE_KEY = 'football-canvas-auto-backups'
  private static readonly DEFAULT_FILENAME_PREFIX = 'auto-backup'

  /**
   * 自動バックアップが必要かチェック
   */
  static async shouldCreateBackup(): Promise<boolean> {
    try {
      const settings = await SettingsStorage.getSettings()
      
      if (!settings.autoBackup.enabled) {
        return false
      }

      const lastBackupDate = settings.autoBackup.lastBackupDate
      if (!lastBackupDate) {
        return true // 初回バックアップ
      }

      const now = new Date()
      const timeDiff = now.getTime() - lastBackupDate.getTime()
      
      switch (settings.autoBackup.interval) {
        case 'daily':
          return timeDiff >= 24 * 60 * 60 * 1000 // 24時間
        case 'weekly':
          return timeDiff >= 7 * 24 * 60 * 60 * 1000 // 7日
        case 'monthly':
          return timeDiff >= 30 * 24 * 60 * 60 * 1000 // 30日
        default:
          return false
      }
    } catch (error) {
      console.error('自動バックアップのチェックに失敗しました:', error)
      return false
    }
  }

  /**
   * 自動バックアップを実行
   */
  static async createAutoBackup(): Promise<{ success: boolean; message: string; filename?: string }> {
    try {
      const settings = await SettingsStorage.getSettings()
      
      // バックアップデータを作成
      const exportResult = await BackupManager.exportAllData()
      if (!exportResult.success || !exportResult.data) {
        return {
          success: false,
          message: exportResult.message || '自動バックアップの作成に失敗しました'
        }
      }

      // ファイル名を生成
      const filename = this.generateAutoBackupFilename(settings.autoBackup)
      
      // 自動バックアップファイル情報を作成
      const autoBackupInfo: AutoBackupFileInfo = {
        id: crypto.randomUUID(),
        filename,
        createdAt: new Date(),
        size: JSON.stringify(exportResult.data).length,
        data: exportResult.data
      }

      // 既存の自動バックアップリストを取得
      const existingBackups = await this.getAutoBackupList()
      
      // 新しいバックアップを追加
      const updatedBackups = [autoBackupInfo, ...existingBackups]
      
      // 最大ファイル数を超えた場合、古いファイルを削除
      const maxFiles = settings.autoBackup.maxBackupFiles
      if (updatedBackups.length > maxFiles) {
        updatedBackups.splice(maxFiles)
      }

      // 自動バックアップリストを保存
      await this.saveAutoBackupList(updatedBackups)

      // 最終バックアップ日時を更新
      const updatedAutoBackupSettings: AutoBackupSettings = {
        ...settings.autoBackup,
        lastBackupDate: new Date()
      }
      await SettingsStorage.updateAutoBackupSettings(updatedAutoBackupSettings)

      return {
        success: true,
        message: `自動バックアップ「${filename}」を作成しました`,
        filename
      }
    } catch (error) {
      console.error('自動バックアップの実行に失敗しました:', error)
      return {
        success: false,
        message: '自動バックアップの実行に失敗しました'
      }
    }
  }

  /**
   * 自動バックアップファイル名を生成
   */
  private static generateAutoBackupFilename(settings: AutoBackupSettings): string {
    const prefix = settings.customFileName || this.DEFAULT_FILENAME_PREFIX
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    return `${prefix}-${timestamp}.json`
  }

  /**
   * 自動バックアップリストを取得
   */
  static async getAutoBackupList(): Promise<AutoBackupFileInfo[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) {
        return []
      }

      const backups = JSON.parse(data)
      // Date型を復元
      return backups.map((backup: any) => ({
        ...backup,
        createdAt: new Date(backup.createdAt),
        data: {
          ...backup.data,
          timestamp: backup.data.timestamp // BackupDataのtimestampは文字列のまま
        }
      }))
    } catch (error) {
      console.error('自動バックアップリストの読み込みに失敗しました:', error)
      return []
    }
  }

  /**
   * 自動バックアップリストを保存
   */
  private static async saveAutoBackupList(backups: AutoBackupFileInfo[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups))
    } catch (error) {
      console.error('自動バックアップリストの保存に失敗しました:', error)
      throw new Error('自動バックアップリストの保存に失敗しました')
    }
  }

  /**
   * 自動バックアップファイルをダウンロード
   */
  static downloadAutoBackup(backupId: string): void {
    this.getAutoBackupList().then(backups => {
      const backup = backups.find(b => b.id === backupId)
      if (backup) {
        BackupManager.downloadBackup(backup.data)
      }
    }).catch(error => {
      console.error('自動バックアップのダウンロードに失敗しました:', error)
    })
  }

  /**
   * 自動バックアップファイルを削除
   */
  static async deleteAutoBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    try {
      const backups = await this.getAutoBackupList()
      const filteredBackups = backups.filter(backup => backup.id !== backupId)
      
      if (backups.length === filteredBackups.length) {
        return {
          success: false,
          message: '指定されたバックアップファイルが見つかりません'
        }
      }

      await this.saveAutoBackupList(filteredBackups)
      
      return {
        success: true,
        message: 'バックアップファイルを削除しました'
      }
    } catch (error) {
      console.error('自動バックアップの削除に失敗しました:', error)
      return {
        success: false,
        message: '自動バックアップの削除に失敗しました'
      }
    }
  }

  /**
   * 自動バックアップファイルから復元
   */
  static async restoreFromAutoBackup(backupId: string, options?: {
    overwrite?: boolean
    skipDuplicates?: boolean
  }) {
    try {
      const backups = await this.getAutoBackupList()
      const backup = backups.find(b => b.id === backupId)
      
      if (!backup) {
        return {
          success: false,
          message: '指定されたバックアップファイルが見つかりません'
        }
      }

      return await BackupManager.importAllData(backup.data, options)
    } catch (error) {
      console.error('自動バックアップからの復元に失敗しました:', error)
      return {
        success: false,
        message: '自動バックアップからの復元に失敗しました',
        imported: { plays: 0, playlists: 0, formations: 0, settingsRestored: false },
        errors: ['復元処理中にエラーが発生しました']
      }
    }
  }

  /**
   * 古い自動バックアップファイルをクリーンアップ
   */
  static async cleanupOldBackups(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
    try {
      const settings = await SettingsStorage.getSettings()
      const backups = await this.getAutoBackupList()
      
      if (backups.length <= settings.autoBackup.maxBackupFiles) {
        return {
          success: true,
          message: 'クリーンアップが必要なファイルはありません',
          deletedCount: 0
        }
      }

      // 作成日時でソートして古いファイルを特定
      const sortedBackups = backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      const toKeep = sortedBackups.slice(0, settings.autoBackup.maxBackupFiles)
      const toDelete = sortedBackups.slice(settings.autoBackup.maxBackupFiles)

      await this.saveAutoBackupList(toKeep)

      return {
        success: true,
        message: `${toDelete.length}個の古いバックアップファイルを削除しました`,
        deletedCount: toDelete.length
      }
    } catch (error) {
      console.error('自動バックアップのクリーンアップに失敗しました:', error)
      return {
        success: false,
        message: '自動バックアップのクリーンアップに失敗しました'
      }
    }
  }
}