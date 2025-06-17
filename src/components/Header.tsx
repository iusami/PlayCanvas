import React, { useState } from 'react'
import { Play } from '../types'
import { useAuth } from '@/contexts/AuthContext'
import { PasswordChangeForm } from './Auth/PasswordChangeForm'
import { BackupManager } from './Backup/BackupManager'

type MessageType = 'success' | 'error' | 'info'

interface HeaderProps {
  onNewPlay: () => void
  onSave: () => void
  onSaveAs: () => void
  onEditMetadata: () => void
  onDuplicatePlay: () => void
  onExportImage?: () => void
  onPrint?: () => void
  onOpenPlayLibrary: () => void
  onOpenPlaylistWorkspace: () => void
  onShowMessage: (text: string, type?: MessageType) => void
  currentPlay: Play | null
}

const Header: React.FC<HeaderProps> = ({ 
  onNewPlay, 
  onSave, 
  onSaveAs, 
  onEditMetadata, 
  onDuplicatePlay,
  onExportImage,
  onPrint,
  onOpenPlayLibrary,
  onOpenPlaylistWorkspace,
  onShowMessage,
  currentPlay 
}) => {
  const { user, signOut } = useAuth()
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false)
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false)

  // テスト環境ではモックユーザーを使用
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'
  const displayUser = isTestMode ? { email: 'test@example.com' } : user

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('ログアウトエラー:', error)
      // ユーザーフレンドリーなエラーメッセージを表示
      onShowMessage('ログアウトに失敗しました。再度お試しください。', 'error')
    } else {
      // ログアウト成功時のメッセージ（オプション）
      onShowMessage('ログアウトしました', 'info')
    }
  }

  const handlePasswordChangeSuccess = (message: string) => {
    onShowMessage(message, 'success')
  }

  const handlePasswordChangeError = (message: string) => {
    onShowMessage(message, 'error')
  }

  const handleBackupSuccess = (message: string) => {
    onShowMessage(message, 'success')
  }

  const handleBackupError = (message: string) => {
    onShowMessage(message, 'error')
  }
  return (
    <header className="h-14 bg-white border-b border-gray-300 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-900">Football Canvas</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onNewPlay}
            className="toolbar-button"
          >
            新しいプレイ
          </button>
          
          <button 
            onClick={onOpenPlayLibrary}
            className="toolbar-button text-gray-900 hover:bg-blue-500 hover:text-white"
          >
            プレイ一覧
          </button>
          
          <button 
            onClick={onOpenPlaylistWorkspace}
            className="toolbar-button text-gray-900 hover:bg-purple-500 hover:text-white"
          >
            プレイリスト管理
          </button>
          
          {currentPlay && (
            <>
              <button 
                onClick={onSave}
                className="toolbar-button"
              >
                保存
              </button>
              <button 
                onClick={onSaveAs}
                className="toolbar-button"
              >
                名前を付けて保存
              </button>
              <button 
                onClick={onEditMetadata}
                className="toolbar-button"
              >
                プレイ情報編集
              </button>
              <button 
                onClick={onDuplicatePlay}
                className="toolbar-button"
              >
                複製
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {currentPlay && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{currentPlay.metadata.title}</span>
            {currentPlay.metadata.playName && (
              <span className="ml-2 text-gray-500">
                - {currentPlay.metadata.playName}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {currentPlay && (
            <>
              <button 
                onClick={onExportImage}
                className="toolbar-button"
                disabled={!onExportImage}
              >
                エクスポート
              </button>
              <button 
                onClick={onPrint}
                className="toolbar-button"
                disabled={!onPrint}
              >
                印刷
              </button>
            </>
          )}
        </div>
        
        {/* ユーザー情報とログアウト */}
        {displayUser && (
          <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-300">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{displayUser.email}</span>
            </div>
            {!isTestMode && (
              <>
                <button 
                  onClick={() => setIsBackupManagerOpen(true)}
                  className="text-sm text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                >
                  バックアップ
                </button>
                <button 
                  onClick={() => setIsPasswordChangeOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  パスワード変更
                </button>
                <button 
                  onClick={handleSignOut}
                  className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  ログアウト
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* パスワード変更モーダル */}
      <PasswordChangeForm
        isOpen={isPasswordChangeOpen}
        onClose={() => setIsPasswordChangeOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
        onError={handlePasswordChangeError}
      />
      
      {/* バックアップ管理モーダル */}
      <BackupManager
        isOpen={isBackupManagerOpen}
        onClose={() => setIsBackupManagerOpen(false)}
        onSuccess={handleBackupSuccess}
        onError={handleBackupError}
      />
    </header>
  )
}

export default Header