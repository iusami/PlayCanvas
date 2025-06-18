import React, { useState, useEffect, useRef } from 'react'
import { Play, AppState, PlayMetadata, Playlist, FormationTemplate, Player, FIELD_CONSTRAINTS, TextBoxEntry } from './types'

// メッセージの型定義
type MessageType = 'success' | 'error' | 'info'
interface Message {
  text: string
  type: MessageType
}
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CanvasArea, { CanvasAreaRef } from './components/CanvasArea'
import TextBoxPanel from './components/TextBoxPanel'
import PlayMetadataForm from './components/PlayMetadataForm'
import PlayLibrary from './components/PlayLibrary'
import PlaylistWorkspace from './components/PlaylistWorkspace'
import { PlayStorage, PlaylistStorage, FormationStorage } from './utils/storage'
import { AutoBackupScheduler } from './utils/autoBackupScheduler'

const initialAppState: AppState = {
  currentPlay: null,
  selectedTool: 'select',
  selectedPlayerType: 'circle',
  selectedPlayerPosition: '',
  selectedTeam: 'offense',
  selectedArrowType: 'straight',
  selectedArrowHead: 'normal',
  selectedStrokeWidth: 2,
  selectedColor: '#000000',
  selectedFillColor: '#ffffff', // デフォルトは白色
  selectedStrokeColor: '#000000', // デフォルトは黒い枠線
  selectedElementIds: [],
  isDrawingArrow: false,
  currentArrowPoints: [],
  currentArrowPreviewPoints: [],
  currentArrowSegments: [],
  currentDrawingSegmentType: 'straight',
  initialArrowType: 'straight',
  maxSegments: 10, // 固定で10セグメントまで
  segmentLimitWarning: null,
  debugMode: false, // デバッグモードは初期無効
  // テキスト関連
  selectedFontFamily: 'Arial',
  selectedFontSize: 16,
  selectedFontWeight: 'normal',
  selectedFontStyle: 'normal',
  selectedText: 'テキスト',
  isEditingText: false,
  editingTextId: null,
  // 中央線スナップ機能
  snapToObjects: true,
  snapTolerance: 15,
  // 範囲選択機能
  isRangeSelecting: false,
  rangeSelectStart: null,
  rangeSelectEnd: null,
  // Undo/Redo機能
  history: [],
  historyIndex: -1,
  maxHistorySize: 50
}

const App: React.FC = () => {
  const canvasAreaRef = useRef<CanvasAreaRef>(null)
  const [appState, setAppState] = useState<AppState>(initialAppState)
  const [plays, setPlays] = useState<Play[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [formations, setFormations] = useState<FormationTemplate[]>([])
  const [isMetadataFormOpen, setIsMetadataFormOpen] = useState(false)
  const [isPlayLibraryOpen, setIsPlayLibraryOpen] = useState(false)
  const [isPlaylistWorkspaceOpen, setIsPlaylistWorkspaceOpen] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // 初期化時にプレイ、プレイリスト、フォーメーションを読み込み + 自動バックアップ開始
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedPlays = await PlayStorage.getAllPlays()
        const savedPlaylists = await PlaylistStorage.getAllPlaylists()
        // デフォルトフォーメーションを初期化
        await FormationStorage.initializeDefaultFormations()
        const savedFormations = await FormationStorage.getAllFormations()
        
        setPlays(savedPlays)
        setPlaylists(savedPlaylists)
        setFormations(savedFormations)

        // 自動バックアップスケジューラーを開始
        AutoBackupScheduler.start()
        
        // 通知許可をリクエスト（ユーザーが許可するかは任意）
        AutoBackupScheduler.requestNotificationPermission()
      } catch (error) {
        console.error('データの初期化に失敗しました:', error)
        // エラーが発生した場合も空のデータで初期化を継続
        setPlays([])
        setPlaylists([])
        setFormations([])
      }
    }
    loadData()

    // クリーンアップ関数でスケジューラーを停止
    return () => {
      AutoBackupScheduler.stop()
    }
  }, [])

  // 現在のプレイの自動保存（一時的に無効化してテスト）
  useEffect(() => {
    // 自動保存機能
    if (appState.currentPlay) {
      setIsSaving(true)
      
      // デバウンス: 1秒後に自動保存
      const timeoutId = setTimeout(async () => {
        // 最新のappStateを参照するためにcallback形式を使用
        const autoSave = async () => {
          setAppState(currentAppState => {
            if (!currentAppState.currentPlay) {
              setIsSaving(false)
              return currentAppState
            }
            
            // async処理は外部で実行
            (async () => {
              try {
                if (currentAppState.currentPlay) {
                  await PlayStorage.savePlay(currentAppState.currentPlay)
                  // プレイリストを更新
                  const savedPlays = await PlayStorage.getAllPlays()
                  setPlays(savedPlays)
                  setLastSavedAt(new Date())
                  console.log(`プレイ "${currentAppState.currentPlay.metadata.title}" を自動保存しました`)
                }
              } catch (error) {
                console.error('自動保存に失敗しました:', error)
                showMessage('自動保存に失敗しました', 'error')
              } finally {
                setIsSaving(false)
              }
            })()
            
            return currentAppState // 状態は変更しない
          })
        }
        autoSave()
      }, 1000)

      return () => {
        clearTimeout(timeoutId)
        setIsSaving(false)
      }
    }
  }, [appState.currentPlay])

  // ページ離脱時の最終保存
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (appState.currentPlay) {
        try {
          await PlayStorage.savePlay(appState.currentPlay)
          console.log('ページ離脱時に最終保存を実行しました')
        } catch (error) {
          console.error('最終保存に失敗しました:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [appState.currentPlay])

  const updateAppState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }))
  }

  // 履歴に現在のプレイを追加（currentPlayは変更しない）
  const addToHistory = (play: Play) => {
    
    setAppState(prev => {
      
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(play))) // Deep copy
      
      // 履歴サイズを制限
      if (newHistory.length > prev.maxHistorySize) {
        newHistory.shift()
      }
      
      // currentPlayはそのまま維持する
      const newState = {
        ...prev,
        history: newHistory.length > prev.maxHistorySize ? newHistory : newHistory,
        historyIndex: newHistory.length > prev.maxHistorySize ? newHistory.length - 1 : newHistory.length - 1
        // currentPlayは意図的に変更しない
      }
      return newState
    })
  }

  // Undo機能
  const undo = () => {
    if (appState.historyIndex > 0) {
      const previousPlay = appState.history[appState.historyIndex - 1]
      updateAppState({
        currentPlay: JSON.parse(JSON.stringify(previousPlay)), // Deep copy
        historyIndex: appState.historyIndex - 1
      })
    }
  }

  // Redo機能
  const redo = () => {
    if (appState.historyIndex < appState.history.length - 1) {
      const nextPlay = appState.history[appState.historyIndex + 1]
      updateAppState({
        currentPlay: JSON.parse(JSON.stringify(nextPlay)), // Deep copy
        historyIndex: appState.historyIndex + 1
      })
    }
  }

  const showMessage = (text: string, type: MessageType = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // 空のテキストボックス配列を生成する関数
  const createEmptyTextBoxEntries = (): TextBoxEntry[] => {
    return Array.from({ length: 10 }, () => ({
      id: crypto.randomUUID(),
      shortText: '',
      longText: ''
    }))
  }

  const createNewPlay = () => {
    const fieldWidth = 800
    const fieldHeight = 600
    // 太い線（上から5番目）の位置を計算
    const centerLineY = (fieldHeight * 5) / 8
    
    const newPlay: Play = {
      id: crypto.randomUUID(),
      metadata: {
        title: '新しいプレイ',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        playName: '',
        offFormation: '',
        defFormation: '',
        playType: 'offense'
      },
      field: {
        width: fieldWidth,
        height: fieldHeight,
        backgroundColor: '#4F7942',
        lineColor: '#FFFFFF',
        yardLines: true,
        hashMarks: true
      },
      players: [],
      arrows: [],
      texts: [],
      center: { x: fieldWidth / 2, y: centerLineY }, // センターを太い線上に配置
      textBoxEntries: createEmptyTextBoxEntries() // 空のテキストボックス10行を初期化
    }
    
    setPlays(prev => [...prev, newPlay])
    updateAppState({ 
      currentPlay: newPlay,
      history: [JSON.parse(JSON.stringify(newPlay))], // 初期状態を履歴に追加
      historyIndex: 0
    })
  }

  const updateCurrentPlay = (updates: Partial<Play>) => {
    if (!appState.currentPlay) return
    
    // updateCurrentPlay実行
    
    // 履歴に現在の状態を追加（変更前の状態を保存）
    addToHistory(appState.currentPlay)
    
    const updatedPlay = {
      ...appState.currentPlay,
      ...updates,
      metadata: {
        ...appState.currentPlay.metadata,
        ...(updates.metadata || {}),
        updatedAt: new Date()
      }
    }
    
    updateAppState({ currentPlay: updatedPlay })
  }

  const saveCurrentPlay = async () => {
    if (!appState.currentPlay) return
    
    try {
      await PlayStorage.savePlay(appState.currentPlay)
      
      // プレイリストを更新
      const savedPlays = await PlayStorage.getAllPlays()
      setPlays(savedPlays)
      
      showMessage('プレイが保存されました', 'success')
    } catch (error) {
      showMessage('保存に失敗しました', 'error')
    }
  }

  const saveAsNewPlay = async () => {
    if (!appState.currentPlay) return
    
    const newPlay: Play = {
      ...appState.currentPlay,
      id: crypto.randomUUID(),
      metadata: {
        ...appState.currentPlay.metadata,
        title: `${appState.currentPlay.metadata.title} (コピー)`,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      textBoxEntries: appState.currentPlay.textBoxEntries || createEmptyTextBoxEntries() // 既存のテキストボックスまたは空配列
    }
    
    try {
      await PlayStorage.savePlay(newPlay)
      
      // プレイリストを更新
      const savedPlays = await PlayStorage.getAllPlays()
      setPlays(savedPlays)
      updateAppState({ currentPlay: newPlay })
      
      showMessage('新しいプレイとして保存されました', 'success')
    } catch (error) {
      showMessage('保存に失敗しました', 'error')
    }
  }

  const duplicateCurrentPlay = () => {
    if (!appState.currentPlay) return
    duplicatePlay(appState.currentPlay.id)
  }

  const duplicatePlay = async (playId: string) => {
    const duplicatedPlay = await PlayStorage.duplicatePlay(playId)
    if (duplicatedPlay) {
      const savedPlays = await PlayStorage.getAllPlays()
      setPlays(savedPlays)
      updateAppState({ currentPlay: duplicatedPlay })
      showMessage('プレイが複製されました', 'success')
    } else {
      showMessage('複製に失敗しました', 'error')
    }
  }

  const handleMetadataSave = (metadata: Partial<PlayMetadata>) => {
    if (!appState.currentPlay) return
    
    const updatedMetadata = {
      ...appState.currentPlay.metadata,
      ...metadata
    }
    
    updateCurrentPlay({ metadata: updatedMetadata })
    setIsMetadataFormOpen(false)
    showMessage('プレイ情報が更新されました', 'success')
  }

  const selectPlay = (play: Play) => {
    // 古いプレイでtextBoxEntriesが存在しない場合は初期化
    const playWithTextBoxes = {
      ...play,
      textBoxEntries: play.textBoxEntries || createEmptyTextBoxEntries()
    }
    
    updateAppState({ 
      currentPlay: playWithTextBoxes,
      history: [JSON.parse(JSON.stringify(playWithTextBoxes))], // 選択されたプレイを履歴に追加
      historyIndex: 0
    })
  }

  const deletePlay = async (playId: string) => {
    try {
      await PlayStorage.deletePlay(playId)
      
      // プレイリストを更新
      const savedPlays = await PlayStorage.getAllPlays()
      setPlays(savedPlays)
      
      // 削除されたプレイが現在選択中の場合、選択を解除
      if (appState.currentPlay?.id === playId) {
        updateAppState({ currentPlay: null })
      }
      
      // プレイリストからも削除されたプレイを除去
      const updatedPlaylists = playlists.map(playlist => ({
        ...playlist,
        playIds: playlist.playIds.filter(id => id !== playId),
        updatedAt: new Date()
      }))
      for (const playlist of updatedPlaylists) {
        if (playlist.playIds.length !== playlists.find(p => p.id === playlist.id)?.playIds.length) {
          await PlaylistStorage.savePlaylist(playlist)
        }
      }
      const savedPlaylists = await PlaylistStorage.getAllPlaylists()
      setPlaylists(savedPlaylists)
      
      showMessage('プレイが削除されました', 'success')
    } catch (error) {
      showMessage('削除に失敗しました', 'error')
    }
  }

  // プレイリスト管理関数
  const createPlaylist = async (playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPlaylist: Playlist = {
        ...playlistData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await PlaylistStorage.savePlaylist(newPlaylist)
      const savedPlaylists = await PlaylistStorage.getAllPlaylists()
      setPlaylists(savedPlaylists)
      
      showMessage('プレイリストが作成されました', 'success')
    } catch (error) {
      showMessage('プレイリストの作成に失敗しました', 'error')
    }
  }

  const updatePlaylist = async (playlist: Playlist) => {
    try {
      await PlaylistStorage.savePlaylist(playlist)
      const savedPlaylists = await PlaylistStorage.getAllPlaylists()
      setPlaylists(savedPlaylists)
      
      showMessage('プレイリストが更新されました', 'success')
    } catch (error) {
      showMessage('プレイリストの更新に失敗しました', 'error')
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    try {
      await PlaylistStorage.deletePlaylist(playlistId)
      const savedPlaylists = await PlaylistStorage.getAllPlaylists()
      setPlaylists(savedPlaylists)
      
      showMessage('プレイリストが削除されました', 'success')
    } catch (error) {
      showMessage('プレイリストの削除に失敗しました', 'error')
    }
  }

  // エクスポート機能
  const handleExportImage = () => {
    if (canvasAreaRef.current) {
      canvasAreaRef.current.exportAsImage()
      showMessage('画像をダウンロードしました', 'success')
    }
  }

  const handlePrint = () => {
    if (canvasAreaRef.current) {
      canvasAreaRef.current.print()
      showMessage('印刷プレビューを開きました', 'info')
    }
  }

  // プレーヤー配置制限関連の関数
  const getCenterLineY = (fieldHeight: number) => {
    return (fieldHeight * 5) / 8
  }

  const isFieldFlipped = (center: { x: number; y: number } | undefined, fieldHeight: number) => {
    if (!center) return false
    
    const thirdLineY = (fieldHeight * 3) / 8 - 20
    const fifthLineY = (fieldHeight * 5) / 8 + 2
    
    return Math.abs(center.y - thirdLineY) < Math.abs(center.y - fifthLineY)
  }

  const constrainPlayerPosition = (
    x: number, 
    y: number, 
    team: 'offense' | 'defense', 
    fieldWidth: number, 
    fieldHeight: number, 
    center: { x: number; y: number } | undefined,
    playerSize: number = 20
  ) => {
    const flipped = isFieldFlipped(center, fieldHeight)
    // 反転時は実際の中央線位置（center.y）を使用、通常時は固定値を使用
    const centerLineY = flipped && center ? center.y : getCenterLineY(fieldHeight)
    const halfSize = playerSize / 2
    
    // オフセット距離設定（中央線から少し離した位置）
    const offenseSnapOffset = 15 // オフェンス用の距離（中央線より下に）
    const defenseSnapOffset = 15 // ディフェンス用の距離（中央線より上に）
    
    const constrainedX = Math.max(halfSize, Math.min(fieldWidth - halfSize, x))
    
    let constrainedY = y
    
    if (flipped) {
      if (team === 'offense') {
        // 反転時オフェンスは中央線より少し下まで（フィールドの上半分）
        const maxY = centerLineY + 10 // 205 + 10 = 215px
        constrainedY = Math.max(halfSize, Math.min(maxY, y))
      } else {
        // 反転時ディフェンスは定数で定義された最小Y座標以上（フィールドの下半分）
        const minY = FIELD_CONSTRAINTS.DEFENSE_MIN_Y_FLIPPED
        constrainedY = Math.max(minY, Math.min(fieldHeight - halfSize, y))
      }
    } else {
      if (team === 'offense') {
        // 通常時オフェンスは中央線より少し下から
        const minY = centerLineY + offenseSnapOffset
        constrainedY = Math.max(minY, Math.min(fieldHeight - halfSize, y))
      } else {
        // 通常時ディフェンスは中央線より少し上まで
        const maxY = centerLineY - defenseSnapOffset
        constrainedY = Math.max(halfSize, Math.min(maxY, y))
      }
    }
    
    return { x: constrainedX, y: constrainedY }
  }

  // フォーメーション関連機能
  const applyFormation = (formation: FormationTemplate) => {
    if (!appState.currentPlay) return

    // 履歴に現在の状態を追加
    addToHistory(appState.currentPlay)

    // 選択されたタイプ（オフェンス・ディフェンス）のプレイヤーを削除
    const otherTeamPlayers = appState.currentPlay.players.filter(p => p.team !== formation.type)
    
    // フォーメーションのプレイヤーを新しいIDで追加（配置制限を適用）
    const newPlayers: Player[] = formation.players.map(player => {
      const constrained = constrainPlayerPosition(
        player.x,
        player.y,
        player.team,
        appState.currentPlay!.field.width,
        appState.currentPlay!.field.height,
        appState.currentPlay!.center,
        player.size
      )
      
      return {
        ...player,
        id: crypto.randomUUID(),
        x: constrained.x,
        y: constrained.y
      }
    })

    const updatedPlay = {
      ...appState.currentPlay,
      players: [...otherTeamPlayers, ...newPlayers],
      center: formation.center ? { ...formation.center } : appState.currentPlay.center, // センターの位置も適用
      metadata: {
        ...appState.currentPlay.metadata,
        updatedAt: new Date()
      }
    }

    updateAppState({ 
      currentPlay: updatedPlay,
      selectedElementIds: [] // 選択解除
    })
    setPlays(prev => prev.map(play => 
      play.id === updatedPlay.id ? updatedPlay : play
    ))

    showMessage(`${formation.name}フォーメーションを適用しました`, 'info')
  }

  const saveFormationTemplate = async (name: string, description: string, type: 'offense' | 'defense') => {
    if (!appState.currentPlay) return

    // 指定されたチームのプレイヤーのみを取得
    const teamPlayers = appState.currentPlay.players.filter(p => p.team === type)
    
    if (teamPlayers.length === 0) {
      showMessage(`${type === 'offense' ? 'オフェンス' : 'ディフェンス'}のプレイヤーがありません`, 'error')
      return
    }

    const newFormation: FormationTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      type,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      players: teamPlayers.map(({ id, ...player }) => ({ ...player })), // idを除く
      center: appState.currentPlay.center ? { ...appState.currentPlay.center } : undefined, // センターの位置も保存
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      await FormationStorage.saveFormation(newFormation)
      const updatedFormations = await FormationStorage.getAllFormations()
      setFormations(updatedFormations)
      showMessage('フォーメーションテンプレートを保存しました', 'success')
    } catch (error) {
      showMessage('テンプレートの保存に失敗しました', 'error')
    }
  }

  const deleteFormationTemplate = async (formationId: string) => {
    try {
      await FormationStorage.deleteFormation(formationId)
      const updatedFormations = await FormationStorage.getAllFormations()
      setFormations(updatedFormations)
      showMessage('フォーメーションテンプレートを削除しました', 'success')
    } catch (error) {
      showMessage('テンプレートの削除に失敗しました', 'error')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      <Header 
        onNewPlay={createNewPlay}
        onSave={saveCurrentPlay}
        onSaveAs={saveAsNewPlay}
        onEditMetadata={() => setIsMetadataFormOpen(true)}
        onDuplicatePlay={duplicateCurrentPlay}
        onExportImage={handleExportImage}
        onPrint={handlePrint}
        onOpenPlayLibrary={() => setIsPlayLibraryOpen(true)}
        onOpenPlaylistWorkspace={() => setIsPlaylistWorkspaceOpen(true)}
        onShowMessage={showMessage}
        currentPlay={appState.currentPlay}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          appState={appState}
          updateAppState={updateAppState}
          plays={plays}
          onSelectPlay={selectPlay}
          onDeletePlay={deletePlay}
          onDuplicatePlay={duplicatePlay}
          onUpdatePlay={updateCurrentPlay}
          playlists={playlists}
          onCreatePlaylist={createPlaylist}
          onUpdatePlaylist={updatePlaylist}
          onDeletePlaylist={deletePlaylist}
          formations={formations}
          onApplyFormation={applyFormation}
          onSaveFormationTemplate={saveFormationTemplate}
          onDeleteFormationTemplate={deleteFormationTemplate}
        />
        
        <CanvasArea 
          ref={canvasAreaRef}
          appState={appState}
          updateAppState={updateAppState}
          onUpdatePlay={updateCurrentPlay}
          onNewPlay={createNewPlay}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onUndo={undo}
          onRedo={redo}
        />
        
        <TextBoxPanel
          textBoxEntries={appState.currentPlay?.textBoxEntries || []}
          onUpdateTextBoxEntries={(entries) => {
            if (appState.currentPlay) {
              updateCurrentPlay({ textBoxEntries: entries })
            }
          }}
          disabled={!appState.currentPlay}
        />
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`fixed top-20 right-4 text-white px-4 py-2 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500' :
          message.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            )}
            {message.type === 'error' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            )}
            {message.type === 'info' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* プレイメタデータ編集フォーム */}
      {appState.currentPlay && (
        <PlayMetadataForm
          play={appState.currentPlay}
          onSave={handleMetadataSave}
          onCancel={() => setIsMetadataFormOpen(false)}
          isOpen={isMetadataFormOpen}
        />
      )}

      {/* プレー一覧画面 */}
      {isPlayLibraryOpen && (
        <PlayLibrary
          plays={plays}
          currentPlay={appState.currentPlay}
          onSelectPlay={(play) => {
            selectPlay(play)
            setIsPlayLibraryOpen(false)
          }}
          onDeletePlay={deletePlay}
          onDuplicatePlay={duplicatePlay}
          onClose={() => setIsPlayLibraryOpen(false)}
        />
      )}

      {/* プレイリスト管理画面 */}
      {isPlaylistWorkspaceOpen && (
        <PlaylistWorkspace
          plays={plays}
          playlists={playlists}
          onCreatePlaylist={createPlaylist}
          onUpdatePlaylist={updatePlaylist}
          onDeletePlaylist={deletePlaylist}
          onClose={() => setIsPlaylistWorkspaceOpen(false)}
        />
      )}
    </div>
  )
}

export default App