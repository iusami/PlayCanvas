import { useRef, forwardRef, useImperativeHandle } from 'react'
import { AppState, Play } from '../types'
import FootballCanvas from './FootballCanvas'
import Konva from 'konva'

interface CanvasAreaProps {
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  onUpdatePlay: (updates: Partial<Play>) => void
  onNewPlay?: () => void
  isSaving?: boolean
  lastSavedAt?: Date | null
  onUndo?: () => void
  onRedo?: () => void
}

export interface CanvasAreaRef {
  exportAsImage: () => void
  print: () => void
}

const CanvasArea = forwardRef<CanvasAreaRef, CanvasAreaProps>(({ 
  appState, 
  updateAppState, 
  onUpdatePlay,
  onNewPlay,
  isSaving,
  lastSavedAt,
  onUndo,
  onRedo
}, ref) => {
  const stageRef = useRef<Konva.Stage>(null)

  useImperativeHandle(ref, () => ({
    exportAsImage: () => {
      if (stageRef.current) {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `${appState.currentPlay?.metadata.title || 'football-play'}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    },
    print: () => {
      if (stageRef.current) {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>プリント - ${appState.currentPlay?.metadata.title || 'Football Play'}</title>
                <style>
                  body { margin: 0; padding: 20px; text-align: center; }
                  img { max-width: 100%; height: auto; }
                  h1 { font-family: Arial, sans-serif; color: #333; }
                </style>
              </head>
              <body>
                <h1>${appState.currentPlay?.metadata.title || 'Football Play'}</h1>
                <img src="${dataURL}" alt="Football Play" />
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          printWindow.print()
        }
      }
    }
  }))
  if (!appState.currentPlay) {
    return (
      <div className="canvas-container flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🏈</div>
          <h2 className="text-xl font-semibold mb-2">Football Canvas へようこそ</h2>
          <p className="text-gray-600 mb-4">
            新しいプレイを作成して、アメリカンフットボールのサインを描きましょう
          </p>
          <button
            onClick={onNewPlay}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            新しいプレイを作成
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="canvas-container">
      {/* ツールバー */}
      <div className="absolute top-4 left-4 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">ズーム:</span>
          <button
            onClick={() => updateAppState({ zoom: Math.max(0.1, appState.zoom - 0.1) })}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
          >
            −
          </button>
          <span className="text-sm font-mono w-12 text-center">
            {Math.round(appState.zoom * 100)}%
          </span>
          <button
            onClick={() => updateAppState({ zoom: Math.min(3, appState.zoom + 0.1) })}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50"
          >
            +
          </button>
          <button
            onClick={() => updateAppState({ zoom: 1, panX: 0, panY: 0 })}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            リセット
          </button>
          <div className="border-l border-gray-300 h-6 mx-2"></div>
          <button
            onClick={onUndo}
            disabled={!onUndo || appState.historyIndex <= 0}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="元に戻す (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!onRedo || appState.historyIndex >= appState.history.length - 1}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="やり直し (Ctrl+Y)"
          >
            ↷
          </button>
        </div>
      </div>

      {/* Konvaベースのキャンバス */}
      <FootballCanvas
        play={appState.currentPlay}
        appState={appState}
        updateAppState={updateAppState}
        onUpdatePlay={onUpdatePlay}
        onUndo={onUndo}
        onRedo={onRedo}
        ref={stageRef}
      />

      {/* セグメント上限警告 */}
      {appState.segmentLimitWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span className="text-sm">{appState.segmentLimitWarning}</span>
          </div>
        </div>
      )}

      {/* 右下のステータス表示 */}
      <div className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
        <div className="text-xs text-gray-600 space-y-1">
          <div>ツール: {appState.selectedTool}</div>
          <div>座標: ({Math.round(appState.panX)}, {Math.round(appState.panY)})</div>
          <div>プレイヤー: {appState.currentPlay.players.length}人</div>
          <div>矢印: {appState.currentPlay.arrows.length}本</div>
          <div>テキスト: {appState.currentPlay.texts.length}個</div>
          <div>履歴: {appState.historyIndex + 1}/{appState.history.length}</div>
          {appState.selectedElementIds.length > 0 && (
            <div>選択: {appState.selectedElementIds.length}個</div>
          )}
          {appState.isDrawingArrow && (
            <div className="text-blue-600 font-semibold space-y-1">
              <div>矢印描画中... ({Math.floor(appState.currentArrowPoints.length / 2)}点)</div>
              <div>セグメント: {appState.currentArrowSegments.length} / {appState.maxSegments}</div>
              <div className="text-xs space-y-1">
                <div>クリック: 点追加 | ダブルクリック: 完了</div>
                <div>Backspace: 最後削除 | Esc: 全削除</div>
              </div>
            </div>
          )}
          {appState.isEditingText && (
            <div className="text-green-600 font-semibold space-y-1">
              <div>テキスト編集中... (ID: {appState.editingTextId?.slice(-6)})</div>
              <div className="text-xs">サイドバーで編集 | 保存: 適用 | キャンセル: 破棄</div>
            </div>
          )}
          
          {/* 自動保存ステータス */}
          {appState.currentPlay && (
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center space-x-2">
                {isSaving ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-yellow-600">保存中...</span>
                  </>
                ) : lastSavedAt ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">
                      自動保存済み ({lastSavedAt.toLocaleTimeString()})
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">未保存</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

CanvasArea.displayName = 'CanvasArea'

export default CanvasArea