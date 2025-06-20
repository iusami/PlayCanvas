import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AutoBackupScheduler } from '../../src/utils/autoBackupScheduler'
import { AutoBackupManager } from '../../src/utils/autoBackup'
import { localStorageMock } from '../setup'

// AutoBackupManagerをモック
vi.mock('../../src/utils/autoBackup', () => ({
  AutoBackupManager: {
    shouldCreateBackup: vi.fn(),
    createAutoBackup: vi.fn(),
    cleanupOldBackups: vi.fn(),
  }
}))

// Notification APIをモック
const mockNotification = vi.fn()
Object.defineProperty(global, 'Notification', {
  value: mockNotification,
  writable: true,
  configurable: true
})

// window.setInterval と window.clearInterval をモック
Object.defineProperty(global, 'setInterval', {
  value: vi.fn(),
  writable: true
})

Object.defineProperty(global, 'clearInterval', {
  value: vi.fn(),
  writable: true
})

describe('AutoBackupScheduler', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Notification APIのデフォルト設定
    Object.defineProperty(mockNotification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true
    })
    
    mockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
    
    // AutoBackupSchedulerの内部状態をリセット
    AutoBackupScheduler.stop()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    AutoBackupScheduler.stop()
  })

  describe('start', () => {
    it('スケジューラーを正常に開始できること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      AutoBackupScheduler.start()
      
      expect(consoleSpy).toHaveBeenCalledWith('自動バックアップスケジューラーを開始しました')
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000)
      
      const status = AutoBackupScheduler.getStatus()
      expect(status.isRunning).toBe(true)
      expect(status.checkInterval).toBe(60 * 60 * 1000)
    })

    it('既に実行中の場合、再開始を無視すること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      AutoBackupScheduler.start()
      expect(setInterval).toHaveBeenCalledTimes(1)
      
      AutoBackupScheduler.start() // 2回目の開始
      expect(setInterval).toHaveBeenCalledTimes(1) // 変わらず1回
    })

    it('開始時に初回チェックを実行すること', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(false)
      
      AutoBackupScheduler.start()
      
      // 非同期処理の完了を待つ
      await vi.runAllTimersAsync()
      
      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalledTimes(1)
    })
  })

  describe('stop', () => {
    it('スケジューラーを正常に停止できること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      AutoBackupScheduler.start()
      AutoBackupScheduler.stop()
      
      expect(consoleSpy).toHaveBeenCalledWith('自動バックアップスケジューラーを停止しました')
      expect(clearInterval).toHaveBeenCalled()
      
      const status = AutoBackupScheduler.getStatus()
      expect(status.isRunning).toBe(false)
    })

    it('実行中でない場合、停止処理を無視すること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      AutoBackupScheduler.stop()
      
      expect(clearInterval).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalledWith('自動バックアップスケジューラーを停止しました')
    })
  })

  describe('checkAndCreateBackup', () => {
    it('バックアップが必要な場合、自動バックアップを実行すること', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(true)
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: true,
        message: 'バックアップ作成成功',
        filename: 'auto-backup-test.json'
      })
      vi.mocked(AutoBackupManager.cleanupOldBackups).mockResolvedValue({
        success: true,
        message: 'クリーンアップ完了',
        deletedCount: 0
      })

      AutoBackupScheduler.start()
      await vi.runAllTimersAsync()

      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalled()
      expect(AutoBackupManager.createAutoBackup).toHaveBeenCalled()
      expect(AutoBackupManager.cleanupOldBackups).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('自動バックアップを実行します...')
      expect(consoleSpy).toHaveBeenCalledWith('自動バックアップが完了しました: auto-backup-test.json')
    })

    it('バックアップが不要な場合、何も実行しないこと', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(false)

      AutoBackupScheduler.start()
      await vi.runAllTimersAsync()

      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalled()
      expect(AutoBackupManager.createAutoBackup).not.toHaveBeenCalled()
      expect(AutoBackupManager.cleanupOldBackups).not.toHaveBeenCalled()
    })

    it('バックアップ作成が失敗した場合、エラーログを出力すること', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(true)
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: false,
        message: 'バックアップ作成失敗'
      })

      AutoBackupScheduler.start()
      await vi.runAllTimersAsync()

      expect(consoleErrorSpy).toHaveBeenCalledWith('自動バックアップに失敗しました:', 'バックアップ作成失敗')
    })

    it('エラーが発生した場合、エラーログを出力すること', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('テストエラー')
      
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockRejectedValue(error)

      AutoBackupScheduler.start()
      await vi.runAllTimersAsync()

      expect(consoleErrorSpy).toHaveBeenCalledWith('自動バックアップチェック中にエラーが発生しました:', error)
    })

    it('処理中の場合、重複実行をスキップすること', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // 長時間かかる処理をシミュレート
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 5000))
      )

      AutoBackupScheduler.start()
      
      // 1時間後のタイマーを手動で実行
      vi.advanceTimersByTime(60 * 60 * 1000)
      
      expect(consoleSpy).toHaveBeenCalledWith('前回の自動バックアップ処理がまだ実行中のため、今回の処理をスキップします')
    })
  })

  describe('showNotification', () => {
    it('通知許可がある場合、ブラウザ通知を表示すること', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'granted',
        writable: true
      })
      
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(true)
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: true,
        message: 'バックアップ作成成功',
        filename: 'auto-backup-test.json'
      })
      vi.mocked(AutoBackupManager.cleanupOldBackups).mockResolvedValue({
        success: true,
        message: 'クリーンアップ完了'
      })

      AutoBackupScheduler.start()
      await vi.runAllTimersAsync()

      expect(mockNotification).toHaveBeenCalledWith('Football Canvas - 自動バックアップ', {
        body: 'バックアップ作成成功',
        icon: '/favicon.ico',
        tag: 'auto-backup'
      })
    })

    it('通知許可がない場合、ブラウザ通知を表示しないこと', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'denied',
        writable: true
      })
      
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(true)
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: true,
        message: 'バックアップ作成成功',
        filename: 'auto-backup-test.json'
      })

      AutoBackupScheduler.start()
      await vi.runAllTimersAsync()

      expect(mockNotification).not.toHaveBeenCalled()
    })
  })

  describe('requestNotificationPermission', () => {
    it('Notification APIが利用可能で許可されている場合、trueを返すこと', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'granted',
        writable: true
      })

      const result = await AutoBackupScheduler.requestNotificationPermission()
      expect(result).toBe(true)
    })

    it('Notification APIが利用可能で拒否されている場合、falseを返すこと', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'denied',
        writable: true
      })

      const result = await AutoBackupScheduler.requestNotificationPermission()
      expect(result).toBe(false)
    })

    it('許可要求が成功した場合、trueを返すこと', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'default',
        writable: true
      })
      mockNotification.requestPermission = vi.fn().mockResolvedValue('granted')

      const result = await AutoBackupScheduler.requestNotificationPermission()
      expect(result).toBe(true)
      expect(mockNotification.requestPermission).toHaveBeenCalled()
    })

    it('許可要求が拒否された場合、falseを返すこと', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'default',
        writable: true
      })
      mockNotification.requestPermission = vi.fn().mockResolvedValue('denied')

      const result = await AutoBackupScheduler.requestNotificationPermission()
      expect(result).toBe(false)
    })

    it('許可要求でエラーが発生した場合、falseを返すこと', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      Object.defineProperty(mockNotification, 'permission', {
        value: 'default',
        writable: true
      })
      mockNotification.requestPermission = vi.fn().mockRejectedValue(new Error('Permission error'))

      const result = await AutoBackupScheduler.requestNotificationPermission()
      expect(result).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('通知許可の要求に失敗しました:', expect.any(Error))
    })

    it('Notification APIが利用できない場合、falseを返すこと', async () => {
      // Notificationを削除してAPIが利用できない状態をシミュレート
      const originalNotification = global.Notification
      delete (global as any).Notification

      const result = await AutoBackupScheduler.requestNotificationPermission()
      expect(result).toBe(false)

      // 復元
      global.Notification = originalNotification
    })
  })

  describe('runManualCheck', () => {
    it('手動チェックでバックアップが必要な場合、正常に実行すること', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(true)
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: true,
        message: '手動バックアップ成功',
        filename: 'manual-backup.json'
      })

      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(true)
      expect(result.message).toBe('手動バックアップ成功')
      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalled()
      expect(AutoBackupManager.createAutoBackup).toHaveBeenCalled()
    })

    it('手動チェックでバックアップが不要な場合、適切なメッセージを返すこと', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(false)

      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(true)
      expect(result.message).toBe('まだバックアップ時間ではありません')
      expect(AutoBackupManager.createAutoBackup).not.toHaveBeenCalled()
    })

    it('処理中の場合、手動実行を拒否すること', async () => {
      // 自動処理を開始して処理中状態にする
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(true), 5000))
      )
      
      AutoBackupScheduler.start()
      
      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(false)
      expect(result.message).toBe('自動バックアップ処理が実行中のため、手動実行できません')
    })

    it('手動チェック中にエラーが発生した場合、エラーを返すこと', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('手動チェックエラー')
      
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockRejectedValue(error)

      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(false)
      expect(result.message).toBe('手動バックアップチェックに失敗しました')
      expect(consoleErrorSpy).toHaveBeenCalledWith('手動バックアップチェックに失敗しました:', error)
    })
  })

  describe('getStatus', () => {
    it('スケジューラーの状態を正確に返すこと', () => {
      // 停止状態
      let status = AutoBackupScheduler.getStatus()
      expect(status.isRunning).toBe(false)
      expect(status.checkInterval).toBe(60 * 60 * 1000)

      // 開始状態
      AutoBackupScheduler.start()
      status = AutoBackupScheduler.getStatus()
      expect(status.isRunning).toBe(true)
      expect(status.checkInterval).toBe(60 * 60 * 1000)
    })
  })

  describe('定期実行', () => {
    it('1時間ごとに定期チェックが実行されること', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(false)

      AutoBackupScheduler.start()
      
      // 初回チェック
      await vi.runAllTimersAsync()
      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalledTimes(1)

      // 1時間後
      vi.advanceTimersByTime(60 * 60 * 1000)
      await vi.runAllTimersAsync()
      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalledTimes(2)

      // さらに1時間後
      vi.advanceTimersByTime(60 * 60 * 1000)
      await vi.runAllTimersAsync()
      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalledTimes(3)
    })
  })
})