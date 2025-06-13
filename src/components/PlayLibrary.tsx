import React, { useState, useMemo, useEffect } from 'react'
import { Play } from '../types'
import PlayThumbnail from './PlayThumbnail'

interface PlayLibraryProps {
  plays: Play[]
  currentPlay: Play | null
  onSelectPlay: (play: Play) => void
  onDeletePlay?: (playId: string) => void
  onDuplicatePlay?: (playId: string) => void
  onClose: () => void
}

type FilterType = 'all' | 'offense' | 'defense' | 'special'
type SortType = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'
type ViewType = 'grid' | 'list'

const PlayLibrary: React.FC<PlayLibraryProps> = ({
  plays,
  currentPlay,
  onSelectPlay,
  onDeletePlay,
  onDuplicatePlay,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('date-desc')
  const [viewType, setViewType] = useState<ViewType>('grid')
  const [selectedPlayIds, setSelectedPlayIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [lastClickedIndex, setLastClickedIndex] = useState<number>(-1)

  // フィルタリングとソート
  const filteredAndSortedPlays = useMemo(() => {
    let filtered = plays

    // 検索フィルター
    if (searchTerm) {
      filtered = filtered.filter(play => 
        play.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        play.metadata.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        play.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // タイプフィルター（プレイタイプで判断）
    if (filterType !== 'all') {
      filtered = filtered.filter(play => {
        const playType = (play.metadata as any).playType || 'offense'
        return playType === filterType
      })
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      switch (sortType) {
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

    return sorted
  }, [plays, searchTerm, filterType, sortType])

  // 選択機能
  const handleTogglePlay = (playId: string, shiftKey: boolean = false) => {
    const currentIndex = filteredAndSortedPlays.findIndex(play => play.id === playId)
    
    if (shiftKey && lastClickedIndex !== -1 && currentIndex !== -1) {
      // Shift+クリック: 範囲選択/解除
      const startIndex = Math.min(lastClickedIndex, currentIndex)
      const endIndex = Math.max(lastClickedIndex, currentIndex)
      
      const newSelected = new Set(selectedPlayIds)
      
      // クリックしたアイテムの現在の選択状態で範囲内の動作を決定
      const targetSelected = !selectedPlayIds.has(playId)
      
      for (let i = startIndex; i <= endIndex; i++) {
        const itemId = filteredAndSortedPlays[i].id
        if (targetSelected) {
          newSelected.add(itemId)
        } else {
          newSelected.delete(itemId)
        }
      }
      setSelectedPlayIds(newSelected)
    } else {
      // 通常のクリック: 単一選択切り替え
      const newSelected = new Set(selectedPlayIds)
      if (newSelected.has(playId)) {
        newSelected.delete(playId)
      } else {
        newSelected.add(playId)
      }
      setSelectedPlayIds(newSelected)
    }
    
    // 最後にクリックしたインデックスを更新
    setLastClickedIndex(currentIndex)
  }

  const handleSelectAll = () => {
    if (selectedPlayIds.size === filteredAndSortedPlays.length) {
      // 全て選択されている場合は全て解除
      setSelectedPlayIds(new Set())
    } else {
      // 表示されているプレーを全て選択
      const allVisibleIds = new Set(filteredAndSortedPlays.map(p => p.id))
      setSelectedPlayIds(allVisibleIds)
    }
  }

  const handleBulkDelete = () => {
    if (selectedPlayIds.size === 0) return
    
    const selectedCount = selectedPlayIds.size
    if (!window.confirm(`選択された${selectedCount}個のプレーを削除しますか？`)) {
      return
    }

    if (onDeletePlay) {
      selectedPlayIds.forEach(playId => {
        onDeletePlay(playId)
      })
    }
    
    setSelectedPlayIds(new Set())
    setIsSelectionMode(false)
  }

  const handleCancelSelection = () => {
    setSelectedPlayIds(new Set())
    setIsSelectionMode(false)
    setLastClickedIndex(-1)
  }

  // フィルター変更時に選択をクリア
  useEffect(() => {
    setSelectedPlayIds(new Set())
    setLastClickedIndex(-1)
  }, [searchTerm, filterType, sortType])

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
            <h1 className="text-2xl font-bold text-gray-900">プレー一覧</h1>
            <span className="text-sm text-gray-500">
              {filteredAndSortedPlays.length}個のプレー
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 選択モード時の操作ボタン */}
            {isSelectionMode ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedPlayIds.size}個選択中
                </span>
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {selectedPlayIds.size === filteredAndSortedPlays.length ? '全て解除' : '全て選択'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedPlayIds.size === 0}
                  className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  削除 ({selectedPlayIds.size})
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <>
                {/* 選択モード切り替えボタン */}
                {filteredAndSortedPlays.length > 0 && (
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    選択して削除
                  </button>
                )}
                
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
              </>
            )}
          </div>
        </div>

        {/* フィルターとソート */}
        <div className="mt-4 flex flex-wrap gap-4">
          {/* 検索 */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="プレー名、説明、タグで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* フィルター */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">すべて</option>
            <option value="offense">オフェンス</option>
            <option value="defense">ディフェンス</option>
            <option value="special">スペシャル</option>
          </select>

          {/* ソート */}
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
        {filteredAndSortedPlays.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'プレーが見つかりません' : 'プレーがありません'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? '検索条件を変更してもう一度お試しください' 
                : '新しいプレーを作成してみましょう'
              }
            </p>
          </div>
        ) : viewType === 'grid' ? (
          /* グリッドビュー */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredAndSortedPlays.map(play => (
              <div
                key={play.id}
                className={`relative bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
                  isSelectionMode ? 'cursor-default' : 'cursor-pointer'
                } ${
                  currentPlay?.id === play.id
                    ? 'border-blue-500 shadow-lg'
                    : selectedPlayIds.has(play.id)
                    ? 'border-green-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={(e) => {
                  if (isSelectionMode) {
                    handleTogglePlay(play.id, e.shiftKey)
                  } else {
                    onSelectPlay(play)
                  }
                }}
              >
                {/* 選択モード時のチェックボックス */}
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedPlayIds.has(play.id)}
                      onChange={(e) => handleTogglePlay(play.id, e.shiftKey)}
                      className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                
                {/* サムネイル */}
                <div className={`p-4 bg-gray-50 rounded-t-lg relative ${
                  isSelectionMode && selectedPlayIds.has(play.id) ? 'opacity-80' : ''
                }`}>
                  <PlayThumbnail
                    play={play}
                    width={240}
                    height={160}
                    className="w-full"
                  />
                </div>

                {/* プレー情報 */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1">
                      {play.metadata.title}
                    </h3>
                    {getPlayCategoryBadge(play)}
                  </div>
                  
                  {play.metadata.playName && (
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      {play.metadata.playName}
                    </p>
                  )}
                  
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

                  {/* アクションボタン */}
                  {!isSelectionMode && (
                    <div className="flex space-x-2">
                      {onDuplicatePlay && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicatePlay(play.id)
                          }}
                          className="flex-1 px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                        >
                          複製
                        </button>
                      )}
                      {onDeletePlay && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('このプレーを削除しますか？')) {
                              onDeletePlay(play.id)
                            }
                          }}
                          className="flex-1 px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* リストビュー */
          <div className="space-y-4">
            {filteredAndSortedPlays.map(play => (
              <div
                key={play.id}
                className={`relative bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                  isSelectionMode ? 'cursor-default' : 'cursor-pointer'
                } flex items-center space-x-4 ${
                  currentPlay?.id === play.id
                    ? 'border-blue-500 shadow-md'
                    : selectedPlayIds.has(play.id)
                    ? 'border-green-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={(e) => {
                  if (isSelectionMode) {
                    handleTogglePlay(play.id, e.shiftKey)
                  } else {
                    onSelectPlay(play)
                  }
                }}
              >
                {/* 選択モード時のチェックボックス */}
                {isSelectionMode && (
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedPlayIds.has(play.id)}
                      onChange={(e) => handleTogglePlay(play.id, e.shiftKey)}
                      className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {/* ミニサムネイル */}
                <div className="flex-shrink-0">
                  <PlayThumbnail
                    play={play}
                    width={120}
                    height={80}
                  />
                </div>

                {/* プレー情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {play.metadata.title}
                    </h3>
                    {getPlayCategoryBadge(play)}
                  </div>
                  
                  {play.metadata.playName && (
                    <p className="text-sm text-gray-600 mb-1">
                      {play.metadata.playName}
                    </p>
                  )}
                  
                  {play.metadata.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {play.metadata.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>更新: {play.metadata.updatedAt.toLocaleDateString()}</span>
                    <span>{play.players.length}人のプレイヤー</span>
                    <span>{play.arrows.length}本の矢印</span>
                  </div>

                  {/* タグ */}
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

                {/* アクションボタン */}
                {!isSelectionMode && (
                  <div className="flex flex-col space-y-1 flex-shrink-0">
                    {onDuplicatePlay && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicatePlay(play.id)
                        }}
                        className="px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        複製
                      </button>
                    )}
                    {onDeletePlay && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('このプレーを削除しますか？')) {
                            onDeletePlay(play.id)
                          }
                        }}
                        className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
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
    </div>
  )
}

export default PlayLibrary