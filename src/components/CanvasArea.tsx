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

        // プレイデータ取得
        const play = appState.currentPlay
        const metadata = play.metadata
        const allTextBoxEntries = play.textBoxEntries || []
        
        // 空のエントリを除外（shortTextまたはlongTextのいずれかが存在するもののみ）
        const textBoxEntries = allTextBoxEntries.filter(entry => 
          entry.shortText?.trim() || entry.longText?.trim()
        )
        
        console.log('🖨️ プレイデータ詳細確認:')
        console.log('  - title:', metadata.title || '(空)')
        console.log('  - 全textBoxEntries:', allTextBoxEntries.length, '個')
        console.log('  - 記入済みtextBoxEntries:', textBoxEntries.length, '個')
        textBoxEntries.forEach((entry, index) => {
          console.log(`    [${index + 1}] ${entry.shortText || '(空)'} : ${entry.longText || '(空)'}`)
        })

        // 印刷モードで実行
        console.log('🖨️ 印刷モード開始')
        openPrintPreview(dataURL, metadata, textBoxEntries)

      } catch (error) {
        console.error('🖨️ プリント処理中エラー:', error)
        alert(`印刷処理中にエラーが発生しました: ${error}`)
      }
    }
  }))

  // 印刷プレビュー関数
  const openPrintPreview = (dataURL: string, metadata: any, textBoxEntries: any[]) => {
    console.log('🖨️ openPrintPreview開始')
    
    // より確実なFloat/inline-blockベースのレイアウト
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>プリント - ${metadata.title || 'Football Play'}</title>
          <meta charset="UTF-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.4;
              color: #333;
              background: white;
              /* 横向きA4サイズ対応 */
              width: 297mm;
              margin: 0 auto;
              padding: 8mm;
            }
            
            .print-container {
              width: 100%;
              max-width: 281mm; /* 横向きA4パディング考慮 */
              margin: 0 auto;
              background: white;
            }
            
            .title-section {
              width: 100%;
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            
            .title-section h1 {
              font-size: 20px;
              font-weight: bold;
              color: #333;
              margin-bottom: 4px;
            }
            
            .subtitle {
              font-size: 12px;
              color: #666;
            }
            
            /* 左右配置レイアウト（横向きA4最適化） */
            .content-area {
              width: 100%;
              display: flex;
              gap: 10mm;
              align-items: flex-start;
            }
            
            .canvas-section {
              flex: 2;
              max-width: 200mm;
              text-align: center;
            }
            
            .canvas-section img {
              width: 100%;
              max-width: 200mm;
              max-height: 140mm;
              height: auto;
              border: 1px solid #ddd;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              object-fit: contain;
            }
            
            .notes-section {
              flex: 1;
              max-width: 80mm;
              padding: 6px;
              border: 2px solid #007bff;
              background: #f8f9fa;
              min-height: 140mm;
            }
            
            .notes-title {
              font-size: 12px;
              font-weight: bold;
              color: #333;
              margin-bottom: 6px;
              text-align: center;
              border-bottom: 1px solid #ddd;
              padding-bottom: 3px;
            }
            
            .notes-grid {
              display: block;
              margin-top: 6px;
            }
            
            .notes-item {
              margin-bottom: 3px;
              padding: 4px;
              background: white;
              border-left: 2px solid #007bff;
              min-height: 18px;
              break-inside: avoid;
            }
            
            .notes-item-label {
              font-weight: bold;
              font-size: 8px;
              color: #555;
              margin-bottom: 1px;
              display: block;
            }
            
            .notes-item-content {
              font-size: 7px;
              color: #333;
              line-height: 1.2;
              min-height: 10px;
            }
            
            .notes-placeholder {
              font-style: italic;
              color: #999;
            }
            
            .tags {
              display: block;
            }
            
            .tag {
              display: inline-block;
              background: #e3f2fd;
              color: #1976d2;
              padding: 1px 3px;
              margin: 1px;
              border-radius: 6px;
              font-size: 6px;
              font-weight: 500;
            }
            
            
            /* 印刷時専用CSS */
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                margin: 0;
                padding: 8mm;
                size: A4 landscape; /* 横向きA4指定 */
              }
              
              .print-container {
                margin: 0;
                page-break-inside: avoid;
              }
              
              .content-area {
                display: flex !important;
                gap: 10mm !important;
                align-items: flex-start !important;
              }
              
              .canvas-section {
                flex: 2 !important;
                max-width: 200mm !important;
              }
              
              .notes-section {
                flex: 1 !important;
                max-width: 80mm !important;
                background: #f8f9fa !important;
                border: 2px solid #007bff !important;
                page-break-inside: avoid;
              }
            }
            
          </style>
        </head>
        <body>
          
          <div class="print-container">
            <div class="title-section">
              <h1>${metadata.title || 'Football Play'}</h1>
              <div class="subtitle">${metadata.playName || ''} ${metadata.playType ? `(${metadata.playType})` : ''}</div>
            </div>
            
            <div class="content-area">
              <div class="canvas-section">
                <img src="${dataURL}" alt="Football Play Diagram" />
              </div>
              
              <div class="notes-section">
                <div class="notes-title">Note</div>
                
                ${textBoxEntries.map((entry, index) => `
                  <div class="notes-item">
                    <div class="notes-item-label">${index + 1}</div>
                    <div class="notes-item-content">
                      <div style="display: flex; gap: 4px; align-items: flex-start;">
                        <div style="min-width: 20px; font-weight: bold; color: #007bff; flex-shrink: 0;">
                          ${entry.shortText?.trim() || ''}
                        </div>
                        <div style="flex: 1; word-break: break-word;">
                          ${entry.longText?.trim() || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
                
                ${textBoxEntries.length === 0 ? `
                  <div class="notes-item">
                    <div class="notes-item-content">
                      <span class="notes-placeholder">メモが記入されていません</span>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    console.log('🖨️ HTML生成完了 (文字数:', printHTML.length, ')')
    console.log('🖨️ HTML内容確認（最初の800文字）:', printHTML.substring(0, 800))
    
    // 印刷ウィンドウを開く
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      console.error('🖨️ エラー: printWindow作成失敗')
      alert('印刷ウィンドウを開けませんでした。ポップアップブロッカーを確認してください。')
      return
    }

    console.log('🖨️ 印刷ウィンドウにHTML書き込み開始')
    printWindow.document.write(printHTML)
    printWindow.document.close()
    
    console.log('🖨️ HTML書き込み完了')

    // 少し待ってから印刷ダイアログを開く
    setTimeout(() => {
      console.log('🖨️ 印刷ダイアログを開いています...')
      printWindow.focus()
      printWindow.print()
    }, 1500) // 1.5秒待機で確実に読み込み完了

    console.log('🖨️ openPrintPreview完了')
  }

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