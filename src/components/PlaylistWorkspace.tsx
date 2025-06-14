import React, { useState, useMemo, useEffect } from 'react'
import { Play, Playlist } from '../types'
import PlayThumbnail from './PlayThumbnail'

interface PlaylistWorkspaceProps {
  plays: Play[]
  playlists: Playlist[]
  currentPlaylist?: Playlist | null
  onCreatePlaylist: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdatePlaylist: (playlist: Playlist) => void
  onDeletePlaylist: (playlistId: string) => void
  onClose: () => void
}

type ViewType = 'grid' | 'list'
type SortType = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

const PlaylistWorkspace: React.FC<PlaylistWorkspaceProps> = ({
  plays,
  playlists,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  onClose
}) => {
  const [mode, setMode] = useState<'browse' | 'create' | 'edit' | 'view'>('browse')
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null)
  
  // 新規作成・編集用の状態
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [selectedPlayIds, setSelectedPlayIds] = useState<Set<string>>(new Set())
  
  // プレイリスト一覧表示用の状態
  const [searchTerm, setSearchTerm] = useState('')
  const [sortType, setSortType] = useState<SortType>('date-desc')
  const [viewType, setViewType] = useState<ViewType>('grid')
  
  // プレイ選択用の状態
  const [playSearchTerm, setPlaySearchTerm] = useState('')
  const [playSortType, setPlaySortType] = useState<SortType>('date-desc')
  const [playViewType, setPlayViewType] = useState<ViewType>('grid')
  const [playFilterType, setPlayFilterType] = useState<'all' | 'offense' | 'defense' | 'special'>('all')
  
  // プレイリスト表示用の状態
  const [playlistViewSearchTerm, setPlaylistViewSearchTerm] = useState('')
  const [playlistViewSortType, setPlaylistViewSortType] = useState<SortType>('date-desc')
  const [playlistViewType, setPlaylistViewType] = useState<ViewType>('grid')
  const [playlistViewFilterType, setPlaylistViewFilterType] = useState<'all' | 'offense' | 'defense' | 'special'>('all')

  // 編集モードの初期化
  useEffect(() => {
    if (mode === 'edit' && editingPlaylist) {
      setPlaylistTitle(editingPlaylist.title)
      setPlaylistDescription(editingPlaylist.description)
      setSelectedPlayIds(new Set(editingPlaylist.playIds))
    } else if (mode === 'create') {
      setPlaylistTitle('')
      setPlaylistDescription('')
      setSelectedPlayIds(new Set())
    }
  }, [mode, editingPlaylist])

  // プレイリスト一覧のフィルタリングとソート
  const filteredAndSortedPlaylists = useMemo(() => {
    let filtered = playlists

    if (searchTerm) {
      filtered = filtered.filter(playlist => 
        playlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playlist.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return [...filtered].sort((a, b) => {
      switch (sortType) {
        case 'date-desc':
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case 'date-asc':
          return a.updatedAt.getTime() - b.updatedAt.getTime()
        case 'name-asc':
          return a.title.localeCompare(b.title)
        case 'name-desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })
  }, [playlists, searchTerm, sortType])

  // プレイ選択用のフィルタリングとソート
  const filteredAndSortedPlays = useMemo(() => {
    let filtered = plays

    if (playSearchTerm) {
      filtered = filtered.filter(play => 
        play.metadata.title.toLowerCase().includes(playSearchTerm.toLowerCase()) ||
        play.metadata.description.toLowerCase().includes(playSearchTerm.toLowerCase()) ||
        play.metadata.tags.some(tag => tag.toLowerCase().includes(playSearchTerm.toLowerCase()))
      )
    }

    if (playFilterType !== 'all') {
      filtered = filtered.filter(play => {
        const playType = (play.metadata as any).playType || 'offense'
        return playType === playFilterType
      })
    }

    return [...filtered].sort((a, b) => {
      switch (playSortType) {
        case 'date-desc':
          return b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime()
        case 'date-asc':
          return a.metadata.updatedAt.getTime() - b.metadata.updatedAt.getTime()
        case 'name-asc':
          return a.metadata.title.localeCompare(b.metadata.title)
        case 'name-desc':
          return b.metadata.title.localeCompare(a.metadata.title)
        default:
          return 0
      }
    })
  }, [plays, playSearchTerm, playFilterType, playSortType])

  // プレイリスト表示用のフィルタリングとソート
  const playlistPlays = useMemo(() => {
    if (!viewingPlaylist) return []
    
    // プレイリストに含まれるプレイのみを取得
    const playlistPlayItems = plays.filter(play => viewingPlaylist.playIds.includes(play.id))
    
    let filtered = playlistPlayItems

    if (playlistViewSearchTerm) {
      filtered = filtered.filter(play => 
        play.metadata.title.toLowerCase().includes(playlistViewSearchTerm.toLowerCase()) ||
        play.metadata.description.toLowerCase().includes(playlistViewSearchTerm.toLowerCase()) ||
        play.metadata.tags.some(tag => tag.toLowerCase().includes(playlistViewSearchTerm.toLowerCase()))
      )
    }

    if (playlistViewFilterType !== 'all') {
      filtered = filtered.filter(play => {
        const playType = (play.metadata as any).playType || 'offense'
        return playType === playlistViewFilterType
      })
    }

    return [...filtered].sort((a, b) => {
      switch (playlistViewSortType) {
        case 'date-desc':
          return b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime()
        case 'date-asc':
          return a.metadata.updatedAt.getTime() - b.metadata.updatedAt.getTime()
        case 'name-asc':
          return a.metadata.title.localeCompare(b.metadata.title)
        case 'name-desc':
          return b.metadata.title.localeCompare(a.metadata.title)
        default:
          return 0
      }
    })
  }, [viewingPlaylist, plays, playlistViewSearchTerm, playlistViewFilterType, playlistViewSortType])

  const handleSavePlaylist = () => {
    if (!playlistTitle.trim()) return

    if (mode === 'create') {
      onCreatePlaylist({
        title: playlistTitle.trim(),
        description: playlistDescription.trim(),
        playIds: Array.from(selectedPlayIds)
      })
      setMode('browse')
      setEditingPlaylist(null)
    } else if (mode === 'edit' && editingPlaylist) {
      const updatedPlaylist = {
        ...editingPlaylist,
        title: playlistTitle.trim(),
        description: playlistDescription.trim(),
        playIds: Array.from(selectedPlayIds),
        updatedAt: new Date()
      }
      
      onUpdatePlaylist(updatedPlaylist)
      
      // 編集から戻る場合は表示モードに戻る
      setViewingPlaylist(updatedPlaylist)
      setMode('view')
      setEditingPlaylist(null)
    }
  }

  const handleCancelEdit = () => {
    if (editingPlaylist && viewingPlaylist && editingPlaylist.id === viewingPlaylist.id) {
      // 表示モードから編集に入った場合は表示モードに戻る
      setMode('view')
    } else {
      // 新規作成や直接編集の場合は一覧に戻る
      setMode('browse')
    }
    
    setEditingPlaylist(null)
    setPlaylistTitle('')
    setPlaylistDescription('')
    setSelectedPlayIds(new Set())
  }

  const handleViewPlaylist = (playlist: Playlist) => {
    setViewingPlaylist(playlist)
    setMode('view')
  }

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setMode('edit')
  }

  const handleEditFromView = () => {
    if (viewingPlaylist) {
      setEditingPlaylist(viewingPlaylist)
      setMode('edit')
    }
  }

  const handleBackToBrowse = () => {
    setMode('browse')
    setViewingPlaylist(null)
    setEditingPlaylist(null)
    setPlaylistTitle('')
    setPlaylistDescription('')
    setSelectedPlayIds(new Set())
  }

  const handleDeletePlaylist = (playlistId: string) => {
    if (!window.confirm('このプレイリストを削除しますか？')) return
    onDeletePlaylist(playlistId)
  }

  const togglePlaySelection = (playId: string) => {
    const newSelected = new Set(selectedPlayIds)
    if (newSelected.has(playId)) {
      newSelected.delete(playId)
    } else {
      newSelected.add(playId)
    }
    setSelectedPlayIds(newSelected)
  }


  const getPlayCategoryBadge = (play: Play) => {
    const playType = (play.metadata as any).playType || 'offense'
    
    switch (playType) {
      case 'offense':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">オフェンス</span>
      case 'defense':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">ディフェンス</span>
      case 'special':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">スペシャル</span>
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">未分類</span>
    }
  }

  if (mode === 'browse') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">プレイリスト管理</h1>
              <span className="text-sm text-gray-500">
                {filteredAndSortedPlaylists.length}個のプレイリスト
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMode('create')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                新規作成
              </button>
              
              {/* 表示切り替え */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewType('grid')}
                  className={`px-3 py-2 text-sm ${
                    viewType === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📱 グリッド
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${
                    viewType === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 リスト
                </button>
              </div>
            </div>
          </div>

          {/* フィルターとソート */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="プレイリスト名、説明で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-desc">更新日時（新しい順）</option>
              <option value="date-asc">更新日時（古い順）</option>
              <option value="name-asc">名前（昇順）</option>
              <option value="name-desc">名前（降順）</option>
            </select>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-auto p-6">
          {filteredAndSortedPlaylists.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'プレイリストが見つかりません' : 'プレイリストがありません'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? '検索条件を変更してもう一度お試しください' 
                  : '新しいプレイリストを作成してプレイを整理しましょう'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setMode('create')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  最初のプレイリストを作成
                </button>
              )}
            </div>
          ) : viewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedPlaylists.map(playlist => (
                <div
                  key={playlist.id}
                  className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleViewPlaylist(playlist)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-gray-900 truncate flex-1">
                        {playlist.title}
                      </h3>
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded ml-2">
                        {playlist.playIds.length}個
                      </span>
                    </div>
                    
                    {playlist.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-4">
                      更新: {playlist.updatedAt.toLocaleDateString()}
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPlaylist(playlist)
                        }}
                        className="flex-1 px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePlaylist(playlist.id)
                        }}
                        className="flex-1 px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedPlaylists.map(playlist => (
                <div
                  key={playlist.id}
                  className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md p-4 cursor-pointer"
                  onClick={() => handleViewPlaylist(playlist)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {playlist.title}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          {playlist.playIds.length}個のプレイ
                        </span>
                      </div>
                      
                      {playlist.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {playlist.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        更新: {playlist.updatedAt.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPlaylist(playlist)
                        }}
                        className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        編集
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePlaylist(playlist.id)
                        }}
                        className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'view') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToBrowse}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 戻る
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {viewingPlaylist?.title}
              </h1>
              <span className="text-sm text-gray-500">
                {playlistPlays.length}個のプレイ
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEditFromView}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                編集
              </button>
              
              {/* 表示切り替え */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setPlaylistViewType('grid')}
                  className={`px-3 py-2 text-sm ${
                    playlistViewType === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📱 グリッド
                </button>
                <button
                  onClick={() => setPlaylistViewType('list')}
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${
                    playlistViewType === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 リスト
                </button>
              </div>
            </div>
          </div>

          {/* プレイリスト情報 */}
          {viewingPlaylist?.description && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{viewingPlaylist.description}</p>
            </div>
          )}

          {/* フィルターとソート */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="プレイ名、説明、タグで検索..."
                value={playlistViewSearchTerm}
                onChange={(e) => setPlaylistViewSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={playlistViewFilterType}
              onChange={(e) => setPlaylistViewFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="offense">オフェンス</option>
              <option value="defense">ディフェンス</option>
              <option value="special">スペシャル</option>
            </select>

            <select
              value={playlistViewSortType}
              onChange={(e) => setPlaylistViewSortType(e.target.value as SortType)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date-desc">更新日時（新しい順）</option>
              <option value="date-asc">更新日時（古い順）</option>
              <option value="name-asc">名前（昇順）</option>
              <option value="name-desc">名前（降順）</option>
            </select>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-auto p-6">
          {playlistPlays.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {playlistViewSearchTerm || playlistViewFilterType !== 'all' 
                  ? 'プレイが見つかりません' 
                  : 'プレイリストが空です'
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {playlistViewSearchTerm || playlistViewFilterType !== 'all'
                  ? '検索条件を変更してもう一度お試しください'
                  : 'このプレイリストにプレイを追加しましょう'
                }
              </p>
              <button
                onClick={handleEditFromView}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                プレイを追加
              </button>
            </div>
          ) : playlistViewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {playlistPlays.map(play => (
                <div
                  key={play.id}
                  className="relative bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
                >
                  {/* サムネイル */}
                  <div className="p-4 bg-gray-50 rounded-t-lg">
                    <PlayThumbnail
                      play={play}
                      width={240}
                      height={160}
                      className="w-full"
                    />
                  </div>

                  {/* プレイ情報 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 truncate flex-1">
                        {play.metadata.title}
                      </h3>
                      {getPlayCategoryBadge(play)}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      更新: {play.metadata.updatedAt.toLocaleDateString()}
                    </div>

                    {/* タグ */}
                    {play.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {play.metadata.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {play.metadata.tags.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{play.metadata.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {playlistPlays.map(play => (
                <div
                  key={play.id}
                  className="bg-white rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md p-4 flex items-center space-x-4"
                >
                  {/* ミニサムネイル */}
                  <div className="flex-shrink-0">
                    <PlayThumbnail
                      play={play}
                      width={120}
                      height={80}
                    />
                  </div>

                  {/* プレイ情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {play.metadata.title}
                      </h3>
                      {getPlayCategoryBadge(play)}
                    </div>
                    
                    {play.metadata.description && (
                      <p className="text-sm text-gray-500 mb-1 line-clamp-2">
                        {play.metadata.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>更新: {play.metadata.updatedAt.toLocaleDateString()}</span>
                      <span>{play.players.length}人のプレイヤー</span>
                      <span>{play.arrows.length}本の矢印</span>
                    </div>

                    {play.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {play.metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'プレイリスト作成' : 'プレイリスト編集'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={handleSavePlaylist}
              disabled={!playlistTitle.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'create' ? '作成' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側: プレイリスト設定 */}
        <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プレイリスト名 *
              </label>
              <input
                type="text"
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 4thダウン用プレイ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="プレイリストの説明..."
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                選択されたプレイ ({selectedPlayIds.size}個)
              </h3>
              {selectedPlayIds.size === 0 ? (
                <p className="text-sm text-gray-500">プレイが選択されていません</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from(selectedPlayIds).map(playId => {
                    const play = plays.find(p => p.id === playId)
                    if (!play) return null
                    
                    return (
                      <div
                        key={playId}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {play.metadata.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {play.metadata.tags.slice(0, 2).join(', ')}
                          </div>
                        </div>
                        <button
                          onClick={() => togglePlaySelection(playId)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側: プレイ選択 */}
        <div className="flex-1 flex flex-col">
          {/* プレイ選択ヘッダー */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">プレイを選択</h2>
              <span className="text-sm text-gray-500">
                {filteredAndSortedPlays.length}個のプレイ
              </span>
            </div>

            {/* フィルターとソート */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <input
                  type="text"
                  placeholder="プレイ名、説明、タグで検索..."
                  value={playSearchTerm}
                  onChange={(e) => setPlaySearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <select
                value={playFilterType}
                onChange={(e) => setPlayFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="offense">オフェンス</option>
                <option value="defense">ディフェンス</option>
                <option value="special">スペシャル</option>
              </select>

              <select
                value={playSortType}
                onChange={(e) => setPlaySortType(e.target.value as SortType)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date-desc">更新日時（新しい順）</option>
                <option value="date-asc">更新日時（古い順）</option>
                <option value="name-asc">名前（昇順）</option>
                <option value="name-desc">名前（降順）</option>
              </select>

              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setPlayViewType('grid')}
                  className={`px-3 py-2 text-sm ${
                    playViewType === 'grid'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📱
                </button>
                <button
                  onClick={() => setPlayViewType('list')}
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${
                    playViewType === 'list'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          {/* プレイリスト */}
          <div className="flex-1 overflow-auto p-6">
            {filteredAndSortedPlays.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">プレイが見つかりません</h3>
                <p className="text-gray-500">検索条件を変更してもう一度お試しください</p>
              </div>
            ) : playViewType === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedPlays.map(play => (
                  <div
                    key={play.id}
                    className={`relative bg-white rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                      selectedPlayIds.has(play.id)
                        ? 'border-green-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlaySelection(play.id)}
                  >
                    {/* 選択インジケーター */}
                    {selectedPlayIds.has(play.id) && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      </div>
                    )}

                    {/* サムネイル */}
                    <div className={`p-3 bg-gray-50 rounded-t-lg ${
                      selectedPlayIds.has(play.id) ? 'opacity-80' : ''
                    }`}>
                      <PlayThumbnail
                        play={play}
                        width={200}
                        height={120}
                        className="w-full"
                      />
                    </div>

                    {/* プレイ情報 */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 truncate flex-1 text-sm">
                          {play.metadata.title}
                        </h3>
                        {getPlayCategoryBadge(play)}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        更新: {play.metadata.updatedAt.toLocaleDateString()}
                      </div>

                      {play.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {play.metadata.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {play.metadata.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{play.metadata.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedPlays.map(play => (
                  <div
                    key={play.id}
                    className={`bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md cursor-pointer flex items-center space-x-4 ${
                      selectedPlayIds.has(play.id)
                        ? 'border-green-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePlaySelection(play.id)}
                  >
                    {/* 選択インジケーター */}
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlayIds.has(play.id)
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedPlayIds.has(play.id) && <span className="text-xs">✓</span>}
                      </div>
                    </div>

                    {/* ミニサムネイル */}
                    <div className="flex-shrink-0">
                      <PlayThumbnail
                        play={play}
                        width={80}
                        height={50}
                      />
                    </div>

                    {/* プレイ情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {play.metadata.title}
                        </h3>
                        {getPlayCategoryBadge(play)}
                      </div>
                      
                      {play.metadata.description && (
                        <p className="text-sm text-gray-500 mb-1 line-clamp-1">
                          {play.metadata.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>更新: {play.metadata.updatedAt.toLocaleDateString()}</span>
                        <span>{play.players.length}人</span>
                        <span>{play.arrows.length}本の矢印</span>
                      </div>

                      {play.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {play.metadata.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaylistWorkspace