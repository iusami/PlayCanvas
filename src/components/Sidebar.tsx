import React, { useState } from 'react'
import { AppState, Play, PlayerType, Playlist, FormationTemplate, FIELD_CONSTRAINTS } from '../types'
import PlayListView from './PlayListView'
import PlaylistManager from './PlaylistManager'
import PlaylistEditor from './PlaylistEditor'
import FormationTemplateManager from './FormationTemplateManager'


// 座標反転ヘルパー関数
const flipXCoordinate = (center: number, coordinate: number): number => {
  return center + (center - coordinate)
}

const flipYCoordinate = (center: number, coordinate: number): number => {
  return center + (center - coordinate)
}

interface SidebarProps {
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  plays: Play[]
  onSelectPlay: (play: Play) => void
  onDeletePlay?: (playId: string) => void
  onDuplicatePlay?: (playId: string) => void
  onUpdatePlay?: (updates: Partial<Play>) => void
  // プレイリスト関連
  playlists: Playlist[]
  onCreatePlaylist?: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdatePlaylist?: (playlist: Playlist) => void
  onDeletePlaylist?: (playlistId: string) => void
  // フォーメーション関連
  formations: FormationTemplate[]
  onApplyFormation?: (formation: FormationTemplate) => void
  onSaveFormationTemplate?: (name: string, description: string, type: 'offense' | 'defense') => void
  onDeleteFormationTemplate?: (formationId: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ 
  appState, 
  updateAppState, 
  plays, 
  onSelectPlay,
  onDeletePlay,
  onDuplicatePlay,
  onUpdatePlay,
  playlists,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  formations,
  onApplyFormation,
  onSaveFormationTemplate,
  onDeleteFormationTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'plays' | 'playlists' | 'formations'>('tools')
  const [playListView, setPlayListView] = useState<'simple' | 'advanced'>('simple')
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false)


  const playerTypes: { value: PlayerType; label: string }[] = [
    { value: 'circle', label: '○' },
    { value: 'triangle', label: '▽' },
    { value: 'square', label: '□' },
    { value: 'chevron', label: '∨' },
    { value: 'text', label: 'A' },
    { value: 'x', label: '✕' }
  ]


  const tools = [
    { value: 'select', label: '選択', icon: '↖' },
    { value: 'player', label: 'プレイヤー', icon: '○' },
    { value: 'arrow', label: '矢印', icon: '→' },
    { value: 'text', label: 'テキスト', icon: 'T' }
  ] as const

  // プレーヤー配置制限関連の関数
  const getCenterLineY = (fieldHeight: number) => {
    // 6等分システムに統一：4番目の線が中央線
    return (fieldHeight * 4) / 6
  }

  const isFieldFlipped = (center: { x: number; y: number } | undefined, fieldHeight: number) => {
    if (!center) return false
    
    // 6等分システムに統一：2番目と4番目の線で判定
    const secondLineY = (fieldHeight * 2) / 6
    const fourthLineY = (fieldHeight * 4) / 6
    
    return Math.abs(center.y - secondLineY) < Math.abs(center.y - fourthLineY)
  }

  const constrainPlayerPosition = (
    x: number, 
    y: number, 
    team: 'offense' | 'defense', 
    fieldWidth: number, 
    fieldHeight: number, 
    center: { x: number; y: number } | undefined,
    playerSize: number = 20,
    appState: AppState
  ) => {
    const flipped = isFieldFlipped(center, fieldHeight)
    // 常に固定の中央線位置を使用（centerの実際位置ではなく）
    const centerLineY = getCenterLineY(fieldHeight)
    const halfSize = playerSize / 2
    
    // オフセット距離設定（中央線から少し離した位置）
    const offenseSnapOffset = 15 // オフェンス用の距離（中央線より下に）
    const defenseSnapOffset = 15 // ディフェンス用の距離（中央線より上に）
    
    const constrainedX = Math.max(halfSize, Math.min(fieldWidth - halfSize, x))
    
    let constrainedY = y
    
    if (flipped) {
      if (team === 'offense') {
        // 反転時オフェンス：プレイヤーの上端が中央線より下（フィールド上半分で制約）
        // 反転時は上半分（y < centerLineY）で動作、上端 >= centerLineY - offenseSnapOffset
        // つまり: center.y >= centerLineY - offenseSnapOffset + halfSize
        const maxY = centerLineY - offenseSnapOffset - halfSize
        constrainedY = Math.max(halfSize, Math.min(maxY, y))
      } else {
        // 反転時ディフェンスは定数で定義された最小Y座標以上（フィールドの下半分）
        const minY = FIELD_CONSTRAINTS.DEFENSE_MIN_Y_FLIPPED
        constrainedY = Math.max(minY, Math.min(fieldHeight - halfSize, y))
      }
    } else {
      if (team === 'offense') {
        // 通常時オフェンス：プレイヤーの上端が中央線より下になるよう制約
        // プレイヤーの上端 = center.y - halfSize >= centerLineY + offenseSnapOffset
        // つまり: center.y >= centerLineY + offenseSnapOffset + halfSize
        const minY = centerLineY + offenseSnapOffset + halfSize
        constrainedY = Math.max(minY, Math.min(fieldHeight - halfSize, y))
      } else {
        // 通常時ディフェンス：下端が中央線より上
        // プレイヤーの下端 = center.y + halfSize
        // 下端 <= centerLineY - defenseSnapOffset
        // center.y <= centerLineY - defenseSnapOffset - halfSize
        const maxY = centerLineY - defenseSnapOffset - halfSize
        constrainedY = Math.max(halfSize, Math.min(maxY, y))
      }
    }
    
    return { x: constrainedX, y: constrainedY }
  }

  return (
    <div className="sidebar">
      {/* タブヘッダー */}
      <div className="flex border-b border-gray-300">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-2 px-2 text-xs font-medium ${
            activeTab === 'tools' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'bg-gray-50 text-gray-700 hover:text-gray-900'
          }`}
        >
          ツール
        </button>
        <button
          onClick={() => setActiveTab('plays')}
          className={`flex-1 py-2 px-2 text-xs font-medium ${
            activeTab === 'plays' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'bg-gray-50 text-gray-700 hover:text-gray-900'
          }`}
        >
          プレイ一覧
        </button>
        <button
          onClick={() => {
            setActiveTab('playlists')
            setIsEditingPlaylist(false)
            setSelectedPlaylist(null)
          }}
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            activeTab === 'playlists' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'bg-gray-50 text-gray-700 hover:text-gray-900'
          }`}
        >
          プレイリスト
        </button>
        <button
          onClick={() => setActiveTab('formations')}
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            activeTab === 'formations' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'bg-gray-50 text-gray-700 hover:text-gray-900'
          }`}
        >
          フォーメーション
        </button>
      </div>

      {/* ツールタブ */}
      {activeTab === 'tools' && (
        <div className="p-4 space-y-6">
          {/* ツール選択 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">ツール</h3>
            <div className="grid grid-cols-2 gap-2">
              {tools.map(tool => (
                <button
                  key={tool.value}
                  onClick={() => updateAppState({ selectedTool: tool.value })}
                  className={`p-2 text-sm border rounded ${
                    appState.selectedTool === tool.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg mb-1">{tool.icon}</div>
                  <div>{tool.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* フォーメーション反転 */}
          {appState.selectedTool === 'select' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                フォーメーション反転
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                全てのプレイヤーを反転します
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (appState.currentPlay && onUpdatePlay) {
                      // 左右反転（フィールド中心を軸）
                      const fieldCenterX = appState.currentPlay.field.width / 2
                      const updatedPlayers = appState.currentPlay.players.map(player => ({
                        ...player, 
                        x: flipXCoordinate(fieldCenterX, player.x)
                      }))
                      
                      // 全ての矢印も反転（セグメントも含む）
                      const updatedArrows = appState.currentPlay.arrows.map(arrow => {
                        const newPoints = []
                        for (let i = 0; i < arrow.points.length; i += 2) {
                          newPoints.push(flipXCoordinate(fieldCenterX, arrow.points[i]))     // x座標を反転
                          newPoints.push(arrow.points[i + 1]) // y座標はそのまま
                        }
                        
                        // セグメントがある場合はセグメントも反転
                        let newSegments = arrow.segments
                        if (arrow.segments && arrow.segments.length > 0) {
                          newSegments = arrow.segments.map(segment => {
                            const newSegmentPoints = []
                            for (let i = 0; i < segment.points.length; i += 2) {
                              newSegmentPoints.push(flipXCoordinate(fieldCenterX, segment.points[i]))     // x座標を反転
                              newSegmentPoints.push(segment.points[i + 1]) // y座標はそのまま
                            }
                            return { ...segment, points: newSegmentPoints }
                          })
                        }
                        
                        return { ...arrow, points: newPoints, segments: newSegments }
                      })
                      
                      // 全てのテキスト要素も反転（位置のみ、向きは変更しない）
                      const updatedTexts = appState.currentPlay.texts.map(text => ({
                        ...text,
                        x: flipXCoordinate(fieldCenterX, text.x) // x座標を反転
                      }))
                      
                      // センターも現在位置から反転（リセットしない）
                      let updatedCenter = appState.currentPlay.center
                      if (appState.currentPlay.center) {
                        updatedCenter = {
                          ...appState.currentPlay.center,
                          x: flipXCoordinate(fieldCenterX, appState.currentPlay.center.x)
                        }
                      } else {
                        // センターが存在しない場合はデフォルト位置から反転
                        const defaultCenterY = (appState.currentPlay.field.height * 5) / 8
                        updatedCenter = {
                          x: fieldCenterX, // 中央なので反転しても同じ
                          y: defaultCenterY
                        }
                      }
                      
                      onUpdatePlay({ 
                        players: updatedPlayers, 
                        arrows: updatedArrows, 
                        texts: updatedTexts,
                        center: updatedCenter 
                      })
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  左右反転
                </button>
                <button
                  onClick={() => {
                    if (appState.currentPlay && onUpdatePlay) {
                      
                      // 上下反転（6等分システムに統一：3番目の線を軸）
                      const flipAxisY = (appState.currentPlay.field.height * 3) / 6
                      
                      // センターを現在位置に応じて反転（プレーヤー処理の前に実行）
                      let updatedCenter = appState.currentPlay.center
                      if (appState.currentPlay.center) {
                        const currentY = appState.currentPlay.center.y
                        
                        // 2番目の線と4番目の線の位置を計算（6等分システム）
                        const secondLineY = (appState.currentPlay.field.height * 2) / 6   // 150px
                        const fourthLineY = (appState.currentPlay.field.height * 4) / 6   // 300px
                        
                        // 現在の位置に応じて反転先を決定
                        let newY
                        if (Math.abs(currentY - secondLineY) < Math.abs(currentY - fourthLineY)) {
                          // 現在2番目の線に近い場合は4番目の線へ
                          newY = fourthLineY
                        } else {
                          // 現在4番目の線に近い場合は2番目の線へ
                          newY = secondLineY
                        }
                        
                        updatedCenter = {
                          ...appState.currentPlay.center,
                          y: newY
                        }
                      } else {
                        // センターが存在しない場合は4番目の線に配置（新規プレイと同じ）
                        const fourthLineY = (appState.currentPlay.field.height * 4) / 6
                        
                        updatedCenter = {
                          x: appState.currentPlay.field.width / 2,
                          y: fourthLineY
                        }
                      }
                      
                      
                      const updatedPlayers = appState.currentPlay.players.map((player, index) => {
                        const flippedY = flipAxisY + (flipAxisY - player.y)
                        
                        
                        // 反転後の位置に配置制限を適用（更新されたセンターを考慮）
                        const constrained = constrainPlayerPosition(
                          player.x, 
                          flippedY, 
                          player.team, 
                          appState.currentPlay!.field.width, 
                          appState.currentPlay!.field.height, 
                          updatedCenter,
                          player.size,
                          appState
                        )
                        
                        
                        return {
                          ...player,
                          x: constrained.x,
                          y: constrained.y,
                          flipped: player.type === 'triangle' || player.type === 'chevron' ? !player.flipped : player.flipped
                        }
                      })
                      
                      // 全ての矢印も反転（セグメントも含む）
                      const updatedArrows = appState.currentPlay.arrows.map(arrow => {
                        const newPoints = []
                        for (let i = 0; i < arrow.points.length; i += 2) {
                          newPoints.push(arrow.points[i])     // x座標はそのまま
                          newPoints.push(flipYCoordinate(flipAxisY, arrow.points[i + 1])) // y座標を反転
                        }
                        
                        // セグメントがある場合はセグメントも反転
                        let newSegments = arrow.segments
                        if (arrow.segments && arrow.segments.length > 0) {
                          newSegments = arrow.segments.map(segment => {
                            const newSegmentPoints = []
                            for (let i = 0; i < segment.points.length; i += 2) {
                              newSegmentPoints.push(segment.points[i])     // x座標はそのまま
                              newSegmentPoints.push(flipYCoordinate(flipAxisY, segment.points[i + 1])) // y座標を反転
                            }
                            return { ...segment, points: newSegmentPoints }
                          })
                        }
                        
                        return { ...arrow, points: newPoints, segments: newSegments }
                      })
                      
                      // 全てのテキスト要素も反転（位置のみ、向きは変更しない）
                      const updatedTexts = appState.currentPlay.texts.map(text => ({
                        ...text,
                        y: flipYCoordinate(flipAxisY, text.y) // y座標を反転
                      }))
                      
                      const updateData = { 
                        players: updatedPlayers, 
                        arrows: updatedArrows, 
                        texts: updatedTexts,
                        center: updatedCenter 
                      }
                      
                      onUpdatePlay(updateData)
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  上下反転
                </button>
              </div>
            </div>
          )}

          {/* 選択されたプレイヤーの管理 */}
          {(() => {
            const selectedPlayerIds = appState.selectedElementIds.filter(id => 
              appState.currentPlay?.players.some(p => p.id === id)
            )
            return selectedPlayerIds.length > 0
          })() && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                選択されたプレイヤー ({appState.selectedElementIds.filter(id => 
                  appState.currentPlay?.players.some(p => p.id === id)
                ).length}個)
              </h3>
              <div className="space-y-3">
                {/* チーム所属変更 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    チーム所属を変更
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (appState.currentPlay) {
                          const selectedPlayerIds = appState.selectedElementIds.filter(id => 
                            appState.currentPlay!.players.some(p => p.id === id)
                          )
                          
                          const updatedPlayers = appState.currentPlay.players.map(player => 
                            selectedPlayerIds.includes(player.id) 
                              ? { ...player, team: 'offense' as const }
                              : player
                          )
                          
                          onUpdatePlay?.({ players: updatedPlayers })
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      オフェンスに変更
                    </button>
                    <button
                      onClick={() => {
                        if (appState.currentPlay) {
                          const selectedPlayerIds = appState.selectedElementIds.filter(id => 
                            appState.currentPlay!.players.some(p => p.id === id)
                          )
                          
                          const updatedPlayers = appState.currentPlay.players.map(player => 
                            selectedPlayerIds.includes(player.id) 
                              ? { ...player, team: 'defense' as const }
                              : player
                          )
                          
                          onUpdatePlay?.({ players: updatedPlayers })
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      ディフェンスに変更
                    </button>
                  </div>
                </div>

                {/* 選択解除ボタン */}
                <button
                  onClick={() => updateAppState({ selectedElementIds: [] })}
                  className="w-full px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  選択解除
                </button>
              </div>
            </div>
          )}

          {/* 一般的な選択解除ボタン（矢印やテキストが選択されている場合）*/}
          {appState.selectedElementIds.length > 0 && 
           appState.selectedElementIds.filter(id => 
             appState.currentPlay?.players.some(p => p.id === id)
           ).length === 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                選択されたオブジェクト ({appState.selectedElementIds.length}個)
              </h3>
              <button
                onClick={() => updateAppState({ selectedElementIds: [] })}
                className="w-full px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                選択解除
              </button>
            </div>
          )}

          {/* プレイヤー設定 */}
          {appState.selectedTool === 'player' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">チーム</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateAppState({ selectedTeam: 'offense' })}
                    className={`px-3 py-1 text-sm rounded ${
                      appState.selectedTeam === 'offense'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    オフェンス
                  </button>
                  <button
                    onClick={() => updateAppState({ selectedTeam: 'defense' })}
                    className={`px-3 py-1 text-sm rounded ${
                      appState.selectedTeam === 'defense'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    ディフェンス
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">アイコン</h3>
                <div className="grid grid-cols-4 gap-2">
                  {playerTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => updateAppState({ selectedPlayerType: type.value })}
                      className={`p-2 text-lg border rounded ${
                        appState.selectedPlayerType === type.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 矢印設定 */}
          {appState.selectedTool === 'arrow' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">矢印の種類</h3>
                <select
                  value={appState.selectedArrowType}
                  onChange={(e) => updateAppState({ selectedArrowType: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="straight">直線</option>
                  <option value="zigzag">ジグザグ</option>
                  <option value="dashed">点線</option>
                </select>
              </div>


              {/* 描画中セグメント情報 */}
              {appState.isDrawingArrow && (
                <div className={`p-3 rounded-md ${
                  appState.currentArrowSegments.length >= appState.maxSegments 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${
                    appState.currentArrowSegments.length >= appState.maxSegments 
                      ? 'text-red-900' 
                      : 'text-blue-900'
                  }`}>描画中の矢印</h4>
                  <div className={`text-xs space-y-1 ${
                    appState.currentArrowSegments.length >= appState.maxSegments 
                      ? 'text-red-700' 
                      : 'text-blue-700'
                  }`}>
                    <div className="flex justify-between">
                      <span>セグメント数:</span>
                      <span className="font-medium">
                        {appState.currentArrowSegments.length} / {appState.maxSegments}
                      </span>
                    </div>
                    <div>現在のタイプ: {
                      appState.currentDrawingSegmentType === 'straight' ? '直線' :
                      appState.currentDrawingSegmentType === 'zigzag' ? 'ジグザグ' :
                      appState.currentDrawingSegmentType === 'dashed' ? '点線' : ''
                    }</div>
                    {appState.selectedArrowType !== appState.currentDrawingSegmentType && (
                      <div className="text-orange-600 font-medium">
                        次: {
                          appState.selectedArrowType === 'straight' ? '直線' :
                          appState.selectedArrowType === 'zigzag' ? 'ジグザグ' :
                          appState.selectedArrowType === 'dashed' ? '点線' : ''
                        }
                      </div>
                    )}
                    {appState.currentArrowSegments.length >= appState.maxSegments && (
                      <div className="text-red-600 font-medium mt-2 p-2 bg-red-100 rounded">
                        ⚠️ それ以上点の数は増やせません<br/>
                        ダブルクリックで完了してください
                      </div>
                    )}
                    
                    {/* 簡易Undo/Redo操作ボタン */}
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => {
                          // 前の点に戻る（最後のセグメントを削除）
                          if (appState.currentArrowSegments.length > 0) {
                            const newSegments = appState.currentArrowSegments.slice(0, -1)
                            let newPoints = appState.currentArrowPoints
                            
                            if (newSegments.length === 0) {
                              newPoints = appState.currentArrowPoints.slice(0, 2)
                            } else {
                              newPoints = appState.currentArrowPoints.slice(0, -2)
                            }
                            
                            // プレビュー線をクリア（マウス移動で再構築される）
                            updateAppState({
                              currentArrowSegments: newSegments,
                              currentArrowPoints: newPoints,
                              currentArrowPreviewPoints: [],
                              segmentLimitWarning: null
                            })
                            
                          }
                        }}
                        disabled={appState.currentArrowSegments.length === 0}
                        className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ↶ 前の点に戻る
                      </button>
                      <button
                        onClick={() => {
                          updateAppState({
                            isDrawingArrow: false,
                            currentArrowPoints: [],
                            currentArrowPreviewPoints: [],
                            currentArrowSegments: [],
                            currentDrawingSegmentType: appState.selectedArrowType,
                            initialArrowType: appState.selectedArrowType,
                            linkedPlayerId: undefined,
                            segmentLimitWarning: null
                          })
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        全てクリア
                      </button>
                    </div>

                    {/* デバッグパネル */}
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={appState.debugMode}
                            onChange={(e) => updateAppState({ debugMode: e.target.checked })}
                            className="w-3 h-3"
                          />
                          <span className="text-xs text-gray-700">デバッグモード</span>
                        </label>
                      </div>
                      
                      {appState.debugMode && (
                        <div className="text-xs text-gray-600 p-2 bg-yellow-50 border border-yellow-200 rounded space-y-1">
                          <div>🔍 デバッグ情報:</div>
                          <div>• プレビュー線: 緑○開始点, 青○終点</div>
                          <div>• セグメント境界マーカー表示</div>
                          <div>• コンソールで詳細ログ出力</div>
                          
                          {/* リアルタイム状態表示 */}
                          <div className="mt-2 p-2 bg-white border rounded">
                            <div className="font-medium">現在の状態:</div>
                            <div>セグメント: {appState.currentArrowSegments.length}個</div>
                            <div>Points: {Math.floor(appState.currentArrowPoints.length / 2)}点</div>
                            <div>プレビュー: {Math.floor(appState.currentArrowPreviewPoints.length / 2)}点</div>
                            {appState.currentArrowPreviewPoints.length >= 4 && (
                              <div>マウス位置: ({Math.round(appState.currentArrowPreviewPoints[appState.currentArrowPreviewPoints.length - 2])}, {Math.round(appState.currentArrowPreviewPoints[appState.currentArrowPreviewPoints.length - 1])})</div>
                            )}
                          </div>
                          <div className="space-y-1">
                          </div>
                        </div>
                      )}
                    </div>

                    {/* キーボードショートカットヘルプ */}
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                      <div>💡 キーボード操作:</div>
                      <div>• Backspace: 前の点に戻る</div>
                      <div>• Esc: 全てクリア</div>
                      <div>• ダブルクリック: 完了</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">矢印の先端</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateAppState({ selectedArrowHead: 'normal' })}
                    className={`p-2 text-sm border rounded ${
                      (appState as any).selectedArrowHead === 'normal'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    →
                  </button>
                  <button
                    onClick={() => updateAppState({ selectedArrowHead: 't-shaped' })}
                    className={`p-2 text-sm border rounded ${
                      (appState as any).selectedArrowHead === 't-shaped'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    ⊥
                  </button>
                  <button
                    onClick={() => updateAppState({ selectedArrowHead: 'none' })}
                    className={`p-2 text-sm border rounded ${
                      (appState as any).selectedArrowHead === 'none'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    —
                  </button>
                </div>
              </div>


              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">線の太さ</h3>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={(appState as any).selectedStrokeWidth || 2}
                  onChange={(e) => updateAppState({ selectedStrokeWidth: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 mt-1">
                  {(appState as any).selectedStrokeWidth || 2}px
                </div>
              </div>
            </div>
          )}

          {/* テキスト設定 */}
          {appState.selectedTool === 'text' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">フォント</h3>
                <select
                  value={(appState as any).selectedFontFamily || 'Arial'}
                  onChange={(e) => updateAppState({ selectedFontFamily: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">フォントサイズ</h3>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={(appState as any).selectedFontSize || 16}
                  onChange={(e) => updateAppState({ selectedFontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 mt-1">
                  {(appState as any).selectedFontSize || 16}px
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">スタイル</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateAppState({ selectedFontWeight: (appState as any).selectedFontWeight === 'bold' ? 'normal' : 'bold' })}
                    className={`px-3 py-1 text-sm rounded border ${
                      (appState as any).selectedFontWeight === 'bold'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => updateAppState({ selectedFontStyle: (appState as any).selectedFontStyle === 'italic' ? 'normal' : 'italic' })}
                    className={`px-3 py-1 text-sm rounded border ${
                      (appState as any).selectedFontStyle === 'italic'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    <em>I</em>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">テキスト設定</h3>
                <div className="text-xs text-gray-600 mb-3">
                  💡 キャンバス上でクリックしてテキストを追加、ダブルクリックで編集
                </div>
              </div>
            </div>
          )}

          {/* 中央線スナップ設定 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">中央線スナップ</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={appState.snapToObjects}
                  onChange={(e) => updateAppState({ snapToObjects: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">中央線にスナップ</span>
              </label>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  スナップ範囲: {appState.snapTolerance}px
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={appState.snapTolerance}
                  onChange={(e) => updateAppState({ snapTolerance: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div className="text-xs text-gray-600 mt-2 p-3 bg-gray-50 rounded">
                <div className="space-y-1">
                  <div className="font-medium">💡 中央線スナップについて:</div>
                  <div>• プレイヤーが中央線に近づくと自動でスナップ</div>
                  <div>• オフェンス/ディフェンスの配置制限と連携</div>
                  <div>• 反転時も自動で適用</div>
                </div>
              </div>
            </div>
          </div>

          {/* プレイヤー色選択 */}
          {appState.selectedTool === 'player' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">塗りつぶし色</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={appState.selectedFillColor}
                    onChange={(e) => updateAppState({ selectedFillColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => updateAppState({ selectedFillColor: '#ffffff' })}
                    className={`px-2 py-1 text-xs border rounded ${
                      appState.selectedFillColor === '#ffffff'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    白色
                  </button>
                  <span className="text-xs text-gray-600">
                    {appState.selectedFillColor}
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">枠線色</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={appState.selectedStrokeColor}
                    onChange={(e) => updateAppState({ selectedStrokeColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-600">{appState.selectedStrokeColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* 矢印・テキスト色選択 */}
          {(appState.selectedTool === 'arrow' || appState.selectedTool === 'text') && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">色</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={appState.selectedColor}
                  onChange={(e) => updateAppState({ selectedColor: e.target.value })}
                  className="w-8 h-8 border border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">{appState.selectedColor}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* プレイ一覧タブ */}
      {activeTab === 'plays' && (
        <div className="flex flex-col h-full">
          {/* 表示切り替えボタン */}
          <div className="p-4 border-b border-gray-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">プレイ一覧</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPlayListView('simple')}
                  className={`text-xs px-2 py-1 rounded ${
                    playListView === 'simple' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="シンプル表示"
                >
                  📋
                </button>
                <button
                  onClick={() => setPlayListView('advanced')}
                  className={`text-xs px-2 py-1 rounded ${
                    playListView === 'advanced' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="詳細表示・フィルター"
                >
                  🔍
                </button>
              </div>
            </div>
          </div>

          {/* 表示内容 */}
          <div className="flex-1 overflow-hidden">
            {playListView === 'simple' ? (
              <div className="p-4 h-full overflow-y-auto">
                {plays.length === 0 ? (
                  <p className="text-sm text-gray-500">プレイがありません</p>
                ) : (
                  <div className="space-y-2">
                    {plays.map(play => (
                      <div
                        key={play.id}
                        className={`p-3 border rounded hover:bg-gray-50 ${
                          appState.currentPlay?.id === play.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        <div 
                          onClick={() => onSelectPlay(play)}
                          className="cursor-pointer"
                        >
                          <div className="text-sm font-medium">{play.metadata.title}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            作成: {play.metadata.createdAt.toLocaleDateString()}
                          </div>
                          {play.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {play.metadata.tags.slice(0, 3).map((tag, index) => (
                                <span 
                                  key={index}
                                  className="text-xs bg-gray-200 text-gray-700 px-1 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                              {play.metadata.tags.length > 3 && (
                                <span className="text-xs text-gray-400">+{play.metadata.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {(onDeletePlay || onDuplicatePlay) && (
                          <div className="flex justify-end space-x-1 mt-2">
                            {onDuplicatePlay && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDuplicatePlay(play.id)
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                              >
                                複製
                              </button>
                            )}
                            {onDeletePlay && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm('このプレイを削除しますか？')) {
                                    onDeletePlay(play.id)
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                              >
                                削除
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <PlayListView
                plays={plays}
                currentPlay={appState.currentPlay}
                onSelectPlay={onSelectPlay}
                onDeletePlay={onDeletePlay || (() => {})}
                onDuplicatePlay={onDuplicatePlay || (() => {})}
              />
            )}
          </div>
        </div>
      )}

      {/* プレイリストタブ */}
      {activeTab === 'playlists' && (
        <div className="flex flex-col h-full">
          {isEditingPlaylist && selectedPlaylist ? (
            <PlaylistEditor
              playlist={selectedPlaylist}
              allPlays={plays}
              onUpdatePlaylist={(playlist) => {
                onUpdatePlaylist?.(playlist)
                setSelectedPlaylist(playlist)
              }}
              onBack={() => {
                setIsEditingPlaylist(false)
                setSelectedPlaylist(null)
              }}
            />
          ) : (
            <PlaylistManager
              playlists={playlists}
              plays={plays}
              onCreatePlaylist={onCreatePlaylist || (() => {})}
              onUpdatePlaylist={onUpdatePlaylist || (() => {})}
              onDeletePlaylist={onDeletePlaylist || (() => {})}
              onSelectPlaylist={(playlist) => {
                setSelectedPlaylist(playlist)
                setIsEditingPlaylist(true)
              }}
              currentPlaylist={selectedPlaylist}
            />
          )}
        </div>
      )}

      {/* フォーメーションタブ */}
      {activeTab === 'formations' && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden p-4">
            <FormationTemplateManager
              formations={formations}
              currentFormationType={appState.selectedTeam}
              onApplyFormation={onApplyFormation || (() => {})}
              onSaveCurrentAsTemplate={onSaveFormationTemplate || (() => {})}
              onDeleteFormation={onDeleteFormationTemplate || (() => {})}
              currentPlayers={appState.currentPlay?.players || []}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar