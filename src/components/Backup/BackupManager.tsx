import React, { useState, useRef, useMemo } from 'react'
import { BackupManager as BackupUtil, BackupData } from '@/utils/backup'
import { StorageUtils } from '@/utils/storage'

interface BackupManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

type TabType = 'export' | 'import'

export function BackupManager({ isOpen, onClose, onSuccess, onError }: BackupManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('export')
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null)
  const [importOptions, setImportOptions] = useState({
    overwrite: false,
    skipDuplicates: true
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setSelectedFile(null)
    setBackupPreview(null)
    setActiveTab('export')
    // ファイル入力の値をクリアして同じファイル再選択を可能にする
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  // エクスポート処理
  const handleExport = async () => {
    setLoading(true)
    try {
      // 短い遅延でローディング状態を表示
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result = BackupUtil.exportAllData()
      
      if (result.success && result.data) {
        BackupUtil.downloadBackup(result.data)
        onSuccess(result.message)
        handleClose()
      } else {
        onError(result.message)
      }
    } catch (error) {
      console.error('エクスポートエラー:', error)
      onError('バックアップの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ファイル選択処理
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    setLoading(true)
    setSelectedFile(file)
    setBackupPreview(null)

    try {
      const result = await BackupUtil.readBackupFile(file)
      
      if (result.success && result.data) {
        setBackupPreview(result.data)
      } else {
        onError(result.error || 'ファイルの読み込みに失敗しました')
        setSelectedFile(null)
      }
    } catch (error) {
      console.error('ファイル読み込みエラー:', error)
      onError('ファイルの読み込みに失敗しました')
      setSelectedFile(null)
    } finally {
      setLoading(false)
    }
  }

  // インポート処理
  const handleImport = async () => {
    if (!backupPreview) return

    setLoading(true)
    try {
      const result = BackupUtil.importAllData(backupPreview, importOptions)
      
      if (result.success) {
        let message = result.message
        if (result.errors && result.errors.length > 0) {
          message += `\n注意: ${result.errors.length}件の警告がありました`
        }
        onSuccess(message)
        handleClose()
      } else {
        const errorMessage = result.errors ? result.errors.join('\n') : result.message
        onError(errorMessage)
      }
    } catch (error) {
      console.error('インポートエラー:', error)
      onError('データの復元に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ストレージ使用量とデータ統計をメモ化
  const storageInfo = useMemo(() => StorageUtils.checkStorageSpace(), [])
  const currentDataStats = useMemo(() => {
    const result = BackupUtil.exportAllData()
    return result.data?.data || { plays: [], playlists: [], formations: [] }
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            データバックアップ
          </h2>
          <button
            onClick={handleClose}
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
              activeTab === 'export'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('export')}
          >
            エクスポート
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium ${
              activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('import')}
          >
            インポート
          </button>
        </div>

        <div className="p-6">
          {/* エクスポートタブ */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  データをバックアップ
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  すべてのプレイ、プレイリスト、フォーメーション、設定をJSONファイルとしてエクスポートします。
                </p>
              </div>

              {/* 現在のデータ統計 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">現在のデータ</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">プレイ:</span>
                    <span className="ml-2 font-medium">{currentDataStats.plays.length}個</span>
                  </div>
                  <div>
                    <span className="text-gray-600">プレイリスト:</span>
                    <span className="ml-2 font-medium">{currentDataStats.playlists.length}個</span>
                  </div>
                  <div>
                    <span className="text-gray-600">フォーメーション:</span>
                    <span className="ml-2 font-medium">{currentDataStats.formations.length}個</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ストレージ使用量:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(storageInfo.used / 1024)}KB / {Math.round(storageInfo.total / 1024)}KB
                    </span>
                  </div>
                </div>
              </div>

              {/* エクスポートボタン */}
              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'エクスポート中...' : 'バックアップファイルをダウンロード'}
              </button>
            </div>
          )}

          {/* インポートタブ */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  データを復元
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  以前にエクスポートしたバックアップファイルからデータを復元します。
                </p>
              </div>

              {/* ファイル選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  バックアップファイル選択
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="block w-full text-sm text-gray-500 border border-gray-300 rounded-md py-2 px-4 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-label="Choose file"
                >
                  {selectedFile ? selectedFile.name : 'ファイルを選択'}
                </button>
              </div>

              {/* バックアップファイルプレビュー */}
              {backupPreview && selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">バックアップ内容</h4>
                  <div className="mb-3">
                    <span className="text-gray-600">ファイル名:</span>
                    <span className="ml-2 font-medium text-sm">{selectedFile.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">プレイ:</span>
                      <span className="ml-2 font-medium">{backupPreview.data.plays.length}個</span>
                    </div>
                    <div>
                      <span className="text-gray-600">プレイリスト:</span>
                      <span className="ml-2 font-medium">{backupPreview.data.playlists.length}個</span>
                    </div>
                    <div>
                      <span className="text-gray-600">フォーメーション:</span>
                      <span className="ml-2 font-medium">{backupPreview.data.formations.length}個</span>
                    </div>
                    <div>
                      <span className="text-gray-600">作成日:</span>
                      <span className="ml-2 font-medium">{BackupUtil.getBackupStats(backupPreview).backupDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* インポートオプション */}
              {backupPreview && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">インポートオプション</h4>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.overwrite}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, overwrite: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      既存データを上書きする
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      重複するデータをスキップする
                    </span>
                  </label>

                  {importOptions.overwrite && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-yellow-400">⚠️</span>
                        </div>
                        <div className="ml-2">
                          <p className="text-sm text-yellow-700">
                            注意: 上書きモードでは既存のデータが置き換えられます。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* インポートボタン */}
              {backupPreview && (
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'インポート中...' : 'データを復元'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500">
            ※ バックアップファイルは安全な場所に保管してください。定期的なバックアップを推奨します。
          </p>
        </div>
      </div>
    </div>
  )
}