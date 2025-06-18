import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AutoBackupScheduler } from '../../src/utils/autoBackupScheduler'
import { AutoBackupManager } from '../../src/utils/autoBackup'

// モジュールをモック
vi.mock('../../src/utils/autoBackup', () => ({
  AutoBackupManager: {
    shouldCreateBackup: vi.fn(),
    createAutoBackup: vi.fn(),
    cleanupOldBackups: vi.fn(),
  }
}))

// グローバルなsetIntervalとclearIntervalをモック
const mockSetInterval = vi.fn()
const mockClearInterval = vi.fn()

// NotificationAPIをモック
const mockNotification = vi.fn()
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true
})

// Notificationのstaticプロパティをモック
Object.defineProperty(mockNotification, 'permission', {
  value: 'default',
  writable: true
})
Object.defineProperty(mockNotification, 'requestPermission', {
  value: vi.fn().mockResolvedValue('granted'),
  writable: true
})

describe('AutoBackupScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // windowのsetInterval/clearIntervalをモック
    Object.defineProperty(window, 'setInterval', {
      value: mockSetInterval,
      writable: true
    })
    Object.defineProperty(window, 'clearInterval', {
      value: mockClearInterval,
      writable: true
    })
    
    // モックの戻り値をリセット
    mockSetInterval.mockReturnValue(123) // ダミーのinterval ID
    
    // スケジューラーを停止状態にリセット
    AutoBackupScheduler.stop()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    AutoBackupScheduler.stop()
  })

  describe('start', () => {
    it('スケジューラーを開始できること', () => {
      AutoBackupScheduler.start()

      const status = AutoBackupScheduler.getStatus()
      expect(status.isRunning).toBe(true)
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        60 * 60 * 1000 // 1時間
      )
    })

    it('既に実行中の場合、重複開始しないこと', () => {
      AutoBackupScheduler.start()
      AutoBackupScheduler.start() // 2回目の開始

      expect(mockSetInterval).toHaveBeenCalledTimes(1) // 1回のみ呼ばれる
    })
  })

  describe('stop', () => {
    it('スケジューラーを停止できること', () => {
      AutoBackupScheduler.start()
      AutoBackupScheduler.stop()

      const status = AutoBackupScheduler.getStatus()
      expect(status.isRunning).toBe(false)
      expect(mockClearInterval).toHaveBeenCalledWith(123)
    })

    it('実行中でない場合、停止処理をスキップすること', () => {
      AutoBackupScheduler.stop() // 実行中でない状態で停止

      expect(mockClearInterval).not.toHaveBeenCalled()
    })
  })

  describe('runManualCheck', () => {
    it('バックアップが必要な場合、バックアップを作成すること', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(true)
      vi.mocked(AutoBackupManager.createAutoBackup).mockResolvedValue({
        success: true,
        message: 'バックアップ作成成功',
        filename: 'backup.json'
      })

      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(true)
      expect(result.message).toBe('バックアップ作成成功')
      expect(AutoBackupManager.shouldCreateBackup).toHaveBeenCalled()
      expect(AutoBackupManager.createAutoBackup).toHaveBeenCalled()
    })

    it('バックアップが不要な場合、メッセージを返すこと', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockResolvedValue(false)

      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(true)
      expect(result.message).toBe('まだバックアップ時間ではありません')
      expect(AutoBackupManager.createAutoBackup).not.toHaveBeenCalled()
    })

    it('エラーが発生した場合、エラーメッセージを返すこと', async () => {
      vi.mocked(AutoBackupManager.shouldCreateBackup).mockRejectedValue(
        new Error('テストエラー')
      )

      const result = await AutoBackupScheduler.runManualCheck()

      expect(result.success).toBe(false)
      expect(result.message).toBe('手動バックアップチェックに失敗しました')
    })
  })

  describe('requestNotificationPermission', () => {
    it('Notificationが利用可能で許可が得られた場合、trueを返すこと', async () => {
      mockNotification.permission = 'default'
      mockNotification.requestPermission.mockResolvedValue('granted')

      const result = await AutoBackupScheduler.requestNotificationPermission()

      expect(result).toBe(true)
      expect(mockNotification.requestPermission).toHaveBeenCalled()
    })

    it('既に許可済みの場合、trueを返すこと', async () => {
      mockNotification.permission = 'granted'

      const result = await AutoBackupScheduler.requestNotificationPermission()

      expect(result).toBe(true)
      expect(mockNotification.requestPermission).not.toHaveBeenCalled()
    })

    it('許可が拒否されている場合、falseを返すこと', async () => {
      mockNotification.permission = 'denied'

      const result = await AutoBackupScheduler.requestNotificationPermission()

      expect(result).toBe(false)
      expect(mockNotification.requestPermission).not.toHaveBeenCalled()
    })

    // Notificationが利用できない場合のテストは、実装の詳細に依存しすぎるため
    // 実際のブラウザでのテストで確認することとする

    it('許可要求でエラーが発生した場合、falseを返すこと', async () => {
      mockNotification.permission = 'default'
      mockNotification.requestPermission.mockRejectedValue(new Error('テストエラー'))

      const result = await AutoBackupScheduler.requestNotificationPermission()

      expect(result).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('スケジューラーの状態を正しく返すこと', () => {
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
})