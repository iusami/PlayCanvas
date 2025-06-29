import React, { useState } from 'react'
import { Play } from '../types'
import { useAuth } from '@/contexts/AuthContext'
import { PasswordChangeForm } from './Auth/PasswordChangeForm'
import { BackupManager } from './Backup/BackupManager'
import { SettingsModal } from './Settings/SettingsModal'
import AccountDropdown from './AccountDropdown'

type MessageType = 'success' | 'error' | 'info'

interface HeaderProps {
  onNewPlay: () => void
  onOpenPlayLibrary: () => void
  onOpenPlaylistWorkspace: () => void
  onShowMessage: (text: string, type?: MessageType) => void
  currentPlay: Play | null
}

const Header: React.FC<HeaderProps> = ({ 
  onNewPlay, 
  onOpenPlayLibrary,
  onOpenPlaylistWorkspace,
  onShowMessage,
  currentPlay 
}) => {
  const { user, signOut } = useAuth()
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false)
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // テスト環境ではモックユーザーを使用
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true'
  const displayUser = isTestMode ? { email: 'test@example.com' } : (user ? { email: user.email || '' } : null)

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

  const handleSettingsSuccess = (message: string) => {
    onShowMessage(message, 'success')
  }

  const handleSettingsError = (message: string) => {
    onShowMessage(message, 'error')
  }
  return (
    <header role="banner" className="h-14 bg-white border-b border-gray-300 flex items-center justify-between px-4 shadow-sm">
      {/* 左端: プレイタイトル */}
      <div className="flex items-center min-w-0">
        {currentPlay ? (
          <div className="text-lg font-semibold text-gray-900 truncate">
            <span>{currentPlay.metadata.title}</span>
            {currentPlay.metadata.playName && (
              <span className="ml-2 text-gray-600 font-normal">
                - {currentPlay.metadata.playName}
              </span>
            )}
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-gray-900">Football Canvas</h1>
        )}
      </div>
      
      {/* 中央: アクションボタン群を均等配置 */}
      <div className="flex-1 flex items-center justify-evenly px-8 max-w-4xl">
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
        
      </div>
      
      {/* 右端: アカウントドロップダウン */}
      <div className="flex items-center">
        {displayUser && (
          <AccountDropdown
            user={displayUser}
            isTestMode={isTestMode}
            onPasswordChange={() => setIsPasswordChangeOpen(true)}
            onBackupManager={() => setIsBackupManagerOpen(true)}
            onSettings={() => setIsSettingsOpen(true)}
            onSignOut={handleSignOut}
          />
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
      
      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSuccess={handleSettingsSuccess}
        onError={handleSettingsError}
      />
    </header>
  )
}

export default Header