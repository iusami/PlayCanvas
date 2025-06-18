import { useState, useEffect } from 'react'
import { SettingsStorage } from '@/utils/storage'
import { AutoBackupManager } from '@/utils/autoBackup'
import { AppSettings, AutoBackupSettings } from '@/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function SettingsModal({ isOpen, onClose, onSuccess, onError }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [autoBackupHistory, setAutoBackupHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'autoBackup'>('general')

  // 設定を読み込み
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const loadedSettings = await SettingsStorage.getSettings()
      setSettings(loadedSettings)
      
      // 自動バックアップ履歴を読み込み
      const history = await AutoBackupManager.getAutoBackupList()
      setAutoBackupHistory(history)
    } catch (error) {
      console.error('設定の読み込みに失敗しました:', error)
      onError('設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      setLoading(true)
      await SettingsStorage.saveSettings(settings)
      onSuccess('設定を保存しました')
      onClose()
    } catch (error) {
      console.error('設定の保存に失敗しました:', error)
      onError('設定の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoBackupSettingChange = (key: keyof AutoBackupSettings, value: any) => {
    if (!settings) return

    setSettings(prev => ({
      ...prev!,
      autoBackup: {
        ...prev!.autoBackup,
        [key]: value
      }
    }))
  }

  const handleCreateManualAutoBackup = async () => {
    try {
      setLoading(true)
      const result = await AutoBackupManager.createAutoBackup()
      
      if (result.success) {
        onSuccess(result.message)
        // 履歴を再読み込み
        const history = await AutoBackupManager.getAutoBackupList()
        setAutoBackupHistory(history)
      } else {
        onError(result.message)
      }
    } catch (error) {
      console.error('手動バックアップの作成に失敗しました:', error)
      onError('手動バックアップの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAutoBackup = async (backupId: string) => {
    if (!confirm('このバックアップファイルを削除しますか？')) {
      return
    }

    try {
      setLoading(true)
      const result = await AutoBackupManager.deleteAutoBackup(backupId)
      
      if (result.success) {
        onSuccess(result.message)
        // 履歴を再読み込み
        const history = await AutoBackupManager.getAutoBackupList()
        setAutoBackupHistory(history)
      } else {
        onError(result.message)
      }
    } catch (error) {
      console.error('自動バックアップの削除に失敗しました:', error)
      onError('自動バックアップの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAutoBackup = (backupId: string) => {
    try {
      AutoBackupManager.downloadAutoBackup(backupId)
      onSuccess('バックアップファイルをダウンロードしました')
    } catch (error) {
      console.error('バックアップのダウンロードに失敗しました:', error)
      onError('バックアップのダウンロードに失敗しました')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  if (!isOpen || !settings) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'general'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('general')}
          >
            一般設定
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'autoBackup'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('autoBackup')}
          >
            自動バックアップ
          </button>
        </div>

        <div className="p-6">
          {/* 一般設定タブ */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">表示設定</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      テーマ
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings(prev => ({ ...prev!, theme: e.target.value as 'light' | 'dark' }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">ライト</option>
                      <option value="dark">ダーク</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      言語
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings(prev => ({ ...prev!, language: e.target.value as 'ja' | 'en' }))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ja">日本語</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 自動バックアップ設定タブ */}
          {activeTab === 'autoBackup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">自動バックアップ設定</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup.enabled}
                      onChange={(e) => handleAutoBackupSettingChange('enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      自動バックアップを有効にする
                    </span>
                  </label>

                  {settings.autoBackup.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          バックアップ間隔
                        </label>
                        <select
                          value={settings.autoBackup.interval}
                          onChange={(e) => handleAutoBackupSettingChange('interval', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="daily">毎日</option>
                          <option value="weekly">毎週</option>
                          <option value="monthly">毎月</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          保持するバックアップファイル数
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.autoBackup.maxBackupFiles}
                          onChange={(e) => handleAutoBackupSettingChange('maxBackupFiles', parseInt(e.target.value))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          カスタムファイル名プレフィックス（オプション）
                        </label>
                        <input
                          type="text"
                          value={settings.autoBackup.customFileName || ''}
                          onChange={(e) => handleAutoBackupSettingChange('customFileName', e.target.value || undefined)}
                          placeholder="auto-backup"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup.includeSettings}
                          onChange={(e) => handleAutoBackupSettingChange('includeSettings', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          設定もバックアップに含める
                        </span>
                      </label>

                      {settings.autoBackup.lastBackupDate && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-600">
                            最終バックアップ: {settings.autoBackup.lastBackupDate.toLocaleString('ja-JP')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 手動バックアップボタン */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={handleCreateManualAutoBackup}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '作成中...' : '今すぐバックアップを作成'}
                </button>
              </div>

              {/* 自動バックアップ履歴 */}
              {autoBackupHistory.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">自動バックアップ履歴</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {autoBackupHistory.map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{backup.filename}</div>
                          <div className="text-xs text-gray-500">
                            {backup.createdAt.toLocaleString('ja-JP')} • {formatFileSize(backup.size)}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadAutoBackup(backup.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            ダウンロード
                          </button>
                          <button
                            onClick={() => handleDeleteAutoBackup(backup.id)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}