import { AutoBackupManager } from './autoBackup'

/**
 * 自動バックアップスケジューラー
 */
export class AutoBackupScheduler {
  private static isRunning = false
  private static isProcessing = false
  private static intervalId: number | null = null
  private static readonly CHECK_INTERVAL = 60 * 60 * 1000 // 1時間ごとにチェック

  /**
   * スケジューラーを開始
   */
  static start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    
    // 初回チェック
    this.checkAndCreateBackup()
    
    // 定期チェックを開始
    this.intervalId = window.setInterval(() => {
      if (!this.isProcessing) {
        this.checkAndCreateBackup()
      } else {
        console.log('前回の自動バックアップ処理がまだ実行中のため、今回の処理をスキップします')
      }
    }, this.CHECK_INTERVAL)

    console.log('自動バックアップスケジューラーを開始しました')
  }

  /**
   * スケジューラーを停止
   */
  static stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('自動バックアップスケジューラーを停止しました')
  }

  /**
   * バックアップが必要かチェックして実行
   */
  private static async checkAndCreateBackup(): Promise<void> {
    if (this.isProcessing) {
      console.log('自動バックアップ処理が既に実行中です')
      return
    }

    this.isProcessing = true
    
    try {
      const shouldBackup = await AutoBackupManager.shouldCreateBackup()
      
      if (shouldBackup) {
        console.log('自動バックアップを実行します...')
        
        const result = await AutoBackupManager.createAutoBackup()
        
        if (result.success) {
          console.log(`自動バックアップが完了しました: ${result.filename}`)
          
          // 通知を表示（ブラウザ通知が許可されている場合）
          this.showNotification(result.message)
          
          // 古いバックアップをクリーンアップ
          await AutoBackupManager.cleanupOldBackups()
        } else {
          console.error('自動バックアップに失敗しました:', result.message)
        }
      }
    } catch (error) {
      console.error('自動バックアップチェック中にエラーが発生しました:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * ブラウザ通知を表示
   */
  private static showNotification(message: string): void {
    // ブラウザ通知が利用可能で許可されている場合のみ表示
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Football Canvas - 自動バックアップ', {
        body: message,
        icon: '/favicon.ico', // アプリのアイコン
        tag: 'auto-backup' // 同じタグの通知は1つだけ表示
      })
    }
  }

  /**
   * ブラウザ通知の許可を要求
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('通知許可の要求に失敗しました:', error)
      return false
    }
  }

  /**
   * スケジューラーの状態を取得
   */
  static getStatus(): { isRunning: boolean; checkInterval: number } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.CHECK_INTERVAL
    }
  }

  /**
   * 手動でバックアップチェックを実行
   */
  static async runManualCheck(): Promise<{ success: boolean; message: string }> {
    if (this.isProcessing) {
      return {
        success: false,
        message: '自動バックアップ処理が実行中のため、手動実行できません'
      }
    }

    this.isProcessing = true
    
    try {
      const shouldBackup = await AutoBackupManager.shouldCreateBackup()
      
      if (shouldBackup) {
        const result = await AutoBackupManager.createAutoBackup()
        return result
      } else {
        return {
          success: true,
          message: 'まだバックアップ時間ではありません'
        }
      }
    } catch (error) {
      console.error('手動バックアップチェックに失敗しました:', error)
      return {
        success: false,
        message: '手動バックアップチェックに失敗しました'
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * テスト専用: 内部状態をリセット
   * @internal テストでのみ使用すること
   */
  static resetForTesting(): void {
    // テスト環境でのみ動作するよう制限
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test' && 
        typeof import.meta !== 'undefined' && import.meta.env?.VITE_TEST_MODE !== 'true') {
      console.warn('resetForTesting() should only be called in test environment')
      return
    }

    this.stop() // 既存のタイマーを停止
    this.isRunning = false
    this.isProcessing = false
    this.intervalId = null
  }
}