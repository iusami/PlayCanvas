import React, { useRef, useEffect, useState, forwardRef, useCallback } from 'react'
import { Stage, Layer, Rect, Line, Circle, Text, Group } from 'react-konva'
import Konva from 'konva'
import { AppState, Play, Player, Arrow, TextElement, ArrowSegment, FIELD_CONSTRAINTS } from '../types'

// テキスト測定用のグローバルインスタンス（パフォーマンス最適化）
let textMeasurer: Konva.Text | null = null
const getTextMeasurer = () => {
  if (!textMeasurer) {
    textMeasurer = new Konva.Text({})
  }
  return textMeasurer
}

// デバッグログヘルパー関数
const debugLog = (appState: AppState, ...args: any[]) => {
  if (appState.debugMode) {
    console.log(...args)
  }
}

// セグメント配列最適化関数
const optimizeSegments = (segments: ArrowSegment[]): ArrowSegment[] => {
  try {
    if (segments.length <= 1) return segments

    const optimized: ArrowSegment[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const currentSegment = segments[i]
      
      // セグメントの妥当性チェック
      if (!currentSegment || !currentSegment.points || currentSegment.points.length < 4) {
        console.warn(`無効なセグメント ${i} をスキップ: points不足`)
        continue
      }
      
      // 重複点除去: セグメントの開始点と終了点が同じ場合はスキップ
      const startX = currentSegment.points[0]
      const startY = currentSegment.points[1]
      const endX = currentSegment.points[currentSegment.points.length - 2]
      const endY = currentSegment.points[currentSegment.points.length - 1]
      
      // NaN値のチェック
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        console.warn(`無効なセグメント ${i} をスキップ: NaN値含む`)
        continue
      }
      
      // 開始点と終了点が同じ場合（距離が1px未満）はスキップ
      const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
      if (distance < 1) {
        // 無効なセグメントは無視（デバッグログは削除）
        continue
      }
      
      // 連続性保証: 前のセグメントの終点と現在のセグメントの開始点を一致させる
      if (optimized.length > 0) {
        const prevSegment = optimized[optimized.length - 1]
        const prevEndX = prevSegment.points[prevSegment.points.length - 2]
        const prevEndY = prevSegment.points[prevSegment.points.length - 1]
        
        // 現在のセグメントの開始点を前のセグメントの終点に合わせる
        const adjustedSegment = {
          ...currentSegment,
          points: [
            prevEndX, prevEndY, // 前のセグメントの終点から開始
            ...currentSegment.points.slice(2) // 残りの点
          ]
        }
        optimized.push(adjustedSegment)
        
        // 接続点調整の詳細ログは削除（不要な詳細情報）
      } else {
        optimized.push(currentSegment)
      }
    }
    
    // 同じタイプの隣接セグメントを結合
    const merged: ArrowSegment[] = []
    for (let i = 0; i < optimized.length; i++) {
      const current = optimized[i]
      
      if (merged.length > 0) {
        const prev = merged[merged.length - 1]
        
        // 同じタイプで隣接している場合は結合
        if (prev.type === current.type) {
          const mergedPoints = [
            ...prev.points.slice(0, -2), // 前のセグメントの終点を除く
            ...current.points // 現在のセグメント全体
          ]
          merged[merged.length - 1] = {
            ...prev,
            points: mergedPoints
          }
          // セグメント結合ログは削除（不要な詳細情報）
        } else {
          merged.push(current)
        }
      } else {
        merged.push(current)
      }
    }
    
    // セグメント最適化ログは削除（不要な詳細情報）
    return merged
  } catch (error) {
    console.error('セグメント最適化でエラーが発生:', error)
    // エラー時は元のセグメントをそのまま返す
    return segments
  }
}

// セグメントから全体のpoints配列を構築
const buildPointsFromSegments = (segments: ArrowSegment[]): number[] => {
  try {
    if (segments.length === 0) return []
    if (segments.length === 1) {
      // 単一セグメントの妥当性チェック
      if (!segments[0] || !segments[0].points || segments[0].points.length < 4) {
        console.warn('無効な単一セグメント:', segments[0])
        return []
      }
      return segments[0].points
    }

    const allPoints: number[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      // セグメントの妥当性チェック
      if (!segment || !segment.points || segment.points.length < 4) {
        console.warn(`セグメント ${i} が無効、スキップ:`, segment)
        continue
      }
      
      // NaN値チェック
      const hasNaN = segment.points.some(point => isNaN(point))
      if (hasNaN) {
        console.warn(`セグメント ${i} にNaN値、スキップ:`, segment.points)
        continue
      }
      
      if (i === 0) {
        // 最初のセグメントは全ての点を追加
        allPoints.push(...segment.points)
      } else {
        // 2番目以降のセグメントは開始点（最初の2つの要素）をスキップ
        // （前のセグメントの終点と重複するため）
        allPoints.push(...segment.points.slice(2))
      }
    }
    
    console.log(`Points配列構築完了: ${segments.length}セグメント → ${allPoints.length/2}点`)
    return allPoints
  } catch (error) {
    console.error('Points配列構築でエラーが発生:', error)
    // エラー時は空配列を返す
    return []
  }
}


interface FootballCanvasProps {
  play: Play
  appState: AppState
  updateAppState: (updates: Partial<AppState>) => void
  onUpdatePlay: (updates: Partial<Play>) => void
  onUndo?: () => void
  onRedo?: () => void
}

const FootballCanvas = forwardRef(({
  play,
  appState,
  updateAppState,
  onUpdatePlay,
  onUndo,
  onRedo
}: FootballCanvasProps, ref: React.Ref<Konva.Stage>) => {
  const internalStageRef = useRef<Konva.Stage>(null)
  const stageRef = (ref as React.RefObject<Konva.Stage>) || internalStageRef
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const lastValidPositionRef = useRef<{ x: number; y: number } | null>(null)
  const isRenderingOverlayRef = useRef<boolean>(false)
  const editingPlayerCacheRef = useRef<Player | null>(null)
  const lastDragUpdateRef = useRef<number>(0) // リアルタイム更新のthrottling用
  const arrowDragStartRef = useRef<{ [arrowId: string]: { x: number; y: number } }>({}) // 矢印ドラッグ開始位置

  // キーボードイベントハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力要素にフォーカスがある場合はキーイベントを無視
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      )
      
      // 矢印描画中のキーイベント処理
      if (appState.isDrawingArrow && !isInputFocused) {
        if (e.key === 'Escape') {
          // Escキーで矢印描画全体をキャンセル
          e.preventDefault()
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
          debugLog(appState, '矢印描画をキャンセルしました')
        } else if (e.key === 'Backspace' && appState.currentArrowSegments.length > 0) {
          // Backspaceキーで最後のセグメントを削除
          e.preventDefault()
          const newSegments = appState.currentArrowSegments.slice(0, -1)
          
          // セグメントが削除された場合、currentArrowPointsも調整
          let newPoints = appState.currentArrowPoints
          if (newSegments.length === 0) {
            // 全セグメントが削除された場合、最初の点のみ残す
            newPoints = appState.currentArrowPoints.slice(0, 2)
          } else {
            // 最後のセグメントの終点を削除
            newPoints = appState.currentArrowPoints.slice(0, -2)
          }
          
          // 現在のマウス位置を保持してプレビューを正しく再構築
          let newPreviewPoints: number[] = []
          if (appState.currentArrowPreviewPoints.length >= 4) {
            // 現在のマウス位置を取得
            const mouseX = appState.currentArrowPreviewPoints[appState.currentArrowPreviewPoints.length - 2]
            const mouseY = appState.currentArrowPreviewPoints[appState.currentArrowPreviewPoints.length - 1]
            
            // 新しいpoints配列にマウス位置を追加
            if (newPoints.length >= 2) {
              newPreviewPoints = [...newPoints, mouseX, mouseY]
            } else {
              newPreviewPoints = [mouseX, mouseY, mouseX, mouseY]
            }
          } else {
            newPreviewPoints = newPoints.length >= 2 ? [...newPoints] : []
          }
          
          updateAppState({
            currentArrowSegments: newSegments,
            currentArrowPoints: newPoints,
            currentArrowPreviewPoints: newPreviewPoints,
            segmentLimitWarning: null // 削除時は警告を消す
          })
          // デバッグモード時の詳細ログ
          if (appState.debugMode) {
            console.group('🗑️ Backspace: 最後のセグメント削除')
            console.log('削除前:', {
              セグメント数: appState.currentArrowSegments.length,
              Points配列長: appState.currentArrowPoints.length / 2,
              プレビュー配列長: appState.currentArrowPreviewPoints.length / 2
            })
            console.log('削除後:', {
              セグメント数: newSegments.length,
              Points配列長: newPoints.length / 2,
              プレビュー配列長: newPreviewPoints.length / 2
            })
            console.groupEnd()
          } else {
            console.log(`最後のセグメントを削除しました (残り: ${newSegments.length})`)
          }
        }
      }
      
      // テキスト編集中のキーイベント処理
      if (appState.isEditingText) {
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelDirectTextEdit()
        }
      }
    }

    // イベントリスナーを追加
    window.addEventListener('keydown', handleKeyDown)

    // クリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [appState.isDrawingArrow, appState.currentArrowSegments, appState.currentArrowPoints, appState.selectedArrowType, appState.isEditingText, updateAppState])

  // 編集中のテキスト要素の画面座標を計算
  const getTextScreenPosition = () => {
    
    if (!appState.isEditingText || !appState.editingTextId || !stageRef.current) {
      return lastValidPositionRef.current // 基本条件が失敗した場合もキャッシュを返す
    }

    // テキストプレイヤーかチェック
    let player = play.players.find(p => p.id === appState.editingTextId)
    
    // プレイヤーが見つからない場合、キャッシュから取得
    if (!player && editingPlayerCacheRef.current && editingPlayerCacheRef.current.id === appState.editingTextId) {
      player = editingPlayerCacheRef.current
    }
    
    if (player && player.type === 'text') {
      const stage = stageRef.current
      let stageContainer = null
      
      // 複数回のリトライでstageContainerを取得
      for (let attempt = 0; attempt < 3; attempt++) {
        stageContainer = stage.container()
        if (stageContainer) break
        
        // 短時間待機してリトライ（同期的に）
        if (attempt < 2) {
          const start = Date.now()
          while (Date.now() - start < 10) {
            // 10ms待機のためのビジーループ
          }
        }
      }
      
      if (!stageContainer) {
        return lastValidPositionRef.current // キャッシュされた位置を返す
      }

      try {
        const containerRect = stageContainer.getBoundingClientRect()
        
        // containerRectが有効かチェック
        if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
          return lastValidPositionRef.current
        }
        
        // 座標変換（ズーム機能削除後）
        const x = (player.x + 50) + containerRect.left
        const y = (player.y + 50) + containerRect.top
        
        lastValidPositionRef.current = { x, y }
        return { x, y }
      } catch (error) {
        return lastValidPositionRef.current // エラー時もキャッシュを返す
      }
    }

    // 通常のテキスト要素
    const textElement = play.texts.find(t => t.id === appState.editingTextId)
    if (!textElement) return lastValidPositionRef.current

    const stage = stageRef.current
    let stageContainer = null
    
    // 複数回のリトライでstageContainerを取得
    for (let attempt = 0; attempt < 3; attempt++) {
      stageContainer = stage.container()
      if (stageContainer) break
      
      // 短時間待機してリトライ（同期的に）
      if (attempt < 2) {
        const start = Date.now()
        while (Date.now() - start < 10) {
          // 10ms待機のためのビジーループ
        }
      }
    }
    
    if (!stageContainer) {
      return lastValidPositionRef.current
    }

    try {
      const containerRect = stageContainer.getBoundingClientRect()
      
      // containerRectが有効かチェック
      if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
        return lastValidPositionRef.current
      }
      
      // 座標変換（ズーム機能削除後）
      const x = (textElement.x + 50) + containerRect.left
      const y = (textElement.y + 50) + containerRect.top

      lastValidPositionRef.current = { x, y }
      return { x, y }
    } catch (error) {
      return lastValidPositionRef.current
    }
  }

  // プレーヤー配置制限関連の基本関数
  const getCenterLineY = (fieldHeight: number) => {
    return (fieldHeight * 4) / 6  // 6等分の4番目（中央線）
  }

  const isFieldFlipped = () => {
    // フィールドが上下反転されているかを判定
    // センターの位置とプレーヤーの分布から判定
    if (!play?.center) {
      console.log(`🔍 isFieldFlipped: センターなし → false`)
      return false
    }
    
    const centerLineY = getCenterLineY(play.field.height)
    const secondLineY = (play.field.height * 2) / 6 - FIELD_CONSTRAINTS.FIELD_FLIP_DETECTION_SECOND_LINE_OFFSET  // 6等分の2番目
    const fourthLineY = (play.field.height * 4) / 6 + FIELD_CONSTRAINTS.FIELD_FLIP_DETECTION_FOURTH_LINE_OFFSET   // 6等分の4番目
    
    const distToSecond = Math.abs(play.center.y - secondLineY)
    const distToFourth = Math.abs(play.center.y - fourthLineY)
    const flipped = distToSecond < distToFourth
    
    console.log(`🔍 isFieldFlipped: センター(${play.center.x}, ${play.center.y})`)
    console.log(`🔍 isFieldFlipped: 2番目の線=${secondLineY.toFixed(1)}, 4番目の線=${fourthLineY.toFixed(1)}, 中央線=${centerLineY.toFixed(1)}`)
    console.log(`🔍 isFieldFlipped: 2番目まで距離=${distToSecond.toFixed(1)}, 4番目まで距離=${distToFourth.toFixed(1)} → ${flipped}`)
    
    // センターが2番目の線付近にいる場合は反転状態とみなす
    return flipped
  }



  const constrainPlayerPosition = (x: number, y: number, team: 'offense' | 'defense', playerSize: number = 20) => {
    const flipped = isFieldFlipped()
    const halfSize = playerSize / 2
    
    // 反転時は実際の中央線位置（play.center.y）を使用、通常時は固定値を使用
    const centerLineY = flipped && play.center ? play.center.y : getCenterLineY(play.field.height)
    
    // フィールド上限制約：上から2つ目の線をフィールド上限とする
    const fieldUpperLimit = (play.field.height * FIELD_CONSTRAINTS.FIELD_UPPER_LIMIT_LINE_INDEX) / 6
    
    console.log(`🔍 constrainPlayerPosition: 入力(${x.toFixed(1)}, ${y.toFixed(1)}) ${team} centerLineY=${centerLineY.toFixed(1)} flipped=${flipped}`)
    console.log(`🔍 フィールドサイズ: width=${play.field.width}, height=${play.field.height}`)
    console.log(`🔍 プレーヤーサイズ: ${playerSize}, halfSize=${halfSize}`)
    console.log(`🔍 フィールド上限: ${fieldUpperLimit.toFixed(1)}px (上から${FIELD_CONSTRAINTS.FIELD_UPPER_LIMIT_LINE_INDEX}つ目の線)`)
    console.log(`🔍 センター位置: ${play.center ? `(${play.center.x}, ${play.center.y})` : 'なし'}`)
    console.log(`🔍 使用する中央線: ${flipped ? '実際の中央線位置' : '固定の中央線位置'} = ${centerLineY.toFixed(1)}`)
    
    // 中央線から少し離した位置で制限
    const offenseSnapOffset = 15 // オフェンス用の距離（中央線より下に）
    const defenseSnapOffset = 15 // ディフェンス用の距離（中央線より上に）
    console.log(`🔍 オフセット設定: offense=${offenseSnapOffset}, defense=${defenseSnapOffset}`)
    
    // X座標はフィールド内に制限
    const constrainedX = Math.max(halfSize, Math.min(play.field.width - halfSize, x))
    
    let constrainedY = y
    
    if (flipped) {
      // 反転時: オフェンスが上、ディフェンスが下
      if (team === 'offense') {
        // 反転時オフェンス：中央線より少し上の位置まで配置可能（フィールド上半分で制約）
        // より緩い制限に変更：プレイヤーの上端が中央線より5px上まで
        // プレイヤーの上端 = center.y - halfSize >= centerLineY - 5
        // つまり: center.y >= centerLineY - 5 + halfSize
        const minimalOffset = 5  // 制限を緩和
        const minY = centerLineY - minimalOffset + halfSize
        
        // フィールド上限制約を適用：上から2つ目の線以下まで  
        const effectiveTopLimit = Math.max(halfSize, fieldUpperLimit)
        
        // オフェンスの有効範囲：フィールド上限から中央線付近まで（より広範囲）
        const finalMinY = Math.max(effectiveTopLimit, minY)
        const maxY = centerLineY + halfSize  // 中央線を少し越えても許可
        constrainedY = Math.max(finalMinY, Math.min(maxY, y))
        
        console.log(`🔍 反転オフェンス: centerLineY=${centerLineY.toFixed(1)}, minY=${minY.toFixed(1)}, maxY=${maxY.toFixed(1)}, effectiveTopLimit=${effectiveTopLimit.toFixed(1)}`)
        console.log(`🔍 反転オフェンス: 最終範囲=${finalMinY.toFixed(1)}〜${maxY.toFixed(1)}`)
        console.log(`🔍 反転オフェンス: 入力Y=${y.toFixed(1)} → 制限Y=${constrainedY.toFixed(1)}`)
      } else {
        // 反転時ディフェンス：プレイヤーの上端が中央線より10px下まで配置可能（フィールド下半分で制約）
        // プレイヤーの上端 = center.y - halfSize >= centerLineY + 10
        // つまり: center.y >= centerLineY + 10 + halfSize
        const minY = centerLineY + 10 + halfSize
        const fieldBottomLimit = play.field.height - halfSize
        
        // ディフェンスの有効範囲：minYからフィールド下端まで
        constrainedY = Math.max(minY, Math.min(fieldBottomLimit, y))
        
        console.log(`🔍 反転ディフェンス: minY=${minY}, fieldBottomLimit=${fieldBottomLimit}`)
        console.log(`🔍 反転ディフェンス: プレイヤー上端=${constrainedY - halfSize}px (中央線+10px=${centerLineY + 10}以上でないとダメ)`)
        console.log(`🔍 反転ディフェンス: 入力Y=${y.toFixed(1)} → 制限Y=${constrainedY.toFixed(1)} (範囲: ${minY}〜${fieldBottomLimit})`)
      }
    } else {
      // 通常時: オフェンスが下、ディフェンスが上
      if (team === 'offense') {
        // 通常時オフェンス：プレイヤーの上端が中央線より少し下から配置可能（最小制限、軽減版）
        // プレイヤーの上端 = center.y - halfSize >= centerLineY + 5
        // つまり: center.y >= centerLineY + 5 + halfSize
        const minimalOffset = 5  // 元の15から5に軽減
        const minY = centerLineY + minimalOffset + halfSize
        const fieldBottomLimit = play.field.height - halfSize
        
        // オフェンスの有効範囲：minYからフィールド下端まで
        constrainedY = Math.max(minY, Math.min(fieldBottomLimit, y))
        
        console.log(`🔍 通常オフェンス: centerLineY=${centerLineY.toFixed(1)}, minY=${minY.toFixed(1)}, fieldBottomLimit=${fieldBottomLimit}`)
        console.log(`🔍 通常オフェンス: プレイヤー上端=${constrainedY - halfSize}px (中央線+5px=${centerLineY + minimalOffset}以下でないとダメ)`)
        console.log(`🔍 通常オフェンス: 入力Y=${y.toFixed(1)} → 制限Y=${constrainedY.toFixed(1)} (範囲: ${minY.toFixed(1)}〜${fieldBottomLimit})`)
      } else {
        // ディフェンスは中央線より少し上まで（ディフェンス用オフセット適用）
        const maxY = centerLineY - defenseSnapOffset  // 375 - 10 = 365
        // フィールド上限制約を適用：上から2つ目の線以下まで
        const effectiveTopLimit = Math.max(halfSize, fieldUpperLimit)
        
        // ディフェンスの有効範囲：フィールド上限からmaxYまで
        constrainedY = Math.max(effectiveTopLimit, Math.min(maxY, y))
        
        console.log(`🔍 通常ディフェンス: centerLineY=${centerLineY.toFixed(1)}, maxY=${maxY.toFixed(1)}, effectiveTopLimit=${effectiveTopLimit.toFixed(1)}`)
        console.log(`🔍 通常ディフェンス: 入力Y=${y.toFixed(1)} → 制限Y=${constrainedY.toFixed(1)} (範囲: ${effectiveTopLimit.toFixed(1)}〜${maxY.toFixed(1)})`)
      }
    }
    
    console.log(`🔍 constrainPlayerPosition: 出力(${constrainedX.toFixed(1)}, ${constrainedY.toFixed(1)})`)
    return { x: constrainedX, y: constrainedY }
  }

  useEffect(() => {
    const updateDimensions = () => {
      const container = stageRef.current?.container()
      if (container) {
        const rect = container.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: rect.height
        })
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力要素にフォーカスがある場合はキーイベントを無視
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      )
      
      // Delete/Backspaceキーで選択された要素を削除（テキスト編集中や入力フィールドにフォーカス中は除外）
      if ((e.key === 'Delete' || e.key === 'Backspace') && appState.selectedElementIds.length > 0 && !appState.isEditingText && !isInputFocused) {
        const deletedPlayerIds = appState.selectedElementIds.filter(id => 
          play.players.some(p => p.id === id)
        )
        
        const newPlayers = play.players.filter(p => !appState.selectedElementIds.includes(p.id))
        const newArrows = play.arrows.filter(a => 
          !appState.selectedElementIds.includes(a.id) && // 直接選択された矢印
          !deletedPlayerIds.includes(a.linkedPlayerId || '') // リンクされたプレイヤーが削除された矢印
        )
        const newTexts = play.texts.filter(t => !appState.selectedElementIds.includes(t.id))
        
        onUpdatePlay({ 
          players: newPlayers,
          arrows: newArrows,
          texts: newTexts
        })
        updateAppState({ selectedElementIds: [] })
      }
      
      // Escapeキーで矢印描画をキャンセル
      if (e.key === 'Escape' && appState.isDrawingArrow) {
        updateAppState({
          isDrawingArrow: false,
          currentArrowPoints: [],
          currentArrowPreviewPoints: [],
          currentArrowSegments: [],
          currentDrawingSegmentType: appState.selectedArrowType,
          initialArrowType: appState.selectedArrowType,
          linkedPlayerId: undefined
        })
      }

      // Ctrl+A または Cmd+A で全選択
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const allPlayerIds = play.players.map(p => p.id)
        updateAppState({ selectedElementIds: allPlayerIds })
      }

      // Escapeキーで選択解除
      if (e.key === 'Escape' && !appState.isDrawingArrow) {
        updateAppState({ 
          selectedElementIds: [],
          isRangeSelecting: false,
          rangeSelectStart: null,
          rangeSelectEnd: null
        })
      }

      // Ctrl+Z または Cmd+Z でUndo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo?.()
      }

      // Ctrl+Y または Cmd+Shift+Z でRedo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        onRedo?.()
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('resize', updateDimensions)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [appState.selectedElementIds, appState.isDrawingArrow, play?.players, play?.arrows, play?.texts, onUpdatePlay, updateAppState, onUndo, onRedo])

  // テキスト編集開始時にinputにフォーカス
  useEffect(() => {
    if (appState.isEditingText && textInputRef.current) {
      textInputRef.current.focus()
      textInputRef.current.select()
    }
  }, [appState.isEditingText])

  // 矢印タイプ変更の検出とセグメント管理
  useEffect(() => {
    // 矢印描画中にタイプが変更された場合
    if (appState.isDrawingArrow && 
        appState.selectedArrowType !== appState.currentDrawingSegmentType) {
      
      console.log(`Arrow type changed during drawing: ${appState.currentDrawingSegmentType} → ${appState.selectedArrowType}`)
      
      // 現在描画中のセグメントタイプを更新
      updateAppState({
        currentDrawingSegmentType: appState.selectedArrowType
      })
    }
  }, [appState.selectedArrowType, appState.isDrawingArrow, appState.currentDrawingSegmentType, updateAppState])

  // スナップ機能 - 近い位置の計算
  const getSnappedPosition = (targetX: number, targetY: number, targetTeam?: 'offense' | 'defense') => {
    if (!appState.snapToObjects) {
      return { x: targetX, y: targetY, guides: [] }
    }

    const snappedX = targetX
    let snappedY = targetY
    const guides: Array<{ type: 'horizontal' | 'vertical', position: number, playerIds: string[] }> = []

    // チームが指定されている場合のみ中央線スナップを実行
    if (targetTeam) {
      const flipped = isFieldFlipped()
      // 反転時は実際の中央線位置（play.center.y）を使用、通常時は固定値を使用
      const centerLineY = flipped && play.center ? play.center.y : getCenterLineY(play.field.height)
      
      let distanceToCenter = 0
      let snapTargetY = 0
      
      // 中央線から少し離した位置でスナップ
      const offenseSnapOffset = 15 // オフェンス用の距離（中央線より下に）
      const defenseSnapOffset = 15 // ディフェンス用の距離（中央線より上に）
      console.log(`🔍 getSnappedPosition: オフセット設定 offense=${offenseSnapOffset}, defense=${defenseSnapOffset}`)
      
      if (flipped) {
        // 反転時: オフェンスが上、ディフェンスが下
        if (targetTeam === 'offense') {
          // 反転オフェンス：中央線より少し上にスナップ
          const snapLineY = centerLineY - defenseSnapOffset  // 375 - 10 = 365
          distanceToCenter = Math.abs(targetY - snapLineY)
          snapTargetY = snapLineY
        } else {
          // 反転ディフェンス：定数で定義された位置にスナップ（制限値と一致）
          const snapLineY = FIELD_CONSTRAINTS.DEFENSE_MIN_Y_FLIPPED
          distanceToCenter = Math.abs(targetY - snapLineY)
          snapTargetY = snapLineY
        }
      } else {
        // 通常時: オフェンスが下、ディフェンスが上
        if (targetTeam === 'offense') {
          // 通常オフェンス：中央線より少し下にスナップ
          const snapLineY = centerLineY + offenseSnapOffset  // 375 + 10 = 385
          distanceToCenter = Math.abs(targetY - snapLineY)
          snapTargetY = snapLineY
        } else {
          // 通常ディフェンス：中央線より少し上にスナップ
          const snapLineY = centerLineY - defenseSnapOffset  // 375 - 10 = 365
          distanceToCenter = Math.abs(targetY - snapLineY)
          snapTargetY = snapLineY
        }
      }
      
      console.log(`🔍 getSnappedPosition: チーム=${targetTeam}, 反転=${flipped}, 中央線=${centerLineY.toFixed(1)}`)
      console.log(`🔍 getSnappedPosition: 入力位置=(${targetX.toFixed(1)}, ${targetY.toFixed(1)})`)
      console.log(`🔍 getSnappedPosition: 中央線距離=${distanceToCenter.toFixed(1)}, スナップ先Y=${snapTargetY.toFixed(1)}`)
      console.log(`🔍 getSnappedPosition: スナップ範囲=${appState.snapTolerance}`)
      
      // スナップ範囲内なら中央線に接するように調整
      if (distanceToCenter <= appState.snapTolerance) {
        console.log(`🔍 getSnappedPosition: スナップ適用！ Y=${targetY.toFixed(1)} → ${snapTargetY.toFixed(1)}`)
        snappedY = snapTargetY
        guides.push({
          type: 'horizontal',
          position: centerLineY,
          playerIds: [] // 中央線なのでplayerIdsは空
        })
      } else {
        console.log(`🔍 getSnappedPosition: スナップ範囲外、スナップなし`)
      }
    }

    return { x: snappedX, y: snappedY, guides }
  }

  // 直接編集の保存
  const saveDirectTextEdit = () => {
    if (appState.isEditingText && appState.editingTextId) {
      // テキストプレイヤーの編集かチェック
      const player = play.players.find(p => p.id === appState.editingTextId)
      
      if (player && player.type === 'text') {
        // テキストプレイヤーの場合、空文字の時は保存せずに編集継続
        const trimmedText = appState.selectedText.trim()
        
        if (!trimmedText) {
          // 空の場合は編集を継続（保存しない）
          return
        } else {
          // 2文字制限を適用
          const limitedText = trimmedText.slice(0, 2)
          const newPlayers = play.players.map(p => 
            p.id === appState.editingTextId 
              ? { ...p, text: limitedText }
              : p
          )
          onUpdatePlay({ players: newPlayers })
        }
      } else {
        // 通常のテキスト要素の場合
        if (!appState.selectedText.trim()) {
          const newTexts = play.texts.filter(text => text.id !== appState.editingTextId)
          onUpdatePlay({ texts: newTexts })
        } else {
          const newTexts = play.texts.map(text => 
            text.id === appState.editingTextId 
              ? { 
                  ...text, 
                  text: appState.selectedText,
                  fontSize: appState.selectedFontSize,
                  fontFamily: appState.selectedFontFamily,
                  color: appState.selectedColor
                }
              : text
          )
          onUpdatePlay({ texts: newTexts })
        }
      }
      
      updateAppState({ 
        isEditingText: false, 
        editingTextId: null,
        selectedElementIds: []
      })
      
      // キャッシュをクリア
      editingPlayerCacheRef.current = null
    }
  }

  // 直接編集のキャンセル
  const cancelDirectTextEdit = () => {
    if (appState.isEditingText && appState.editingTextId) {
      // テキストプレイヤーかチェック
      const player = play.players.find(p => p.id === appState.editingTextId)
      
      if (player && player.type === 'text') {
        // テキストプレイヤーの場合、空の編集中なら'A'に戻す
        if (!appState.selectedText.trim()) {
          const newPlayers = play.players.map(p => 
            p.id === appState.editingTextId 
              ? { ...p, text: 'A' }
              : p
          )
          onUpdatePlay({ players: newPlayers })
        }
      } else {
        // 通常のテキスト要素の場合、空のテキストなら削除
        const editingText = play.texts.find(t => t.id === appState.editingTextId)
        if (editingText && !editingText.text.trim()) {
          const newTexts = play.texts.filter(text => text.id !== appState.editingTextId)
          onUpdatePlay({ texts: newTexts })
        }
      }
    }
    
    updateAppState({ 
      isEditingText: false, 
      editingTextId: null,
      selectedElementIds: []
    })
  }

  const handleStageDoubleClick = () => {
    // ダブルクリックで矢印描画を完了
    if (appState.selectedTool === 'arrow' && appState.isDrawingArrow && appState.currentArrowPoints.length >= 2) {
      // 現在のマウス位置を含む完全な点列を使用
      let finalPoints = appState.currentArrowPoints
      
      // プレビューポイントがある場合はそれを使用（最新のマウス位置を含む）
      if (appState.currentArrowPreviewPoints.length >= 4) {
        finalPoints = appState.currentArrowPreviewPoints
      } else if (appState.currentArrowPoints.length >= 2) {
        // プレビューがない場合でも、最低2点あれば矢印を作成
        finalPoints = appState.currentArrowPoints
      }

      // 最低4つの要素（2つの座標）が必要
      if (finalPoints.length >= 4) {
        // セグメントがある場合はそれを使用、ない場合は単一セグメントとして作成
        let segments = appState.currentArrowSegments
        if (segments.length === 0) {
          // セグメントがない場合（単純な矢印）、全体を一つのセグメントとして作成
          segments = [{
            points: finalPoints,
            type: appState.initialArrowType
          }]
        } else {
          // 最後のセグメントを最新の終点で更新
          const lastSegment = segments[segments.length - 1]
          const updatedLastSegment = {
            ...lastSegment,
            points: [
              lastSegment.points[0], lastSegment.points[1], // 開始点はそのまま
              finalPoints[finalPoints.length - 2], finalPoints[finalPoints.length - 1] // 最新の終点
            ]
          }
          segments = [...segments.slice(0, -1), updatedLastSegment]
        }

        // セグメント配列の最適化処理
        segments = optimizeSegments(segments)

        // 最適化されたセグメントから全体のpointsを再構築
        const optimizedPoints = buildPointsFromSegments(segments)

        const newArrow: Arrow = {
          id: crypto.randomUUID(),
          points: optimizedPoints,
          type: appState.initialArrowType, // メインタイプ（開始時のタイプ、後方互換性）
          headType: appState.selectedArrowHead,
          color: appState.selectedColor,
          strokeWidth: appState.selectedStrokeWidth,
          linkedPlayerId: appState.linkedPlayerId, // プレイヤーリンク情報を保存
          segments: segments // セグメント情報
        }

        onUpdatePlay({
          arrows: [...play.arrows, newArrow]
        })

        updateAppState({
          isDrawingArrow: false,
          currentArrowPoints: [],
          currentArrowPreviewPoints: [],
          currentArrowSegments: [],
          currentDrawingSegmentType: appState.selectedArrowType,
          initialArrowType: appState.selectedArrowType,
          linkedPlayerId: undefined
        })
      }
    }
  }

  const handleStageMouseDown = (e: any) => {
    if (appState.selectedTool !== 'select') return

    // プレイヤー、矢印、テキストがクリックされた場合は範囲選択を開始しない
    const targetName = e.target.getClassName()
    const targetId = e.target.id()
    
    // プレイヤー、矢印、テキスト要素の場合は範囲選択しない
    if (targetName === 'Circle' || targetName === 'Line' || targetName === 'Text' || 
        targetName === 'Group' || targetName === 'Rect') {
      // IDをチェックして、プレイヤーや矢印のIDパターンがある場合は範囲選択しない
      if (targetId && (targetId.startsWith('player-') || targetId.startsWith('arrow-'))) {
        return
      }
    }

    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // ズームとパンを考慮した座標変換
    const transform = stage.getAbsoluteTransform().copy().invert()
    const pos = transform.point(pointer)
    
    // フィールドのオフセット（Group x={50} y={50}）を考慮
    const adjustedPos = {
      x: pos.x - 50,
      y: pos.y - 50
    }

    // 範囲選択開始
    updateAppState({
      isRangeSelecting: true,
      rangeSelectStart: adjustedPos,
      rangeSelectEnd: adjustedPos
    })
  }

  const handleStageMouseMove = () => {
    // 座標変換を1回だけ実行（統一化）
    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const transform = stage.getAbsoluteTransform().copy().invert()
    const pos = transform.point(pointer)
    
    const adjustedPos = {
      x: pos.x - 50,
      y: pos.y - 50
    }

    // 範囲選択処理
    if (appState.isRangeSelecting) {
      updateAppState({
        rangeSelectEnd: adjustedPos
      })
    }

    // プレビュー線処理（範囲選択中は無効化して競合を防ぐ）
    if (!appState.isRangeSelecting) {
      handleMouseMove(adjustedPos)
    }
  }

  const handleStageMouseUp = () => {
    if (appState.isRangeSelecting && appState.rangeSelectStart && appState.rangeSelectEnd) {
      const start = appState.rangeSelectStart
      const end = appState.rangeSelectEnd
      
      // 実際にドラッグが発生したかチェック（最小移動距離: 5px）
      const dragDistance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      )
      
      if (dragDistance > 5) {
        // 範囲内のオブジェクトを選択
        const minX = Math.min(start.x, end.x)
        const maxX = Math.max(start.x, end.x)
        const minY = Math.min(start.y, end.y)
        const maxY = Math.max(start.y, end.y)
        
        // プレイヤーを選択
        const selectedPlayers = play.players.filter(player => 
          player.x >= minX && player.x <= maxX &&
          player.y >= minY && player.y <= maxY
        )
        
        // 矢印を選択（矢印の任意の点が範囲内にある場合）
        const selectedArrows = play.arrows.filter(arrow => {
          // 矢印のすべての点をチェック
          for (let i = 0; i < arrow.points.length; i += 2) {
            const x = arrow.points[i]
            const y = arrow.points[i + 1]
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              return true
            }
          }
          return false
        })
        
        // テキストを選択
        const selectedTexts = play.texts.filter(text => 
          text.x >= minX && text.x <= maxX &&
          text.y >= minY && text.y <= maxY
        )
        
        // 選択されたすべてのオブジェクトのIDを統合
        const selectedIds = [
          ...selectedPlayers.map(p => p.id),
          ...selectedArrows.map(a => a.id),
          ...selectedTexts.map(t => t.id)
        ]
        
        updateAppState({
          selectedElementIds: selectedIds,
          isRangeSelecting: false,
          rangeSelectStart: null,
          rangeSelectEnd: null
        })
      } else {
        // ドラッグではなく、単純なクリックとして処理
        updateAppState({
          isRangeSelecting: false,
          rangeSelectStart: null,
          rangeSelectEnd: null,
          selectedElementIds: [] // 空白クリックで選択解除
        })
      }
    }
  }

  const handleStageClick = () => {
    // テキスト編集中の場合、他の場所をクリックしたら編集を終了
    if (appState.isEditingText && appState.editingTextId) {
      const player = play.players.find(p => p.id === appState.editingTextId)
      if (player && player.type === 'text') {
        // テキストプレイヤーの場合、空なら'A'に戻す
        if (!appState.selectedText.trim()) {
          const newPlayers = play.players.map(p => 
            p.id === appState.editingTextId 
              ? { ...p, text: 'A' }
              : p
          )
          onUpdatePlay({ players: newPlayers })
        } else {
          // 空でない場合は保存
          saveDirectTextEdit()
          return // 保存処理で編集終了するので早期リターン
        }
      } else {
        // 通常のテキスト要素の場合は既存の処理
        saveDirectTextEdit()
        return
      }
      
      updateAppState({ 
        isEditingText: false, 
        editingTextId: null,
        selectedElementIds: []
      })
      
      // キャッシュをクリア
      editingPlayerCacheRef.current = null
      return
    }

    const stage = stageRef.current
    if (!stage) return

    const pointer = stage.getPointerPosition()
    if (!pointer) return

    // ズームとパンを考慮した座標変換
    const transform = stage.getAbsoluteTransform().copy().invert()
    const pos = transform.point(pointer)
    
    // フィールドのオフセット（Group x={50} y={50}）を考慮
    const adjustedPos = {
      x: pos.x - 50,
      y: pos.y - 50
    }

    if (appState.selectedTool === 'player') {
      // スナップ機能を適用（同じチーム間でのみ）
      const snapped = getSnappedPosition(adjustedPos.x, adjustedPos.y, appState.selectedTeam)
      
      // 配置制限を適用
      console.log(`🔍 新規プレーヤー配置: スナップ後(${snapped.x.toFixed(1)}, ${snapped.y.toFixed(1)}) チーム=${appState.selectedTeam}`)
      const constrained = constrainPlayerPosition(snapped.x, snapped.y, appState.selectedTeam, 20)
      console.log(`🔍 新規プレーヤー配置: 制限後(${constrained.x.toFixed(1)}, ${constrained.y.toFixed(1)})`)
      
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        x: constrained.x,
        y: constrained.y,
        type: appState.selectedPlayerType,
        position: appState.selectedPlayerPosition,
        color: appState.selectedStrokeColor, // 後方互換性のため枠線色を設定
        fillColor: appState.selectedFillColor === 'transparent' ? '#ffffff' : appState.selectedFillColor,
        strokeColor: appState.selectedStrokeColor,
        size: 20,
        team: appState.selectedTeam,
        text: appState.selectedPlayerType === 'text' ? 'A' : undefined,
        flipped: (appState.selectedPlayerType === 'triangle' || appState.selectedPlayerType === 'chevron') 
          ? isFieldFlipped() 
          : false // triangle/chevronは上下反転状態に応じて向きを設定
      }

      onUpdatePlay({
        players: [...play.players, newPlayer]
      })
    } else if (appState.selectedTool === 'arrow') {
      if (!appState.isDrawingArrow) {
        // 矢印描画開始
        updateAppState({
          isDrawingArrow: true,
          currentArrowPoints: [adjustedPos.x, adjustedPos.y],
          currentArrowSegments: [],
          currentDrawingSegmentType: appState.selectedArrowType,
          initialArrowType: appState.selectedArrowType
        })
      } else {
        // セグメントを作成する前に上限チェック（2点以上ある場合のみ）
        if (appState.currentArrowPoints.length >= 2) {
          // セグメント上限チェック
          if (appState.currentArrowSegments.length >= appState.maxSegments) {
            // 上限に達している場合は警告を表示して新しい点やセグメントを作成しない
            updateAppState({
              segmentLimitWarning: "それ以上点の数は増やせません"
            })
            // 警告を3秒後に自動で消す
            setTimeout(() => {
              updateAppState({ segmentLimitWarning: null })
            }, 3000)
            return
          }
        }
        
        // 既存の点に新しい点を追加
        const newPoints = [...appState.currentArrowPoints, adjustedPos.x, adjustedPos.y]
        
        updateAppState({
          currentArrowPoints: newPoints
        })
        
        // セグメントを作成するのは2点以上ある場合のみ
        if (appState.currentArrowPoints.length >= 2) {
          const lastIndex = appState.currentArrowPoints.length
          const segmentPoints = [
            appState.currentArrowPoints[lastIndex - 2], // 前の点のx
            appState.currentArrowPoints[lastIndex - 1], // 前の点のy
            adjustedPos.x, // 新しい点のx
            adjustedPos.y  // 新しい点のy
          ]
          
          // このセグメントは前回クリック時点での描画タイプで作成
          const newSegment: ArrowSegment = {
            points: segmentPoints,
            type: appState.currentDrawingSegmentType
          }
          
          const newSegments = [...appState.currentArrowSegments, newSegment]
          
          updateAppState({
            currentArrowSegments: newSegments,
            currentDrawingSegmentType: appState.selectedArrowType // 次回用に更新
          })
        }
      }
    } else if (appState.selectedTool === 'text') {
      // テキスト追加 - 空欄で開始し、即座に編集モードに入る
      const newTextElement: TextElement = {
        id: crypto.randomUUID(),
        x: adjustedPos.x,
        y: adjustedPos.y,
        text: '', // 空欄で開始
        fontSize: appState.selectedFontSize,
        fontFamily: appState.selectedFontFamily,
        color: appState.selectedColor
      }

      onUpdatePlay({
        texts: [...play.texts, newTextElement]
      })

      // 即座に編集モードに入る
      updateAppState({
        isEditingText: true,
        editingTextId: newTextElement.id,
        selectedText: '', // 空欄で編集開始
        selectedElementIds: [newTextElement.id]
      })
    }
  }

  const handlePlayerDragMove = (playerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    // グループ移動中の場合、他のプレイヤーもリアルタイムで移動
    if (appState.selectedElementIds.includes(playerId) && appState.selectedElementIds.length > 1) {
      const draggedPlayer = play.players.find(p => p.id === playerId)
      if (!draggedPlayer) return

      // 移動量を計算
      const deltaX = (e.target as any).x() - draggedPlayer.x
      const deltaY = (e.target as any).y() - draggedPlayer.y

      // 他のプレイヤーのKonvaオブジェクトも移動
      const stage = e.target.getStage()
      if (stage) {
        appState.selectedElementIds.forEach(selectedId => {
          if (selectedId !== playerId) {
            const otherPlayer = play.players.find(p => p.id === selectedId)
            if (otherPlayer) {
              const konvaNode = stage.findOne(`#player-${selectedId}`)
              if (konvaNode) {
                konvaNode.x(otherPlayer.x + deltaX)
                konvaNode.y(otherPlayer.y + deltaY)
              }
            }
          }
        })
        
        // リンクされた矢印もリアルタイムで移動
        appState.selectedElementIds.forEach(selectedId => {
          play.arrows.forEach(arrow => {
            if (arrow.linkedPlayerId === selectedId) {
              const arrowGroup = stage.findOne(`#arrow-${arrow.id}`)
              if (arrowGroup) {
                const player = play.players.find(p => p.id === selectedId)
                if (player) {
                  const playerDeltaX = deltaX
                  const playerDeltaY = deltaY as number
                  
                  // 矢印の各線の点を直接更新
                  
                  // まず線の部分を更新して新しい終点を取得
                  (arrowGroup as any).getChildren().forEach((child: any) => {
                    if (child.getClassName() === 'Line' && !child.fill()) {
                      // 線の部分
                      if (!child.attrs.originalPoints) {
                        child.attrs.originalPoints = [...child.points()]
                      }
                      
                      const newPoints = []
                      for (let i = 0; i < child.attrs.originalPoints.length; i += 2) {
                        newPoints.push(child.attrs.originalPoints[i] + playerDeltaX)
                        newPoints.push(child.attrs.originalPoints[i + 1] + playerDeltaY)
                      }
                      child.points(newPoints)
                    }
                  });
                  
                  // 次に矢印の先端を新しい終点に合わせて更新
                  (arrowGroup as any).getChildren().forEach((child: any) => {
                    if (child.getClassName() === 'Line' && child.fill()) {
                      // 矢印の先端部分（fillがあるもの = 矢印の先端、T字型も含む）
                      if (!child.attrs.originalPoints) {
                        child.attrs.originalPoints = [...child.points()]
                      }
                      
                      // 元の先端の点に移動量を加算
                      const newArrowPoints = []
                      for (let i = 0; i < child.attrs.originalPoints.length; i += 2) {
                        newArrowPoints.push(child.attrs.originalPoints[i] + playerDeltaX)
                        newArrowPoints.push(child.attrs.originalPoints[i + 1] + playerDeltaY)
                      }
                      child.points(newArrowPoints)
                    }
                  })
                }
              }
            }
          })
        })
        
        stage.batchDraw()
      }
    } else {
      // 単一プレイヤー移動時もリンクされた矢印をリアルタイム更新
      const draggedPlayer = play.players.find(p => p.id === playerId)
      if (!draggedPlayer) return

      const deltaX = e.target.x() - draggedPlayer.x
      const deltaY = e.target.y() - draggedPlayer.y

      const stage = e.target.getStage()
      if (stage) {
        // このプレイヤーにリンクされた矢印を更新
        play.arrows.forEach(arrow => {
          if (arrow.linkedPlayerId === playerId) {
            const arrowGroup = stage.findOne(`#arrow-${arrow.id}`)
            if (arrowGroup) {
              // 矢印の各線の点を直接更新
              
              // まず線の部分を更新して新しい終点を取得
              (arrowGroup as any).getChildren().forEach((child: any) => {
                if (child.getClassName() === 'Line' && !child.fill()) {
                  // 線の部分
                  if (!child.attrs.originalPoints) {
                    child.attrs.originalPoints = [...child.points()]
                  }
                  
                  const newPoints = []
                  for (let i = 0; i < child.attrs.originalPoints.length; i += 2) {
                    newPoints.push(child.attrs.originalPoints[i] + deltaX)
                    newPoints.push(child.attrs.originalPoints[i + 1] + deltaY)
                  }
                  child.points(newPoints)
                }
              });
              
              // 次に矢印の先端を新しい終点に合わせて更新
              (arrowGroup as any).getChildren().forEach((child: any) => {
                if (child.getClassName() === 'Line' && child.fill()) {
                  // 矢印の先端部分（fillがあるもの = 矢印の先端、T字型も含む）
                  if (!child.attrs.originalPoints) {
                    child.attrs.originalPoints = [...child.points()]
                  }
                  
                  // 元の先端の点に移動量を加算
                  const newArrowPoints = []
                  for (let i = 0; i < child.attrs.originalPoints.length; i += 2) {
                    newArrowPoints.push(child.attrs.originalPoints[i] + deltaX)
                    newArrowPoints.push(child.attrs.originalPoints[i + 1] + deltaY)
                  }
                  child.points(newArrowPoints)
                }
              })
            }
          }
        })
        stage.batchDraw()
      }
    }
  }

  const handlePlayerDragEnd = (playerId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const draggedPlayer = play.players.find(p => p.id === playerId)
    if (!draggedPlayer) return

    // 移動量を計算
    const deltaX = e.target.x() - draggedPlayer.x
    const deltaY = e.target.y() - draggedPlayer.y

    let newPlayers: Player[]
    
    // 選択されているプレイヤーがドラッグされた場合、全て一緒に移動
    if (appState.selectedElementIds.includes(playerId) && appState.selectedElementIds.length > 1) {
      // まず主導プレーヤーのスナップ調整量を計算
      const draggedNewX = draggedPlayer.x + deltaX
      const draggedNewY = draggedPlayer.y + deltaY
      const draggedSnapped = getSnappedPosition(draggedNewX, draggedNewY, draggedPlayer.team)
      
      // スナップによる調整量を計算
      const snapDeltaX = draggedSnapped.x - draggedNewX
      const snapDeltaY = draggedSnapped.y - draggedNewY
      
      debugLog(appState, `🎯 グループ移動: 元移動量(${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`)
      debugLog(appState, `🎯 グループ移動: スナップ調整量(${snapDeltaX.toFixed(1)}, ${snapDeltaY.toFixed(1)})`)
      
      newPlayers = play.players.map(player => {
        if (appState.selectedElementIds.includes(player.id)) {
          // 全プレーヤーに同じ移動量とスナップ調整を適用
          const newX = player.x + deltaX + snapDeltaX
          const newY = player.y + deltaY + snapDeltaY
          
          // 全プレーヤーに配置制限を適用
          const constrained = constrainPlayerPosition(newX, newY, player.team, player.size)
          
          debugLog(appState, `🎯 グループ移動: ${player.id} (${player.team}) ${newX.toFixed(1)},${newY.toFixed(1)} → ${constrained.x.toFixed(1)},${constrained.y.toFixed(1)}`)
          
          return { ...player, x: constrained.x, y: constrained.y }
        }
        return player
      })
      
      // 重要: Konvaオブジェクトの座標を状態に同期させる
      const stage = e.target.getStage()
      if (stage) {
        appState.selectedElementIds.forEach(selectedId => {
          const updatedPlayer = newPlayers.find(p => p.id === selectedId)
          if (updatedPlayer) {
            const playerNode = stage.findOne(`#player-${selectedId}`)
            if (playerNode) {
              debugLog(appState, `🔄 Konva同期: ${selectedId} → (${updatedPlayer.x.toFixed(1)}, ${updatedPlayer.y.toFixed(1)})`)
              playerNode.x(updatedPlayer.x)
              playerNode.y(updatedPlayer.y)
            }
          }
        })
      }
      
      // グループ移動時も各プレイヤーのリンクされた矢印を更新
      const allNewArrows = play.arrows.map(arrow => {
        if (arrow.linkedPlayerId && appState.selectedElementIds.includes(arrow.linkedPlayerId)) {
          const updatedPlayer = newPlayers.find(p => p.id === arrow.linkedPlayerId)
          const originalPlayer = play.players.find(p => p.id === arrow.linkedPlayerId)
          
          if (updatedPlayer && originalPlayer && arrow.points.length >= 2) {
            const playerDeltaX = updatedPlayer.x - originalPlayer.x
            const playerDeltaY = updatedPlayer.y - originalPlayer.y
            
            // 全ての点を移動量だけシフト
            const newPoints = []
            for (let i = 0; i < arrow.points.length; i += 2) {
              newPoints.push(arrow.points[i] + playerDeltaX)     // x座標
              newPoints.push(arrow.points[i + 1] + playerDeltaY) // y座標
            }
            
            // 開始点を正確なプレイヤー位置に修正（スナップずれ対策）
            newPoints[0] = updatedPlayer.x
            newPoints[1] = updatedPlayer.y
            
            // セグメントがある場合はセグメントも同時に更新
            let newSegments = arrow.segments
            if (arrow.segments && arrow.segments.length > 0) {
              newSegments = arrow.segments.map((segment, segmentIndex) => {
                const updatedSegmentPoints = []
                for (let i = 0; i < segment.points.length; i += 2) {
                  updatedSegmentPoints.push(segment.points[i] + playerDeltaX)     // x座標
                  updatedSegmentPoints.push(segment.points[i + 1] + playerDeltaY) // y座標
                }
                
                // 最初のセグメントの開始点も正確なプレイヤー位置に修正
                if (segmentIndex === 0 && updatedSegmentPoints.length >= 2) {
                  updatedSegmentPoints[0] = updatedPlayer.x
                  updatedSegmentPoints[1] = updatedPlayer.y
                }
                
                return { ...segment, points: updatedSegmentPoints }
              })
            }
            
            return { ...arrow, points: newPoints, segments: newSegments }
          }
        }
        return arrow
      })
      
      onUpdatePlay({ 
        players: newPlayers,
        arrows: allNewArrows
      })
      
      // ドラッグ終了後に矢印の一時的な点記録をリセット（グループ移動）
      if (stage) {
        appState.selectedElementIds.forEach(selectedId => {
          play.arrows.forEach(arrow => {
            if (arrow.linkedPlayerId === selectedId) {
              const arrowGroup = stage.findOne(`#arrow-${arrow.id}`)
              if (arrowGroup) {
                // 各線の一時的な記録を削除
                (arrowGroup as any).getChildren().forEach((child: any) => {
                  if (child.getClassName() === 'Line' && child.attrs.originalPoints) {
                    delete child.attrs.originalPoints
                  }
                })
              }
            }
          })
        })
      }
      
      return // 早期リターンでシングル移動処理をスキップ
    } else {
      // 単一プレイヤーの移動（制限→スナップの順序で処理）
      const draggedPlayer = play.players.find(p => p.id === playerId)
      const draggedX = e.target.x()
      const draggedY = e.target.y()
      
      debugLog(appState, `🎯 handlePlayerDragEnd: プレーヤー ${playerId} (${draggedPlayer?.team})`)
      debugLog(appState, `🎯 handlePlayerDragEnd: ドラッグ終了座標 (${draggedX.toFixed(1)}, ${draggedY.toFixed(1)})`)
      
      // まず配置制限を適用
      const constrained = constrainPlayerPosition(draggedX, draggedY, draggedPlayer?.team || 'offense', draggedPlayer?.size || 20)
      debugLog(appState, `🎯 handlePlayerDragEnd: 制限適用後 (${constrained.x.toFixed(1)}, ${constrained.y.toFixed(1)})`)
      
      // 制限された座標をKonvaオブジェクトに反映
      e.target.x(constrained.x)
      e.target.y(constrained.y)
      
      // 次にスナップ機能を適用
      const snapped = getSnappedPosition(constrained.x, constrained.y, draggedPlayer?.team)
      debugLog(appState, `🎯 handlePlayerDragEnd: スナップ適用後 (${snapped.x.toFixed(1)}, ${snapped.y.toFixed(1)})`)
      
      newPlayers = play.players.map(player => {
        if (player.id === playerId) {
          // 制限・スナップ済みの座標を使用
          return { ...player, x: snapped.x, y: snapped.y }
        }
        return player
      })
    }

    // リンクされた矢印を更新
    const newArrows = play.arrows.map(arrow => {
      if (arrow.linkedPlayerId === playerId) {
        // リンクされた矢印の開始点を正確なプレイヤー位置に固定
        const updatedPlayer = newPlayers.find(p => p.id === playerId)
        const originalPlayer = play.players.find(p => p.id === playerId)
        
        if (updatedPlayer && originalPlayer && arrow.points.length >= 2) {
          const playerDeltaX = updatedPlayer.x - originalPlayer.x
          const playerDeltaY = updatedPlayer.y - originalPlayer.y
          
          // 全ての点を移動量だけシフト
          const newPoints = []
          for (let i = 0; i < arrow.points.length; i += 2) {
            newPoints.push(arrow.points[i] + playerDeltaX)     // x座標
            newPoints.push(arrow.points[i + 1] + playerDeltaY) // y座標
          }
          
          // 開始点を正確なプレイヤー位置に修正（スナップずれ対策）
          newPoints[0] = updatedPlayer.x
          newPoints[1] = updatedPlayer.y
          
          console.log(`🎯 矢印 ${arrow.id} の始点をプレイヤー ${playerId} の位置に修正: (${updatedPlayer.x}, ${updatedPlayer.y})`)
          
          // セグメントがある場合はセグメントも同時に更新
          let newSegments = arrow.segments
          if (arrow.segments && arrow.segments.length > 0) {
            newSegments = arrow.segments.map((segment, segmentIndex) => {
              const updatedSegmentPoints = []
              for (let i = 0; i < segment.points.length; i += 2) {
                updatedSegmentPoints.push(segment.points[i] + playerDeltaX)     // x座標
                updatedSegmentPoints.push(segment.points[i + 1] + playerDeltaY) // y座標
              }
              
              // 最初のセグメントの開始点も正確なプレイヤー位置に修正
              if (segmentIndex === 0 && updatedSegmentPoints.length >= 2) {
                updatedSegmentPoints[0] = updatedPlayer.x
                updatedSegmentPoints[1] = updatedPlayer.y
                console.log(`🎯 セグメント0の始点もプレイヤー位置に修正: (${updatedPlayer.x}, ${updatedPlayer.y})`)
              }
              
              return { ...segment, points: updatedSegmentPoints }
            })
          }
          
          return { ...arrow, points: newPoints, segments: newSegments }
        }
      }
      return arrow
    })

    onUpdatePlay({ 
      players: newPlayers,
      arrows: newArrows
    })
    
    // ドラッグ終了後にプレイヤーオブジェクトの位置をリセット（データが更新されたため）
    e.target.position({ x: newPlayers.find(p => p.id === playerId)?.x || 0, y: newPlayers.find(p => p.id === playerId)?.y || 0 })
    
    // ドラッグ終了後に矢印の一時的な点記録をリセット
    const stage = e.target.getStage()
    if (stage) {
      play.arrows.forEach(arrow => {
        if (arrow.linkedPlayerId === playerId) {
          const arrowGroup = stage.findOne(`#arrow-${arrow.id}`)
          if (arrowGroup) {
            // 各線の一時的な記録を削除
            (arrowGroup as any).getChildren().forEach((child: any) => {
              if (child.getClassName() === 'Line' && child.attrs.originalPoints) {
                delete child.attrs.originalPoints
              }
            })
          }
        }
      })
    }
  }

  // 統一プレビュー計算関数: 信頼できる開始点を取得
  const calculatePreviewStartPoint = (): { x: number, y: number } => {
    // セグメントがある場合: 最後のセグメントの終点から開始
    if (appState.currentArrowSegments.length > 0) {
      const lastSegment = appState.currentArrowSegments[appState.currentArrowSegments.length - 1]
      if (lastSegment.points.length >= 4) {
        return {
          x: lastSegment.points[lastSegment.points.length - 2],
          y: lastSegment.points[lastSegment.points.length - 1]
        }
      }
    }
    
    // セグメントがない場合: currentArrowPointsの最後の点から開始
    if (appState.currentArrowPoints.length >= 2) {
      return {
        x: appState.currentArrowPoints[appState.currentArrowPoints.length - 2],
        y: appState.currentArrowPoints[appState.currentArrowPoints.length - 1]
      }
    }
    
    // フォールバック: 最初の点
    return {
      x: appState.currentArrowPoints[0] || 0,
      y: appState.currentArrowPoints[1] || 0
    }
  }

  // 座標を直接受け取るように修正（重複座標変換を排除）
  const handleMouseMove = (adjustedPos?: { x: number, y: number }) => {
    if (appState.selectedTool === 'arrow' && appState.isDrawingArrow) {
      // 座標が渡されていない場合のみ座標変換を実行（後方互換性）
      let mousePos = adjustedPos
      if (!mousePos) {
        const stage = stageRef.current
        if (!stage) return

        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const transform = stage.getAbsoluteTransform().copy().invert()
        const pos = transform.point(pointer)
        
        mousePos = {
          x: pos.x - 50,
          y: pos.y - 50
        }
      }

      // 統一された開始点を取得
      const startPoint = calculatePreviewStartPoint()
      
      // プレビュー用の座標を作成（開始点からマウス位置まで）
      const previewPoints = [startPoint.x, startPoint.y, mousePos.x, mousePos.y]
      
      // リンクされたプレイヤーがある場合、始点を最新の位置に更新
      if (appState.linkedPlayerId && appState.currentArrowSegments.length === 0) {
        const linkedPlayer = play.players.find(p => p.id === appState.linkedPlayerId)
        if (linkedPlayer) {
          previewPoints[0] = linkedPlayer.x
          previewPoints[1] = linkedPlayer.y
        }
      }
      
      updateAppState({
        currentArrowPreviewPoints: previewPoints
      })
      
      // デバッグモード時の詳細ログ
      if (appState.debugMode) {
        console.log('🎯 統一プレビュー更新:', {
          セグメント数: appState.currentArrowSegments.length,
          開始点: `(${startPoint.x.toFixed(1)}, ${startPoint.y.toFixed(1)})`,
          マウス位置: `(${mousePos.x.toFixed(1)}, ${mousePos.y.toFixed(1)})`,
          プレビュー配列: previewPoints.map(p => p.toFixed(1)).join(', '),
          座標ソース: adjustedPos ? '外部渡し' : '内部計算'
        })
      }
    }
  }

  const renderArrow = (arrow: Arrow, isPreview = false) => {
    const isSelected = appState.selectedElementIds.includes(arrow.id)
    
    // セグメントがある場合はセグメント単位で描画、ない場合は従来通り
    if (arrow.segments && arrow.segments.length > 0) {
      return renderArrowWithSegments(arrow, isSelected, isPreview)
    }
    
    // 従来の単一タイプ矢印の描画
    return renderSingleArrow(arrow, isSelected, isPreview)
  }

  const renderArrowWithSegments = (arrow: Arrow, isSelected: boolean, isPreview: boolean) => {
    const points = arrow.points
    if (points.length < 4) return null

    // 🎨 レンダリングで使用するデータをログ出力（デバッグモード時のみ）
    if (appState.debugMode && !isPreview) {
      console.log(`🎨 renderArrowWithSegments: ${arrow.id}`, {
        points: points,
        segmentCount: arrow.segments?.length || 0,
        isSelected: isSelected,
        segments: arrow.segments?.map((seg, i) => `セグメント${i}[${seg.type}]: ${seg.points}`) || []
      })
    }

    // セグメントがある場合は、最後のセグメントから矢印の先端と角度を計算
    let endX, endY, startX, startY
    
    if (arrow.segments && arrow.segments.length > 0) {
      const lastSegment = arrow.segments[arrow.segments.length - 1]
      if (lastSegment.points.length >= 4) {
        // ジグザグ線の場合は変換後のポイントから終点を取得
        if (lastSegment.type === 'zigzag') {
          const zigzagPoints = getZigzagPoints(lastSegment.points)
          if (zigzagPoints.length >= 4) {
            endX = zigzagPoints[zigzagPoints.length - 2]
            endY = zigzagPoints[zigzagPoints.length - 1]
            // 線の向きを正確に取得するため、ジグザグ変換後の直前の点を使用
            if (zigzagPoints.length >= 6) {
              startX = zigzagPoints[zigzagPoints.length - 4]
              startY = zigzagPoints[zigzagPoints.length - 3]
            } else {
              startX = zigzagPoints[0]
              startY = zigzagPoints[1]
            }
          } else {
            // フォールバック：元のポイントを使用
            endX = lastSegment.points[lastSegment.points.length - 2]
            endY = lastSegment.points[lastSegment.points.length - 1]
            startX = lastSegment.points[lastSegment.points.length - 4] || lastSegment.points[0]
            startY = lastSegment.points[lastSegment.points.length - 3] || lastSegment.points[1]
          }
        } else {
          // ジグザグ線以外は従来通り
          endX = lastSegment.points[lastSegment.points.length - 2]
          endY = lastSegment.points[lastSegment.points.length - 1]
          
          // 線の向きを正確に取得するため、終点の直前の点を使用
          if (lastSegment.points.length >= 6) {
            // セグメント内に複数点がある場合は、セグメント内の直前の点
            startX = lastSegment.points[lastSegment.points.length - 4]
            startY = lastSegment.points[lastSegment.points.length - 3]
          } else {
            // セグメント内に2点のみの場合は、前のセグメントの終点または全体から取得
            if (points.length >= 6) {
              startX = points[points.length - 4]
              startY = points[points.length - 3]
            } else {
              startX = lastSegment.points[0]
              startY = lastSegment.points[1]
            }
          }
        }
      } else {
        // セグメントが無効な場合は全体のpointsから計算
        endX = points[points.length - 2]
        endY = points[points.length - 1]
        startX = points.length >= 6 ? points[points.length - 4] : points[0]
        startY = points.length >= 6 ? points[points.length - 3] : points[1]
      }
    } else {
      // セグメントがない場合は従来通り
      endX = points[points.length - 2]
      endY = points[points.length - 1]
      startX = points.length >= 6 ? points[points.length - 4] : points[0]
      startY = points.length >= 6 ? points[points.length - 3] : points[1]
    }

    const deltaX = endX - startX
    const deltaY = endY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance < 5) return null
    
    const angle = Math.atan2(deltaY, deltaX)
    const headLength = 15
    const headAngle = Math.PI / 6

    // 矢印の先端位置を線の向きに合わせて調整
    // 線の終点から矢印の長さ分だけ延長した位置を矢印の先端にする
    const arrowTipX = endX + headLength * 0.7 * Math.cos(angle)
    const arrowTipY = endY + headLength * 0.7 * Math.sin(angle)

    // 矢印の先端を描画
    const arrowHeadPoints = []
    if (arrow.headType === 'normal') {
      arrowHeadPoints.push(
        arrowTipX - headLength * Math.cos(angle - headAngle),
        arrowTipY - headLength * Math.sin(angle - headAngle),
        arrowTipX,
        arrowTipY,
        arrowTipX - headLength * Math.cos(angle + headAngle),
        arrowTipY - headLength * Math.sin(angle + headAngle)
      )
    } else if (arrow.headType === 't-shaped') {
      // T字型も線の終点位置で配置（矢印の先端延長は不要）
      arrowHeadPoints.push(
        endX - headLength * Math.cos(angle + Math.PI/2),
        endY - headLength * Math.sin(angle + Math.PI/2),
        endX + headLength * Math.cos(angle + Math.PI/2),
        endY + headLength * Math.sin(angle + Math.PI/2)
      )
    }

    let strokeStyle = arrow.color
    let strokeWidth = arrow.strokeWidth

    if (isSelected && !isPreview) {
      strokeStyle = '#2563eb'
      strokeWidth = arrow.strokeWidth + 1
    }

    const groupProps = {
      key: isPreview ? `preview-group-${arrow.id}` : `arrow-group-${arrow.id}`,
      id: `arrow-${arrow.id}`,
      // 選択ツール使用時は矢印をドラッグ可能にする（選択状態に関係なく）
      draggable: !isPreview && appState.selectedTool === 'select',
      onClick: !isPreview ? (e: any) => handleArrowClick(arrow.id, e) : undefined,
      onDblClick: !isPreview ? () => handleArrowDoubleClick(arrow.id) : undefined,
      onDragStart: !isPreview ? (e: any) => handleArrowDragStart(arrow.id, e) : undefined,
      onDragMove: !isPreview ? () => handleArrowDragMove() : undefined,
      onDragEnd: !isPreview ? (e: any) => handleArrowDragEnd(arrow.id, e) : undefined
    }

    return (
      <Group {...groupProps}>
        {/* セグメントごとに描画 */}
        {arrow.segments!.map((segment, index) => 
          renderSegment(segment, index, strokeStyle, strokeWidth, isPreview)
        )}
        
        {/* 矢印の先端 */}
        {arrow.headType !== 'none' && arrowHeadPoints.length > 0 && (
          <Line
            points={arrowHeadPoints}
            stroke={strokeStyle}
            strokeWidth={strokeWidth}
            fill={strokeStyle}
            closed={arrow.headType === 'normal'}
            listening={false}
          />
        )}
        
        {/* 選択された矢印の編集ハンドル（Group内で描画） */}
        {!isPreview && isSelected && appState.selectedTool === 'select' && renderArrowEditHandlesInGroup(arrow)}
      </Group>
    )
  }

  const renderSegment = (segment: ArrowSegment, index: number, strokeStyle: string, strokeWidth: number, isPreview: boolean) => {
    const { points, type } = segment
    
    // 🎨 セグメント描画で使用するデータをログ出力（デバッグモード時のみ）
    if (appState.debugMode && !isPreview) {
      console.log(`🎨 renderSegment ${index}[${type}]:`, {
        points: points,
        pointCount: points.length / 2,
        strokeStyle: strokeStyle,
        strokeWidth: strokeWidth
      })
    }
    
    let dash = undefined
    if (type === 'dashed') {
      dash = [10, 5]
    }

    // クリック判定用の太い透明な線
    const hitAreaProps = !isPreview ? {
      points: points,
      stroke: 'transparent',
      strokeWidth: Math.max(strokeWidth * 3, 12),
      tension: 0,
      listening: true,
    } : {}

    // 実際に表示される線
    const lineProps = {
      points: points,
      stroke: strokeStyle,
      strokeWidth: strokeWidth,
      dash: dash,
      tension: 0,
      listening: false
    }

    return (
      <React.Fragment key={`segment-${index}`}>
        {/* クリック判定用の透明な太い線 */}
        {!isPreview && <Line {...hitAreaProps} />}
        
        {/* 実際に表示される線 */}
        {type === 'zigzag' ? (
          <Line
            {...lineProps}
            points={getZigzagPoints(points)}
          />
        ) : (
          <Line {...lineProps} />
        )}
      </React.Fragment>
    )
  }

  const renderSingleArrow = (arrow: Arrow, isSelected: boolean, isPreview: boolean) => {
    // 矢印の先端を計算
    const points = arrow.points
    if (points.length < 4) return null

    // ジグザグ線の場合は変換後のポイントから終点を取得
    let endX, endY, startX, startY
    if (arrow.type === 'zigzag') {
      const zigzagPoints = getZigzagPoints(points)
      if (zigzagPoints.length >= 4) {
        endX = zigzagPoints[zigzagPoints.length - 2]
        endY = zigzagPoints[zigzagPoints.length - 1]
        // 角度計算用の開始点を取得
        if (zigzagPoints.length >= 6) {
          startX = zigzagPoints[zigzagPoints.length - 4]
          startY = zigzagPoints[zigzagPoints.length - 3]
        } else {
          startX = zigzagPoints[0]
          startY = zigzagPoints[1]
        }
      } else {
        // フォールバック：元のポイントを使用
        endX = points[points.length - 2]
        endY = points[points.length - 1]
        startX = points.length >= 6 ? points[points.length - 4] : points[0]
        startY = points.length >= 6 ? points[points.length - 3] : points[1]
      }
    } else {
      // ジグザグ線以外は従来通り
      endX = points[points.length - 2]
      endY = points[points.length - 1]
      
      // 角度計算用の開始点を取得
      if (points.length >= 6) {
        // 複数点がある場合は、最後から2番目の点を使用
        startX = points[points.length - 4]
        startY = points[points.length - 3]
      } else {
        // 2点のみの場合は最初の点を使用
        startX = points[0]
        startY = points[1]
      }
    }

    // 矢印の角度を計算（始点から終点への方向）
    const deltaX = endX - startX
    const deltaY = endY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // 距離が短すぎる場合は矢印を描画しない（閾値を小さく調整）
    if (distance < 5) return null
    
    const angle = Math.atan2(deltaY, deltaX)
    const headLength = 15
    const headAngle = Math.PI / 6

    // 矢印の先端位置を線の向きに合わせて調整
    // 線の終点から矢印の長さ分だけ延長した位置を矢印の先端にする
    const arrowTipX = endX + headLength * 0.7 * Math.cos(angle)
    const arrowTipY = endY + headLength * 0.7 * Math.sin(angle)

    const arrowHeadPoints = []
    if (arrow.headType === 'normal') {
      // 通常の矢印（V字型）
      arrowHeadPoints.push(
        arrowTipX - headLength * Math.cos(angle - headAngle),
        arrowTipY - headLength * Math.sin(angle - headAngle),
        arrowTipX,
        arrowTipY,
        arrowTipX - headLength * Math.cos(angle + headAngle),
        arrowTipY - headLength * Math.sin(angle + headAngle)
      )
    } else if (arrow.headType === 't-shaped') {
      // T字型の矢印（線の終点位置で配置）
      arrowHeadPoints.push(
        endX - headLength * Math.cos(angle + Math.PI/2),
        endY - headLength * Math.sin(angle + Math.PI/2),
        endX + headLength * Math.cos(angle + Math.PI/2),
        endY + headLength * Math.sin(angle + Math.PI/2)
      )
    }

    let strokeStyle = arrow.color
    let strokeWidth = arrow.strokeWidth
    let dash = undefined

    if (isSelected && !isPreview) {
      strokeStyle = '#2563eb'
      strokeWidth = arrow.strokeWidth + 1
    }

    if (arrow.type === 'dashed') {
      dash = [10, 5]
    }

    // デバッグ用：クリック判定領域を可視化するかどうか
    const showHitArea = false // 開発時はtrueに変更してテスト可能

    // クリック判定用の太い透明な線のプロパティ
    const hitAreaProps = {
      points: points,
      stroke: showHitArea ? 'rgba(255, 0, 0, 0.3)' : 'transparent', // デバッグ時は赤色で表示
      strokeWidth: Math.max(strokeWidth * 3, 12), // 最低12px、または実際の線の3倍の太さ
      tension: 0,
      listening: true, // この線でクリック判定を行う
      // ホバー効果
      onMouseEnter: !isPreview ? (e: any) => {
        if (appState.selectedTool === 'select') {
          const target = e.target as any
          const stage = target.getStage()
          if (stage && stage.container()) {
            stage.container().style.cursor = 'pointer'
          }
        }
      } : undefined,
      onMouseLeave: !isPreview ? (e: any) => {
        const target = e.target as any
        const stage = target.getStage()
        if (stage && stage.container()) {
          stage.container().style.cursor = 'default'
        }
      } : undefined
    }

    // 実際に表示される線のプロパティ
    const lineProps = {
      points: points,
      stroke: strokeStyle,
      strokeWidth: strokeWidth,
      dash: dash,
      tension: 0,
      listening: false // 描画のみ、イベントは受け取らない
    }

    const groupProps = {
      key: isPreview ? `preview-group-${arrow.id}` : `arrow-group-${arrow.id}`,
      id: `arrow-${arrow.id}`, // Konvaオブジェクトの識別用ID
      // 選択ツール使用時は矢印をドラッグ可能にする（選択状態に関係なく）
      draggable: !isPreview && appState.selectedTool === 'select',
      onClick: !isPreview ? (e: any) => handleArrowClick(arrow.id, e) : undefined,
      onDblClick: !isPreview ? () => handleArrowDoubleClick(arrow.id) : undefined,
      onDragStart: !isPreview ? (e: any) => handleArrowDragStart(arrow.id, e) : undefined,
      onDragMove: !isPreview ? () => handleArrowDragMove() : undefined,
      onDragEnd: !isPreview ? (e: any) => handleArrowDragEnd(arrow.id, e) : undefined
    }

    return (
      <Group {...groupProps}>
        {/* クリック判定用の透明な太い線 */}
        {!isPreview && (
          <>
            {arrow.type === 'zigzag' ? (
              <Line
                {...hitAreaProps}
                points={getZigzagPoints(points)}
              />
            ) : (
              <Line {...hitAreaProps} />
            )}
          </>
        )}
        
        {/* 実際に表示される線 */}
        {arrow.type === 'zigzag' ? (
          <Line
            {...lineProps}
            points={getZigzagPoints(points)}
          />
        ) : (
          <Line {...lineProps} />
        )}
        
        {/* 矢印の先端 */}
        {arrow.headType !== 'none' && arrowHeadPoints.length > 0 && (
          <Line
            points={arrowHeadPoints}
            stroke={strokeStyle}
            strokeWidth={strokeWidth}
            fill={strokeStyle}
            closed={arrow.headType === 'normal'}
            listening={false} // Groupレベルでイベントを処理するため
          />
        )}
        
        {/* 選択された矢印の編集ハンドル（Group内で描画） */}
        {!isPreview && isSelected && appState.selectedTool === 'select' && renderArrowEditHandlesInGroup(arrow)}
      </Group>
    )
  }

  const getZigzagPoints = (points: number[]) => {
    if (points.length < 4) return points
    
    const zigzagPoints = []
    const zigzagHeight = 8 // ジグザグの高さ
    const zigzagWidth = 12 // ジグザグの幅（一つの山の幅）
    
    // 複数点を順次処理
    for (let pointIndex = 0; pointIndex < points.length - 2; pointIndex += 2) {
      const x1 = points[pointIndex]
      const y1 = points[pointIndex + 1]
      const x2 = points[pointIndex + 2]
      const y2 = points[pointIndex + 3]
      
      // 線分の長さと角度を計算
      const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      const lineAngle = Math.atan2(y2 - y1, x2 - x1)
      
      // 垂直方向の単位ベクトル
      const perpAngle = lineAngle + Math.PI / 2
      const perpX = Math.cos(perpAngle)
      const perpY = Math.sin(perpAngle)
      
      // 開始点を追加（最初のセグメントのみ）
      if (pointIndex === 0) {
        zigzagPoints.push(x1, y1)
      }
      
      // ジグザグのパターンを作成
      let currentDistance = 0
      let isUp = true // 上向きから開始
      
      // 終点に向けてジグザグパターンを計算（終点前で調整）
      const endMargin = zigzagWidth * 0.5 // 終点手前での調整距離
      const adjustedLength = Math.max(lineLength - endMargin, zigzagWidth)
      
      while (currentDistance < adjustedLength) {
        // 次の山または谷までの距離
        const nextDistance = Math.min(currentDistance + zigzagWidth, adjustedLength)
        
        // 線分上の位置を計算
        const t = nextDistance / lineLength
        const baseX = x1 + (x2 - x1) * t
        const baseY = y1 + (y2 - y1) * t
        
        // ジグザグの高さを適用
        const offsetHeight = isUp ? zigzagHeight : -zigzagHeight
        const zigzagX = baseX + perpX * offsetHeight
        const zigzagY = baseY + perpY * offsetHeight
        
        zigzagPoints.push(zigzagX, zigzagY)
        
        // 上下を切り替え
        isUp = !isUp
        currentDistance = nextDistance
      }
      
      // 最後のセグメントの場合、終点へスムーズに接続
      if (pointIndex === points.length - 4) {
        // 最後のジグザグ点から終点への直線を追加
        zigzagPoints.push(x2, y2)
      }
    }
    
    return zigzagPoints
  }

  const handleArrowClick = (arrowId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    
    if (appState.selectedTool === 'select') {
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey
      
      if (isMultiSelect) {
        const currentSelected = appState.selectedElementIds
        const isAlreadySelected = currentSelected.includes(arrowId)
        
        if (isAlreadySelected) {
          updateAppState({
            selectedElementIds: currentSelected.filter(id => id !== arrowId)
          })
        } else {
          updateAppState({
            selectedElementIds: [...currentSelected, arrowId]
          })
        }
      } else {
        updateAppState({
          selectedElementIds: [arrowId]
        })
      }
    }
  }

  const handleArrowDoubleClick = (arrowId: string) => {
    // ダブルクリックで矢印を削除
    const newArrows = play.arrows.filter(a => a.id !== arrowId)
    onUpdatePlay({ arrows: newArrows })
    updateAppState({
      selectedElementIds: appState.selectedElementIds.filter(id => id !== arrowId)
    })
  }

  const handleArrowDragStart = useCallback((arrowId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    // ドラッグ開始時の位置を記録
    arrowDragStartRef.current[arrowId] = {
      x: e.target.x(),
      y: e.target.y()
    }
  }, [])

  const handleArrowDragMove = useCallback(() => {
    // ドラッグ中はGroup Transformのみで視覚的な移動を表現
    // state更新はしない（累積加算問題を回避）
    // 実際のデータ更新はhandleArrowDragEndで行う
  }, [])

  const handleArrowDragEnd = (arrowId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const draggedArrow = play.arrows.find(a => a.id === arrowId)
    if (!draggedArrow) return

    // ドラッグ開始位置から移動量を計算
    const startPos = arrowDragStartRef.current[arrowId]
    if (!startPos) return

    const deltaX = e.target.x() - startPos.x
    const deltaY = e.target.y() - startPos.y

    // 矢印のすべての点を移動
    const newPoints: number[] = []
    for (let i = 0; i < draggedArrow.points.length; i += 2) {
      newPoints.push(draggedArrow.points[i] + deltaX)
      newPoints.push(draggedArrow.points[i + 1] + deltaY)
    }

    // セグメントがある場合はセグメントも同時に更新
    let newSegments = draggedArrow.segments
    if (draggedArrow.segments && draggedArrow.segments.length > 0) {
      newSegments = draggedArrow.segments.map(segment => {
        const updatedSegmentPoints = []
        for (let i = 0; i < segment.points.length; i += 2) {
          updatedSegmentPoints.push(segment.points[i] + deltaX)
          updatedSegmentPoints.push(segment.points[i + 1] + deltaY)
        }
        return {
          ...segment,
          points: updatedSegmentPoints
        }
      })
      console.log(`矢印 ${arrowId} のセグメントも更新: ${newSegments.length}個`)
    }

    const newArrows = play.arrows.map(arrow => 
      arrow.id === arrowId 
        ? { ...arrow, points: newPoints, segments: newSegments }
        : arrow
    )
    onUpdatePlay({ arrows: newArrows })

    // ドラッグ後にGroupの位置をリセット（データが更新されたため）
    e.target.position({ x: 0, y: 0 })
    
    // ドラッグ開始位置をクリーンアップ
    delete arrowDragStartRef.current[arrowId]
  }

  // 矢印編集ハンドルをレンダリング（Group内用、座標補正なし）
  const renderArrowEditHandlesInGroup = (arrow: Arrow) => {
    const handles = []
    
    // 全体のpoints配列から全ての点を表示（マルチセグメント対応）
    for (let i = 0; i < arrow.points.length; i += 2) {
      const x = arrow.points[i]
      const y = arrow.points[i + 1]
      const pointIndex = i / 2 // 点のインデックス（0, 1, 2...）
      
      // セグメントがある場合、どのセグメントに属するかを特定
      let segmentInfo = null
      if (arrow.segments && arrow.segments.length > 0) {
        let currentPointIndex = 0
        for (let segmentIndex = 0; segmentIndex < arrow.segments.length; segmentIndex++) {
          const segment = arrow.segments[segmentIndex]
          const segmentPointCount = segment.points.length / 2
          
          if (segmentIndex === 0) {
            // 最初のセグメントは全ての点を含む
            if (pointIndex < segmentPointCount) {
              segmentInfo = {
                segmentIndex: segmentIndex,
                pointIndexInSegment: pointIndex * 2
              }
              break
            }
          } else {
            // 2番目以降のセグメントは最初の点を除く
            if (pointIndex === currentPointIndex) {
              // この点は前のセグメントの終点と同じなので前のセグメントに帰属
              segmentInfo = {
                segmentIndex: segmentIndex - 1,
                pointIndexInSegment: arrow.segments[segmentIndex - 1].points.length - 2
              }
              break
            } else if (pointIndex < currentPointIndex + segmentPointCount - 1) {
              // このセグメントの中間点
              const pointInSegment = pointIndex - currentPointIndex + 1
              segmentInfo = {
                segmentIndex: segmentIndex,
                pointIndexInSegment: pointInSegment * 2
              }
              break
            } else if (pointIndex === currentPointIndex + segmentPointCount - 1) {
              // このセグメントの終点
              segmentInfo = {
                segmentIndex: segmentIndex,
                pointIndexInSegment: segment.points.length - 2
              }
              break
            }
            currentPointIndex++
          }
        }
      }
      
      handles.push({
        x: x, // Group内なので座標補正不要
        y: y, // Group内なので座標補正不要
        overallPointIndex: i, // 全体のpoints配列での位置
        pointIndex: pointIndex,
        segmentInfo: segmentInfo,
        type: i === 0 ? 'start' : i === arrow.points.length - 2 ? 'end' : 'middle'
      })
    }

    return handles.map((handle, index) => (
      <Circle
        key={`handle-${arrow.id}-${index}`}
        x={handle.x}
        y={handle.y}
        radius={6}
        fill={handle.type === 'start' ? '#22c55e' : handle.type === 'end' ? '#ef4444' : '#3b82f6'}
        stroke="#ffffff"
        strokeWidth={2}
        draggable={true}
        listening={true}
        onClick={(e) => {
          e.cancelBubble = true
          e.evt.stopPropagation()
        }}
        onDragStart={(e) => {
          e.cancelBubble = true
          e.evt.stopPropagation()
        }}
        onDragMove={(e) => {
          e.cancelBubble = true
          e.evt.stopPropagation()
          
          const newX = e.target.x()
          const newY = e.target.y()
          
          // リアルタイム更新を実行
          handleEditHandleDragMove(arrow.id, handle, newX, newY)
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true
          e.evt.stopPropagation()
          
          const newX = e.target.x()
          const newY = e.target.y()
          
          // 矢印の更新
          handleEditHandleDragEnd(arrow.id, handle, newX, newY)
        }}
      />
    ))
  }



  // 編集ハンドルのリアルタイムドラッグ処理（軽量版）
  const handleEditHandleDragMove = useCallback((arrowId: string, handle: any, newX: number, newY: number) => {
    // パフォーマンス最適化: 60FPS制限（約16.67ms間隔）
    const now = performance.now()
    if (now - lastDragUpdateRef.current < 16.67) {
      return // 更新スキップ
    }
    lastDragUpdateRef.current = now
    
    // リアルタイム更新のため、詳細ログは省略（パフォーマンス重視）
    const targetArrow = play.arrows.find(a => a.id === arrowId)
    if (!targetArrow) return

    // 全体のpoints配列を直接更新
    const newPoints = [...targetArrow.points]
    newPoints[handle.overallPointIndex] = newX
    newPoints[handle.overallPointIndex + 1] = newY
    
    // セグメントがある場合はセグメントも同期更新（簡略版）
    let newSegments = targetArrow.segments
    if (targetArrow.segments && targetArrow.segments.length > 0) {
      newSegments = targetArrow.segments.map((segment, segmentIndex) => {
        const newSegmentPoints = [...segment.points]
        let pointUpdated = false
        
        // handle.segmentInfoを活用してセグメント内位置を特定
        if (handle.segmentInfo && handle.segmentInfo.segmentIndex === segmentIndex) {
          const segmentPointIndex = handle.segmentInfo.pointIndexInSegment
          if (segmentPointIndex < newSegmentPoints.length - 1) {
            newSegmentPoints[segmentPointIndex] = newX
            newSegmentPoints[segmentPointIndex + 1] = newY
            pointUpdated = true
          }
        }
        
        // 中間点の場合、セグメント境界の共有点も更新（簡略版）
        if (!pointUpdated && handle.type === 'middle') {
          const originalX = targetArrow.points[handle.overallPointIndex]
          const originalY = targetArrow.points[handle.overallPointIndex + 1]
          
          for (let i = 0; i < newSegmentPoints.length; i += 2) {
            const tolerance = 0.1
            if (Math.abs(newSegmentPoints[i] - originalX) < tolerance && 
                Math.abs(newSegmentPoints[i + 1] - originalY) < tolerance) {
              newSegmentPoints[i] = newX
              newSegmentPoints[i + 1] = newY
              pointUpdated = true
              break
            }
          }
        }
        
        return { ...segment, points: newSegmentPoints }
      })
    }
    
    // 矢印を更新（リアルタイム版）
    const newArrows = play.arrows.map(arrow => 
      arrow.id === arrowId 
        ? { ...arrow, points: newPoints, segments: newSegments }
        : arrow
    )

    // リアルタイム更新を実行
    onUpdatePlay({ arrows: newArrows })
  }, [play?.arrows, onUpdatePlay])

  // 編集ハンドルのドラッグ処理
  const handleEditHandleDragEnd = (arrowId: string, handle: any, newX: number, newY: number) => {
    console.group(`🎯 ハンドルドラッグ処理開始: ${arrowId}`)
    console.log('📌 ドラッグ対象:', {
      pointIndex: handle.pointIndex,
      type: handle.type,
      overallPointIndex: handle.overallPointIndex,
      segmentInfo: handle.segmentInfo,
      oldPosition: `(${handle.x}, ${handle.y})`,
      newPosition: `(${newX.toFixed(1)}, ${newY.toFixed(1)})`
    })
    
    const targetArrow = play.arrows.find(a => a.id === arrowId)
    if (!targetArrow) {
      console.error('❌ 対象矢印が見つかりません:', arrowId)
      console.groupEnd()
      return
    }

    console.log('📊 更新前の矢印データ:')
    console.log('  arrow.points:', targetArrow.points)
    if (targetArrow.segments) {
      console.log('  segments:', targetArrow.segments.map((seg, i) => `セグメント${i}: ${seg.points}`))
    }

    // 全体のpoints配列を直接更新
    const newPoints = [...targetArrow.points]
    const oldX = newPoints[handle.overallPointIndex]
    const oldY = newPoints[handle.overallPointIndex + 1]
    newPoints[handle.overallPointIndex] = newX
    newPoints[handle.overallPointIndex + 1] = newY
    
    console.log(`🔄 arrow.points更新: 点${handle.pointIndex} (${oldX}, ${oldY}) → (${newX}, ${newY})`)
    
    // セグメントがある場合はセグメントも同期更新
    let newSegments = targetArrow.segments
    if (targetArrow.segments && targetArrow.segments.length > 0) {
      console.log('🔧 セグメント更新開始:', {
        segmentCount: targetArrow.segments.length,
        handleSegmentInfo: handle.segmentInfo,
        pointIndex: handle.pointIndex
      })
      
      newSegments = targetArrow.segments.map((segment, segmentIndex) => {
        const newSegmentPoints = [...segment.points]
        let pointUpdated = false
        
        // handle.segmentInfoを活用してセグメント内位置を特定
        if (handle.segmentInfo && handle.segmentInfo.segmentIndex === segmentIndex) {
          // 対象セグメント内で直接インデックスベース更新
          const segmentPointIndex = handle.segmentInfo.pointIndexInSegment
          if (segmentPointIndex < newSegmentPoints.length - 1) {
            console.log(`📍 セグメント${segmentIndex}の点${segmentPointIndex/2}を更新: (${newSegmentPoints[segmentPointIndex]}, ${newSegmentPoints[segmentPointIndex + 1]}) → (${newX}, ${newY})`)
            newSegmentPoints[segmentPointIndex] = newX
            newSegmentPoints[segmentPointIndex + 1] = newY
            pointUpdated = true
          }
        } else {
          // segmentInfoがない場合のフォールバック: 全体points配列との対応を確認
          let globalPointOffset = 0
          for (let i = 0; i < segmentIndex; i++) {
            if (targetArrow.segments && targetArrow.segments[i]) {
              globalPointOffset += Math.max(0, (targetArrow.segments[i].points.length / 2) - 1)
            }
          }
          
          const segmentStartPointIndex = globalPointOffset
          const segmentEndPointIndex = segmentStartPointIndex + (segment.points.length / 2) - 1
          
          if (handle.pointIndex >= segmentStartPointIndex && handle.pointIndex <= segmentEndPointIndex) {
            const localPointIndex = (handle.pointIndex - segmentStartPointIndex) * 2
            if (localPointIndex < newSegmentPoints.length - 1) {
              console.log(`📍 フォールバック: セグメント${segmentIndex}の点${localPointIndex/2}を更新`)
              newSegmentPoints[localPointIndex] = newX
              newSegmentPoints[localPointIndex + 1] = newY
              pointUpdated = true
            }
          }
        }
        
        // 中間点の場合、セグメント境界の共有点も更新
        if (!pointUpdated && handle.type === 'middle') {
          // 元の座標を使ってセグメント内の一致する点を検索
          const originalX = targetArrow.points[handle.overallPointIndex]
          const originalY = targetArrow.points[handle.overallPointIndex + 1]
          
          for (let i = 0; i < newSegmentPoints.length; i += 2) {
            const tolerance = 0.1 // 浮動小数点の誤差を考慮
            if (Math.abs(newSegmentPoints[i] - originalX) < tolerance && 
                Math.abs(newSegmentPoints[i + 1] - originalY) < tolerance) {
              console.log(`🔗 セグメント${segmentIndex}の共有点${i/2}を更新 (座標一致): (${originalX.toFixed(1)}, ${originalY.toFixed(1)}) → (${newX}, ${newY})`)
              newSegmentPoints[i] = newX
              newSegmentPoints[i + 1] = newY
              pointUpdated = true
              break
            }
          }
        }
        
        if (pointUpdated) {
          console.log(`✅ セグメント${segmentIndex}更新成功`)
        } else {
          console.log(`⚠️ セグメント${segmentIndex}は対象外`)
        }
        
        return { ...segment, points: newSegmentPoints }
      })
      
      console.log('🔧 セグメント更新完了')
    }
    
    // 矢印を更新
    const newArrows = play.arrows.map(arrow => 
      arrow.id === arrowId 
        ? { ...arrow, points: newPoints, segments: newSegments }
        : arrow
    )

    console.log('📊 更新後の矢印データ:')
    console.log('  新しいarrow.points:', newPoints)
    if (newSegments) {
      console.log('  新しいsegments:', newSegments.map((seg, i) => `セグメント${i}: ${seg.points}`))
    }

    console.log('🔄 矢印配列更新実行:', {
      arrowId,
      pointIndex: handle.pointIndex,
      newPosition: `(${newX}, ${newY})`,
      hasSegments: !!newSegments,
      segmentUpdateCount: newSegments ? newSegments.length : 0,
      totalArrows: newArrows.length
    })

    // 重要：onUpdatePlayを呼び出してReactの状態を更新
    console.log('📤 onUpdatePlay呼び出し中...')
    onUpdatePlay({ arrows: newArrows })
    console.log('✅ onUpdatePlay完了')
    
    // 選択状態を保持（ハンドルドラッグ後も矢印が選択された状態を維持）
    if (!appState.selectedElementIds.includes(arrowId)) {
      console.log('⚠️ 選択状態が失われたため復元:', arrowId)
      updateAppState({
        selectedElementIds: [...appState.selectedElementIds, arrowId]
      })
    } else {
      console.log('✅ 選択状態は保持されています')
    }
    
    console.groupEnd()
  }

  const renderText = (textElement: TextElement) => {
    const isSelected = appState.selectedElementIds.includes(textElement.id)
    const isEditing = appState.isEditingText && appState.editingTextId === textElement.id
    
    // テキストの実際のサイズを測定（再利用可能なインスタンスを使用してパフォーマンス向上）
    const measureText = getTextMeasurer()
    measureText.setAttrs({
      text: textElement.text || (isEditing ? '' : 'テキスト'),
      fontSize: textElement.fontSize,
      fontFamily: textElement.fontFamily,
      fontStyle: appState.selectedFontStyle,
      fontVariant: appState.selectedFontWeight,
    })
    
    const textWidth = measureText.width()
    const textHeight = measureText.height()
    
    // パディング設定
    const padding = 4

    return (
      <Group
        key={textElement.id}
        x={textElement.x}
        y={textElement.y}
        draggable={appState.selectedTool === 'select' && !isEditing}
        // ホバー効果のためのスタイル
        onMouseEnter={(e) => {
          if (appState.selectedTool === 'select' || appState.selectedTool === 'text') {
            // カーソルを手に変更
            const stage = e.target.getStage()
            if (stage && stage.container()) {
              stage.container().style.cursor = 'pointer'
            }
          }
        }}
        onMouseLeave={(e) => {
          // カーソルをデフォルトに戻す
          if (appState.selectedTool === 'select' || appState.selectedTool === 'text') {
            const stage = e.target.getStage()
            if (stage && stage.container()) {
              stage.container().style.cursor = 'default'
            }
          }
        }}
        onClick={(e) => handleTextClick(textElement.id, e)}
        onDblClick={() => handleTextDoubleClick(textElement.id)}
        onDragEnd={(e) => handleTextDragEnd(textElement.id, e)}
      >
        {/* 背景矩形 */}
        <Rect
          x={-padding}
          y={-padding}
          width={textWidth + padding * 2}
          height={textHeight + padding * 2}
          fill="#ffffff" // 白色背景
          stroke="#000000" // 黒色外枠
          strokeWidth={1}
          cornerRadius={2}
          shadowColor={isSelected || isEditing ? '#2563eb' : undefined}
          shadowBlur={isSelected || isEditing ? 5 : 0}
          shadowEnabled={isSelected || isEditing}
        />
        
        {/* テキスト本体 */}
        <Text
          x={0}
          y={0}
          text={textElement.text || (isEditing ? '' : 'テキスト')}
          fontSize={textElement.fontSize}
          fontFamily={textElement.fontFamily}
          fill={isEditing ? '#2563eb' : textElement.color}
          fontStyle={appState.selectedFontStyle}
          fontVariant={appState.selectedFontWeight}
        />
      </Group>
    )
  }

  const handleTextClick = (textId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    
    if (appState.selectedTool === 'select') {
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey
      
      if (isMultiSelect) {
        const currentSelected = appState.selectedElementIds
        const isAlreadySelected = currentSelected.includes(textId)
        
        if (isAlreadySelected) {
          updateAppState({
            selectedElementIds: currentSelected.filter(id => id !== textId)
          })
        } else {
          updateAppState({
            selectedElementIds: [...currentSelected, textId]
          })
        }
      } else {
        updateAppState({
          selectedElementIds: [textId]
        })
      }
    }
  }

  const handleTextDoubleClick = (textId: string) => {
    // ダブルクリックで直接編集モードに入る（ツールに関係なく）
    const textElement = play.texts.find(t => t.id === textId)
    if (textElement) {
      updateAppState({
        isEditingText: true,
        editingTextId: textId,
        selectedText: textElement.text,
        selectedFontFamily: textElement.fontFamily,
        selectedFontSize: textElement.fontSize,
        selectedColor: textElement.color,
        selectedElementIds: [textId] // 選択状態にもする
      })
    }
  }

  const handleTextDragEnd = (textId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const newTexts = play.texts.map(text => 
      text.id === textId 
        ? { ...text, x: e.target.x(), y: e.target.y() }
        : text
    )
    onUpdatePlay({ texts: newTexts })
  }

  const drawField = () => {
    const fieldWidth = play.field.width
    const fieldHeight = play.field.height
    const lineColor = play.field.lineColor
    
    // フィールドは120ヤード（エンドゾーン10ヤード + プレイングフィールド100ヤード + エンドゾーン10ヤード）
    
    const elements = []

    // フィールド背景
    elements.push(
      <Rect
        key="field-bg"
        x={0}
        y={0}
        width={fieldWidth}
        height={fieldHeight}
        fill={play.field.backgroundColor}
        stroke={lineColor}
        strokeWidth={2}
        listening={false}
      />
    )

    if (play.field.yardLines) {
      // フィールド反転状態を判定
      const flipped = isFieldFlipped()
      
      // 6本の水平線を均等に配置（フィールドを6等分）
      // 上部を削除して6本線のみ描画
      for (let i = 1; i <= 6; i++) {
        const y = (fieldHeight * i) / 6
        let strokeWidth = 2
        
        // 反転時は2番目、通常時は4番目の線を太く
        if ((flipped && i === 2) || (!flipped && i === 4)) {
          strokeWidth = 4
        }
        
        // フィールド全幅の線
        elements.push(
          <Line
            key={`yard-line-${i}`}
            points={[0, y, fieldWidth, y]}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            listening={false}
          />
        )
      }
      
      // エンドゾーンの境界線（上下端）
      elements.push(
        <Line
          key="field-boundary-top"
          points={[0, 0, fieldWidth, 0]}
          stroke={lineColor}
          strokeWidth={2}
          listening={false}
        />
      )
      elements.push(
        <Line
          key="field-boundary-bottom"
          points={[0, fieldHeight, fieldWidth, fieldHeight]}
          stroke={lineColor}
          strokeWidth={2}
          listening={false}
        />
      )
    }

    if (play.field.hashMarks) {
      // ハッシュマーク（各区間に複数配置）
      const hashLength = fieldWidth * 0.015 // 短い線
      const leftHashX = fieldWidth * 0.35   // 左ハッシュマーク位置（内側に移動）
      const rightHashX = fieldWidth * 0.65  // 右ハッシュマーク位置（内側に移動）
      
      // 各区間（8等分した各セクション）に4本ずつハッシュマークを配置
      for (let section = 0; section < 8; section++) {
        const sectionStart = (fieldHeight * section) / 8
        const sectionEnd = (fieldHeight * (section + 1)) / 8
        const sectionHeight = sectionEnd - sectionStart
        
        // 各セクション内に4本のハッシュマークを均等配置
        for (let hash = 1; hash <= 4; hash++) {
          const y = sectionStart + (sectionHeight * hash) / 5
          
          elements.push(
            <Line
              key={`hash-left-${section}-${hash}`}
              points={[leftHashX - hashLength/2, y, leftHashX + hashLength/2, y]}
              stroke={lineColor}
              strokeWidth={1}
              listening={false}
            />
          )
          elements.push(
            <Line
              key={`hash-right-${section}-${hash}`}
              points={[rightHashX - hashLength/2, y, rightHashX + hashLength/2, y]}
              stroke={lineColor}
              strokeWidth={1}
              listening={false}
            />
          )
        }
      }
    }

    return elements
  }

  const handlePlayerClick = (playerId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    
    if (appState.selectedTool === 'select') {
      // Ctrl/Cmdキーで複数選択
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey
      
      if (isMultiSelect) {
        const currentSelected = appState.selectedElementIds
        const isAlreadySelected = currentSelected.includes(playerId)
        
        if (isAlreadySelected) {
          // 選択解除
          updateAppState({
            selectedElementIds: currentSelected.filter(id => id !== playerId)
          })
        } else {
          // 追加選択
          updateAppState({
            selectedElementIds: [...currentSelected, playerId]
          })
        }
      } else {
        // 単一選択
        updateAppState({
          selectedElementIds: [playerId]
        })
      }
    } else if (appState.selectedTool === 'arrow') {
      // 矢印ツール時：プレイヤーから矢印を開始
      const player = play.players.find(p => p.id === playerId)
      if (player && !appState.isDrawingArrow) {
        updateAppState({
          isDrawingArrow: true,
          currentArrowPoints: [player.x, player.y],
          linkedPlayerId: playerId // リンクするプレイヤーIDを保存
        })
      }
    }
  }

  const handlePlayerDoubleClick = (playerId: string) => {
    const player = play.players.find(p => p.id === playerId)
    if (!player) return
    
    if (player.type === 'text') {
      // テキストプレイヤーの場合は編集モードに入る
      // 編集開始時に初期位置をキャッシュ
      const stage = stageRef.current
      if (stage && stage.container()) {
        try {
          const containerRect = stage.container().getBoundingClientRect()
          if (containerRect && containerRect.width > 0) {
            const x = (player.x + 50) + containerRect.left
            const y = (player.y + 50) + containerRect.top
            lastValidPositionRef.current = { x, y }
          }
        } catch (error) {
          // 初期位置キャッシュに失敗してもエラーは無視
        }
      }
      
      // プレイヤー情報をキャッシュ
      editingPlayerCacheRef.current = { ...player }
      
      updateAppState({
        isEditingText: true,
        editingTextId: playerId,
        selectedText: player.text || 'A',
        selectedElementIds: [playerId]
      })
    } else {
      // 他のプレイヤーはダブルクリックで削除
      const newPlayers = play.players.filter(p => p.id !== playerId)
      // リンクされた矢印も削除
      const newArrows = play.arrows.filter(a => a.linkedPlayerId !== playerId)
      
      onUpdatePlay({ 
        players: newPlayers,
        arrows: newArrows
      })
      updateAppState({
        selectedElementIds: appState.selectedElementIds.filter(id => id !== playerId)
      })
    }
  }

  // センターのドラッグ開始時のY座標を保存
  const centerDragStartY = useRef<number | null>(null)

  // センターのY座標が変更された時にrefを更新
  useEffect(() => {
    if (play?.center) {
      centerDragStartY.current = play.center.y
    }
  }, [play?.center?.y])

  const handleCenterDragStart = () => {
    if (!play?.center) return
    // ドラッグ開始時のY座標を保存
    centerDragStartY.current = play.center.y
  }

  // センター関連のハンドラー
  const handleCenterDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!play?.center) return
    
    // Y座標を正しい位置に強制的に設定
    e.target.y(centerDragStartY.current || play.center.y)
    
    // X座標のみの移動量を計算（Y座標は dragBoundFunc で制限）
    const deltaX = e.target.x() - play.center.x
    
    // 全てのプレイヤーをX方向のみ移動
    const stage = e.target.getStage()
    if (stage) {
      play.players.forEach(player => {
        const playerNode = stage.findOne(`#player-${player.id}`)
        if (playerNode) {
          playerNode.x(player.x + deltaX)
          // Y座標は変更しない
        }
      })
      
      // 全ての矢印もリアルタイムで移動
      play.arrows.forEach(arrow => {
        const arrowGroup = stage.findOne(`#arrow-${arrow.id}`)
        if (arrowGroup) {
          // 矢印の各線の点を直接更新
          
          // まず線の部分を更新
          (arrowGroup as any).getChildren().forEach((child: any) => {
            if (child.getClassName() === 'Line' && !child.fill()) {
              // 線の部分
              if (!child.attrs.originalPoints) {
                child.attrs.originalPoints = [...child.points()]
              }
              
              const newPoints = []
              for (let i = 0; i < child.attrs.originalPoints.length; i += 2) {
                newPoints.push(child.attrs.originalPoints[i] + deltaX)
                newPoints.push(child.attrs.originalPoints[i + 1]) // Y方向は移動しない
              }
              child.points(newPoints)
            }
          });
          
          // 次に矢印の先端を更新
          (arrowGroup as any).getChildren().forEach((child: any) => {
            if (child.getClassName() === 'Line' && child.fill()) {
              // 矢印の先端部分（fillがあるもの = 矢印の先端、T字型も含む）
              if (!child.attrs.originalPoints) {
                child.attrs.originalPoints = [...child.points()]
              }
              
              // 元の先端の点に移動量を加算
              const newArrowPoints = []
              for (let i = 0; i < child.attrs.originalPoints.length; i += 2) {
                newArrowPoints.push(child.attrs.originalPoints[i] + deltaX)
                newArrowPoints.push(child.attrs.originalPoints[i + 1]) // Y方向は移動しない
              }
              child.points(newArrowPoints)
            }
          })
        }
      })
      
      stage.batchDraw()
    }
  }

  const handleCenterDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!play?.center) return
    
    // X座標のみの移動量を計算
    const deltaX = e.target.x() - play.center.x
    
    // 全てのプレイヤーをX方向のみ移動
    const newPlayers = play.players.map(player => ({
      ...player,
      x: player.x + deltaX
      // Y座標は変更しない
    }))
    
    // 全ての矢印のデータも更新
    const newArrows = play.arrows.map(arrow => {
      // 矢印全体をX方向のみ移動
      const newPoints = []
      for (let i = 0; i < arrow.points.length; i += 2) {
        newPoints.push(arrow.points[i] + deltaX)     // x座標
        newPoints.push(arrow.points[i + 1])          // y座標はそのまま
      }
      
      // セグメントがある場合はセグメントも同時に更新
      let newSegments = arrow.segments
      if (arrow.segments && arrow.segments.length > 0) {
        newSegments = arrow.segments.map(segment => {
          const updatedSegmentPoints = []
          for (let i = 0; i < segment.points.length; i += 2) {
            updatedSegmentPoints.push(segment.points[i] + deltaX)     // x座標
            updatedSegmentPoints.push(segment.points[i + 1])          // y座標はそのまま
          }
          return {
            ...segment,
            points: updatedSegmentPoints
          }
        })
      }
      
      return { ...arrow, points: newPoints, segments: newSegments }
    })
    
    // センターの新しい位置（X座標のみ更新、Y座標は確実に維持）
    const newCenter = {
      x: e.target.x(),
      y: centerDragStartY.current || play.center.y // dragStartYを優先して使用
    }
    
    onUpdatePlay({
      players: newPlayers,
      arrows: newArrows,
      center: newCenter
    })
    
    // ドラッグ終了後にセンターオブジェクトの位置を正しい位置にリセット
    e.target.position({ 
      x: e.target.x(), 
      y: centerDragStartY.current || play.center.y 
    })
    
    // ドラッグ終了後に全ての矢印の一時的な記録をリセット
    const stage = e.target.getStage()
    if (stage) {
      play.arrows.forEach(arrow => {
        const arrowGroup = stage.findOne(`#arrow-${arrow.id}`)
        if (arrowGroup) {
          // 各線の一時的な記録を削除
          (arrowGroup as any).getChildren().forEach((child: any) => {
            if (child.getClassName() === 'Line' && child.attrs.originalPoints) {
              delete child.attrs.originalPoints
            }
          })
        }
      })
    }
  }

  const handleCenterClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    // センターは選択できない（固定要素として扱う）
  }

  const renderCenter = () => {
    if (!play?.center) return null
    
    // フィールド反転状態を検出
    const fieldHeight = play.field.height
    const secondLineY = (fieldHeight * 2) / 6  // 6等分の2番目
    const fourthLineY = (fieldHeight * 4) / 6  // 6等分の4番目
    const isFlipped = Math.abs(play.center.y - secondLineY) < Math.abs(play.center.y - fourthLineY)
    
    // 反転状態に応じてoffsetYを設定
    const offsetY = isFlipped ? 20 : 0  // 反転時は下端基準(20)、通常時は上端基準(0)
    
    return (
      <Rect
        key="center"
        id="center"
        x={play.center.x}
        y={play.center.y}
        width={20}
        height={20}
        offsetX={10}
        offsetY={offsetY}
        fill="#ffffff" // 白色の背景
        stroke="#000000" // 黒色の枠線
        strokeWidth={3}
        draggable={appState.selectedTool === 'select'}
        dragBoundFunc={(pos) => {
          // Y座標をドラッグ開始時の値に固定
          const fixedY = centerDragStartY.current || pos.y
          return {
            x: pos.x,
            y: fixedY
          }
        }}
        onDragStart={handleCenterDragStart}
        onDragMove={handleCenterDragMove}
        onDragEnd={handleCenterDragEnd}
        onClick={handleCenterClick}
        onMouseEnter={(e) => {
          if (appState.selectedTool === 'select') {
            const stage = e.target.getStage()
            if (stage && stage.container()) {
              stage.container().style.cursor = 'pointer'
            }
          }
        }}
        onMouseLeave={(e) => {
          if (appState.selectedTool === 'select') {
            const stage = e.target.getStage()
            if (stage && stage.container()) {
              stage.container().style.cursor = 'default'
            }
          }
        }}
      />
    )
  }

  const renderPlayer = (player: Player) => {
    const isSelected = appState.selectedElementIds.includes(player.id)
    
    const baseProps = {
      key: player.id,
      id: `player-${player.id}`, // Konvaオブジェクトの識別用ID
      x: player.x,
      y: player.y,
      draggable: appState.selectedTool === 'select',
      onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => handlePlayerDragMove(player.id, e),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handlePlayerDragEnd(player.id, e),
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handlePlayerClick(player.id, e),
      onDblClick: () => handlePlayerDoubleClick(player.id),
      onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (appState.selectedTool === 'select') {
          const stage = e.target.getStage()
          if (stage && stage.container()) {
            stage.container().style.cursor = 'pointer'
          }
        }
      },
      onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (appState.selectedTool === 'select') {
          const stage = e.target.getStage()
          if (stage && stage.container()) {
            stage.container().style.cursor = 'default'
          }
        }
      }
    }

    // 選択状態のスタイル
    const strokeColor = isSelected ? '#2563eb' : (player.strokeColor || player.color || '#000')
    const fillColor = player.fillColor === 'transparent' ? '#ffffff' : (player.fillColor || '#ffffff')
    const strokeWidth = isSelected ? 3 : 2 // デフォルト2px、選択時3px
    const shadowEnabled = isSelected
    
    switch (player.type) {
      case 'circle':
        return (
          <Circle
            {...baseProps}
            radius={player.size / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor={isSelected ? '#2563eb' : undefined}
            shadowBlur={isSelected ? 10 : 0}
            shadowEnabled={shadowEnabled}
          />
        )
      case 'triangle':
        return (
          <Group {...baseProps}>
            {/* クリック判定用の透明な大きなエリア */}
            <Circle
              radius={Math.max(player.size / 2, 15)} // 最低15pxの半径でタッチしやすく
              fill="transparent"
              stroke="transparent"
              listening={true}
            />
            {/* 実際に表示される三角形 */}
            <Line
              points={player.flipped ? [
                // 上向き三角形
                0, -player.size / 2,
                -player.size / 2, player.size / 2,
                player.size / 2, player.size / 2,
                0, -player.size / 2
              ] : [
                // 下向き三角形（デフォルト）
                0, player.size / 2,
                -player.size / 2, -player.size / 2,
                player.size / 2, -player.size / 2,
                0, player.size / 2
              ]}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              closed={true}
              shadowColor={isSelected ? '#2563eb' : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowEnabled={shadowEnabled}
              listening={false} // クリック判定は上の透明サークルが担当
            />
          </Group>
        )
      case 'square':
        return (
          <Rect
            {...baseProps}
            width={player.size}
            height={player.size}
            offsetX={player.size / 2}
            offsetY={player.size / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shadowColor={isSelected ? '#2563eb' : undefined}
            shadowBlur={isSelected ? 10 : 0}
            shadowEnabled={shadowEnabled}
          />
        )
      case 'chevron':
        return (
          <Group {...baseProps}>
            {/* クリック判定用の透明な大きなエリア */}
            <Circle
              radius={Math.max(player.size / 2, 15)} // 最低15pxの半径でタッチしやすく
              fill="transparent"
              stroke="transparent"
              listening={true}
            />
            {/* 実際に表示されるchevron */}
            <Line
              points={player.flipped ? [
                // 上向きV
                -player.size / 2, player.size / 4,
                0, -player.size / 2,
                player.size / 2, player.size / 4
              ] : [
                // 下向きV（デフォルト）
                -player.size / 2, -player.size / 4,
                0, player.size / 2,
                player.size / 2, -player.size / 4
              ]}
              fill={undefined}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              closed={false}
              shadowColor={isSelected ? '#2563eb' : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowEnabled={shadowEnabled}
              listening={false} // クリック判定は上の透明サークルが担当
            />
          </Group>
        )
      case 'text': {
        // 編集中の場合は編集中のテキストを表示、空欄なら'A'を表示
        const displayText = appState.isEditingText && appState.editingTextId === player.id
          ? (appState.selectedText || 'A') 
          : (player.text || 'A')
        
        return (
          <Group {...baseProps}>
            {/* クリック判定用の透明な大きなエリア */}
            <Circle
              radius={Math.max(player.size / 2, 15)} // 最低15pxの半径でタッチしやすく
              fill="transparent"
              stroke="transparent"
              listening={true}
            />
            {/* 実際に表示されるテキスト */}
            <Text
              text={displayText}
              fontSize={player.size * 0.8}
              fontFamily="Arial"
              fontStyle="bold"
              fill={strokeColor}
              stroke={isSelected ? '#2563eb' : undefined}
              strokeWidth={isSelected ? 1 : 0}
              shadowColor={isSelected ? '#2563eb' : undefined}
              shadowBlur={isSelected ? 5 : 0}
              shadowEnabled={shadowEnabled}
              align="center"
              verticalAlign="middle"
              offsetX={player.size / 2}
              offsetY={player.size / 2}
              listening={false} // クリック判定は上の透明サークルが担当
            />
          </Group>
        )
      }
      case 'x':
        return (
          <Group {...baseProps}>
            {/* クリック判定用の透明な大きなエリア */}
            <Circle
              radius={Math.max(player.size / 2, 15)} // 最低15pxの半径でタッチしやすく
              fill="transparent"
              stroke="transparent"
              listening={true}
            />
            {/* 実際に表示されるX */}
            <Line
              points={[
                -player.size / 2, -player.size / 2,
                player.size / 2, player.size / 2
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              shadowColor={isSelected ? '#2563eb' : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowEnabled={shadowEnabled}
              listening={false} // クリック判定は上の透明サークルが担当
            />
            <Line
              points={[
                player.size / 2, -player.size / 2,
                -player.size / 2, player.size / 2
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              shadowColor={isSelected ? '#2563eb' : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowEnabled={shadowEnabled}
              listening={false} // クリック判定は上の透明サークルが担当
            />
          </Group>
        )
      default:
        return null
    }
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    // ズーム機能を削除：スクロールイベントを無効化
    e.evt.preventDefault()
  }

  if (!play) {
    return <div className="w-full h-full flex items-center justify-center text-gray-500">プレイが読み込まれていません</div>
  }

  return (
    <div className="w-full h-full">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onDblClick={handleStageDoubleClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={handleWheel}
        draggable={false}
        scaleX={1}
        scaleY={1}
        x={0}
        y={0}
      >
        <Layer>
          {/* フィールド描画 */}
          <Group x={50} y={50}>
            {drawField()}
          </Group>
          
          {/* プレイヤー描画 */}
          <Group x={50} y={50}>
            {/* センター描画（最背面） */}
            {renderCenter()}
            {play.players.map(renderPlayer)}
          </Group>
          
          {/* 矢印描画 */}
          <Group x={50} y={50}>
            {play.arrows.map(arrow => renderArrow(arrow))}
            
            {/* 選択された矢印の編集ハンドル（Group内で描画に変更） */}
            
            {/* 描画中の矢印プレビュー */}
            {appState.isDrawingArrow && (
              <>
                {/* 確定済みのセグメントを表示 */}
                {appState.currentArrowSegments.length > 0 && appState.currentArrowSegments.map((segment, index) => (
                  renderArrow({
                    id: `preview-segment-${index}`,
                    points: segment.points,
                    type: segment.type,
                    headType: 'none', // 確定部分には矢印を付けない
                    color: appState.selectedColor,
                    strokeWidth: appState.selectedStrokeWidth
                  }, true)
                ))}
                
                {/* 統一されたプレビュー線: 最後の確定点からマウス位置まで */}
                {appState.currentArrowPreviewPoints.length >= 4 && (() => {
                  // 種類変更があった場合は色を変えて視覚的フィードバック
                  const hasTypeChange = appState.selectedArrowType !== appState.currentDrawingSegmentType
                  const previewColor = hasTypeChange ? '#ff6b6b' : appState.selectedColor
                  
                  // 統一計算関数を使用してプレビュー線を取得
                  const previewPoints = appState.currentArrowPreviewPoints
                  const startX = previewPoints[0]
                  const startY = previewPoints[1]
                  const mouseX = previewPoints[2]
                  const mouseY = previewPoints[3]
                  
                  // デバッグモード時のログ出力
                  if (appState.debugMode) {
                    console.log('🔍 簡素化プレビュー線:', {
                      セグメント数: appState.currentArrowSegments.length,
                      開始点: `(${startX.toFixed(1)}, ${startY.toFixed(1)})`,
                      マウス位置: `(${mouseX.toFixed(1)}, ${mouseY.toFixed(1)})`,
                      プレビュー配列: previewPoints.map(p => p.toFixed(1)).join(', ')
                    })
                  }
                  
                  return (
                    <>
                      {renderArrow({
                        id: 'preview-current-line',
                        points: previewPoints,
                        type: appState.currentDrawingSegmentType,
                        headType: appState.selectedArrowHead,
                        color: previewColor,
                        strokeWidth: appState.selectedStrokeWidth
                      }, true)}
                      
                      {/* デバッグモード時: プレビュー線の開始点・終点マーカー */}
                      {appState.debugMode && (
                        <>
                          {/* 開始点マーカー (緑) */}
                          <Circle
                            x={startX}
                            y={startY}
                            radius={6}
                            fill="#22c55e"
                            stroke="#16a34a"
                            strokeWidth={2}
                            listening={false}
                          />
                          {/* 終点マーカー (青) */}
                          <Circle
                            x={mouseX}
                            y={mouseY}
                            radius={6}
                            fill="#3b82f6"
                            stroke="#1d4ed8"
                            strokeWidth={2}
                            listening={false}
                          />
                        </>
                      )}
                    </>
                  )
                })()}
                
                {/* セグメント境界マーカー */}
                {appState.currentArrowSegments.map((segment, index) => {
                  if (segment.points.length >= 4) {
                    const endX = segment.points[segment.points.length - 2]
                    const endY = segment.points[segment.points.length - 1]
                    return (
                      <Circle
                        key={`segment-marker-${index}`}
                        x={endX}
                        y={endY}
                        radius={4}
                        fill="#ffeb3b"
                        stroke="#f57c00"
                        strokeWidth={2}
                        listening={false}
                      />
                    )
                  }
                  return null
                })}
              </>
            )}
          </Group>
          
          {/* テキスト描画 */}
          <Group x={50} y={50}>
            {play.texts.map(renderText)}
          </Group>


          {/* 範囲選択矩形 */}
          {appState.isRangeSelecting && appState.rangeSelectStart && appState.rangeSelectEnd && (
            <Group x={50} y={50}>
              <Rect
                x={Math.min(appState.rangeSelectStart.x, appState.rangeSelectEnd.x)}
                y={Math.min(appState.rangeSelectStart.y, appState.rangeSelectEnd.y)}
                width={Math.abs(appState.rangeSelectEnd.x - appState.rangeSelectStart.x)}
                height={Math.abs(appState.rangeSelectEnd.y - appState.rangeSelectStart.y)}
                stroke="#2563eb"
                strokeWidth={1}
                dash={[4, 4]}
                fill="rgba(37, 99, 235, 0.1)"
                listening={false}
              />
            </Group>
          )}
        </Layer>
      </Stage>
      
      {/* 直接編集用のオーバーレイテキストボックス */}
      {appState.isEditingText && appState.editingTextId && (() => {
        // 再帰レンダリング防止
        if (isRenderingOverlayRef.current) {
          return null
        }
        
        isRenderingOverlayRef.current = true
        
        try {
          // テキストプレイヤーかチェック
          let player = play.players.find(p => p.id === appState.editingTextId)
          const editingText = play.texts.find(t => t.id === appState.editingTextId)
          
          // プレイヤーが見つからない場合、キャッシュから取得
          if (!player && editingPlayerCacheRef.current && editingPlayerCacheRef.current.id === appState.editingTextId) {
            player = editingPlayerCacheRef.current
          }
          
          const isTextPlayer = player && player.type === 'text'
          const displayElement = isTextPlayer ? player : editingText
          
          // より寛容な条件: キャッシュも含めて対象が見つかれば表示
          if (!player && !editingText) {
            return null
          }

          // 位置を取得、失敗した場合は固定位置を使用
          let position = getTextScreenPosition()
          
          if (!position && lastValidPositionRef.current) {
            position = lastValidPositionRef.current
          }
          
          // それでもpositionがない場合は画面中央に固定表示
          if (!position) {
            position = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
          }

          return (
            <textarea
              ref={textInputRef}
              value={appState.selectedText}
              maxLength={isTextPlayer ? 2 : undefined}
              onChange={(e) => {
                const newValue = isTextPlayer ? e.target.value.slice(0, 2) : e.target.value
                updateAppState({ selectedText: newValue })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (isTextPlayer && !appState.selectedText.trim()) {
                    // テキストプレイヤーで空の場合はデフォルトに戻して終了
                    const newPlayers = play.players.map(p => 
                      p.id === appState.editingTextId 
                        ? { ...p, text: 'A' }
                        : p
                    )
                    onUpdatePlay({ players: newPlayers })
                    updateAppState({ 
                      isEditingText: false, 
                      editingTextId: null,
                      selectedElementIds: []
                    })
                  } else {
                    saveDirectTextEdit()
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  cancelDirectTextEdit()
                }
              }}
              style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                fontSize: isTextPlayer ? `${20 * 0.8}px` : `${(displayElement as any).fontSize}px`,
                fontFamily: isTextPlayer ? 'Arial' : (displayElement as any).fontFamily,
                color: isTextPlayer ? player?.strokeColor || '#000' : (displayElement as any).color,
                background: '#ffffff',
                border: '2px solid #2563eb',
                borderRadius: '4px',
                padding: '4px 8px',
                zIndex: 1000,
                resize: 'none',
                minWidth: '100px',
                minHeight: '30px',
                outline: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              autoFocus
            />
          )
        } finally {
          isRenderingOverlayRef.current = false
        }
      })()}
    </div>
  )
})

FootballCanvas.displayName = 'FootballCanvas'

export default FootballCanvas