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
      console.log('🖨️ プリント機能開始')
      
      if (!stageRef.current) {
        console.error('🖨️ エラー: stageRef.currentがnull')
        alert('キャンバスが初期化されていません。しばらく待ってから再試行してください。')
        return
      }

      if (!appState.currentPlay) {
        console.error('🖨️ エラー: currentPlayがnull')
        alert('プレイが選択されていません。')
        return
      }

      console.log('🖨️ Konva Stage発見:', stageRef.current)
      console.log('🖨️ Stage幅:', stageRef.current.width())
      console.log('🖨️ Stage高さ:', stageRef.current.height())

      try {
        // 高解像度でキャンバスを画像化
        const dataURL = stageRef.current.toDataURL({ 
          pixelRatio: 2,
          mimeType: 'image/png',
          quality: 1.0
        })
        
        console.log('🖨️ DataURL生成成功:', dataURL.substring(0, 100) + '...')
        
        if (!dataURL || dataURL === 'data:,') {
          console.error('🖨️ エラー: 空のdataURL')
          alert('キャンバスの画像化に失敗しました。プレイにコンテンツがあることを確認してください。')
          return
        }

        // プレイメタデータ取得
        const play = appState.currentPlay
        const metadata = play.metadata
        
        console.log('🖨️ プレイメタデータ:', metadata)

        // 印刷ウィンドウを開く
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          console.error('🖨️ エラー: printWindow作成失敗')
          alert('印刷ウィンドウを開けませんでした。ポップアップブロッカーを確認してください。')
          return
        }

        // 改良されたHTML構造（画像レイアウトベース）
        const printHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>プリント - ${metadata.title || 'Football Play'}</title>
              <meta charset="UTF-8">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                  font-family: 'Arial', sans-serif; 
                  line-height: 1.6;
                  color: #333;
                  background: white;
                }
                
                .print-container {
                  width: 210mm;
                  min-height: 297mm; /* A4サイズ */
                  margin: 0 auto;
                  padding: 20mm;
                  display: grid;
                  grid-template-areas: 
                    "title title"
                    "canvas notes";
                  grid-template-columns: 2fr 1fr;
                  grid-template-rows: auto 1fr;
                  gap: 10mm;
                }
                
                .title-section {
                  grid-area: title;
                  text-align: center;
                  border-bottom: 2px solid #333;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                }
                
                .title-section h1 {
                  font-size: 24px;
                  font-weight: bold;
                  color: #333;
                  margin-bottom: 5px;
                }
                
                .subtitle {
                  font-size: 14px;
                  color: #666;
                }
                
                .canvas-section {
                  grid-area: canvas;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                
                .canvas-section img {
                  max-width: 100%;
                  height: auto;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .notes-section {
                  grid-area: notes;
                  padding-left: 15px;
                  border-left: 2px solid #ddd;
                }
                
                .notes-title {
                  font-size: 16px;
                  font-weight: bold;
                  color: #333;
                  margin-bottom: 10px;
                  border-bottom: 1px solid #eee;
                  padding-bottom: 5px;
                }
                
                .notes-item {
                  margin-bottom: 12px;
                  padding: 8px;
                  background: #f9f9f9;
                  border-radius: 6px;
                  border-left: 3px solid #007bff;
                }
                
                .notes-item-label {
                  font-weight: bold;
                  font-size: 12px;
                  color: #555;
                  margin-bottom: 3px;
                }
                
                .notes-item-content {
                  font-size: 11px;
                  color: #333;
                  line-height: 1.4;
                }
                
                .tags {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 4px;
                }
                
                .tag {
                  background: #e3f2fd;
                  color: #1976d2;
                  padding: 2px 6px;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 500;
                }
                
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                  .print-container { margin: 0; }
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                <div class="title-section">
                  <h1>${metadata.title || 'Football Play'}</h1>
                  <div class="subtitle">${metadata.playName || ''} ${metadata.playType ? `(${metadata.playType})` : ''}</div>
                </div>
                
                <div class="canvas-section">
                  <img src="${dataURL}" alt="Football Play Diagram" />
                </div>
                
                <div class="notes-section">
                  <div class="notes-title">Notes</div>
                  
                  ${metadata.description ? `
                    <div class="notes-item">
                      <div class="notes-item-label">説明</div>
                      <div class="notes-item-content">${metadata.description}</div>
                    </div>
                  ` : ''}
                  
                  ${metadata.offFormation ? `
                    <div class="notes-item">
                      <div class="notes-item-label">オフェンス</div>
                      <div class="notes-item-content">${metadata.offFormation}</div>
                    </div>
                  ` : ''}
                  
                  ${metadata.defFormation ? `
                    <div class="notes-item">
                      <div class="notes-item-label">ディフェンス</div>
                      <div class="notes-item-content">${metadata.defFormation}</div>
                    </div>
                  ` : ''}
                  
                  ${metadata.tags && metadata.tags.length > 0 ? `
                    <div class="notes-item">
                      <div class="notes-item-label">タグ</div>
                      <div class="notes-item-content">
                        <div class="tags">
                          ${metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  
                  <div class="notes-item">
                    <div class="notes-item-label">作成日</div>
                    <div class="notes-item-content">${new Date(metadata.createdAt).toLocaleDateString('ja-JP')}</div>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `

        console.log('🖨️ HTML生成完了、ウィンドウに書き込み中...')
        printWindow.document.write(printHTML)
        printWindow.document.close()
        
        // 画像読み込み完了を待ってから印刷
        printWindow.onload = () => {
          console.log('🖨️ 印刷ウィンドウ読み込み完了')
          setTimeout(() => {
            printWindow.focus()
            printWindow.print()
          }, 500) // 500ms待機で確実に画像読み込み
        }

        console.log('🖨️ プリント処理完了')

      } catch (error) {
        console.error('🖨️ プリント処理中エラー:', error)
        alert(`印刷処理中にエラーが発生しました: ${error}`)
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