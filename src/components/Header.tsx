import React from 'react'
import { Play } from '../types'

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
  currentPlay 
}) => {
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
      </div>
    </header>
  )
}

export default Header