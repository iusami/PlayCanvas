import React, { useState, useMemo } from 'react'
import { Play } from '../types'

interface PlayListViewProps {
  plays: Play[]
  currentPlay: Play | null
  onSelectPlay: (play: Play) => void
  onDeletePlay: (playId: string) => void
  onDuplicatePlay: (playId: string) => void
}

type SortField = 'title' | 'createdAt' | 'updatedAt' | 'playName'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

const PlayListView: React.FC<PlayListViewProps> = ({
  plays,
  currentPlay,
  onSelectPlay,
  onDeletePlay,
  onDuplicatePlay
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFormations, setSelectedFormations] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // 全てのフォーメーションとタグを抽出
  const allFormations = useMemo(() => {
    const formations = new Set<string>()
    plays.forEach(play => {
      if (play.metadata.offFormation) formations.add(play.metadata.offFormation)
      if (play.metadata.defFormation) formations.add(play.metadata.defFormation)
    })
    return Array.from(formations).sort()
  }, [plays])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    plays.forEach(play => {
      play.metadata.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [plays])

  // フィルタリングとソート
  const filteredAndSortedPlays = useMemo(() => {
    const filtered = plays.filter(play => {
      // 検索クエリでフィルタ
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        play.metadata.title.toLowerCase().includes(query) ||
        play.metadata.description.toLowerCase().includes(query) ||
        play.metadata.playName.toLowerCase().includes(query) ||
        play.metadata.tags.some(tag => tag.toLowerCase().includes(query))

      if (!matchesSearch) return false

      // フォーメーションでフィルタ
      if (selectedFormations.length > 0) {
        const hasMatchingFormation = selectedFormations.some(formation => 
          play.metadata.offFormation === formation || 
          play.metadata.defFormation === formation
        )
        if (!hasMatchingFormation) return false
      }

      // タグでフィルタ
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => 
          play.metadata.tags.includes(tag)
        )
        if (!hasMatchingTag) return false
      }

      return true
    })

    // ソート
    filtered.sort((a, b) => {
      let valueA: any, valueB: any

      switch (sortField) {
        case 'title':
          valueA = a.metadata.title.toLowerCase()
          valueB = b.metadata.title.toLowerCase()
          break
        case 'playName':
          valueA = a.metadata.playName.toLowerCase()
          valueB = b.metadata.playName.toLowerCase()
          break
        case 'createdAt':
          valueA = a.metadata.createdAt.getTime()
          valueB = b.metadata.createdAt.getTime()
          break
        case 'updatedAt':
          valueA = a.metadata.updatedAt.getTime()
          valueB = b.metadata.updatedAt.getTime()
          break
        default:
          return 0
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [plays, searchQuery, selectedFormations, selectedTags, sortField, sortOrder])

  const handleFormationFilter = (formation: string) => {
    setSelectedFormations(prev => 
      prev.includes(formation) 
        ? prev.filter(f => f !== formation)
        : [...prev, formation]
    )
  }

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedFormations([])
    setSelectedTags([])
  }

  const PlayCard: React.FC<{ play: Play }> = ({ play }) => {
    const isSelected = currentPlay?.id === play.id

    return (
      <div
        className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
        onClick={() => onSelectPlay(play)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {play.metadata.title}
          </h3>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicatePlay(play.id)
              }}
              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
              title="複製"
            >
              📋
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('このプレイを削除しますか？')) {
                  onDeletePlay(play.id)
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
              title="削除"
            >
              🗑️
            </button>
          </div>
        </div>


        {play.metadata.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {play.metadata.description}
          </p>
        )}

        <div className="space-y-2">
          {(play.metadata.offFormation || play.metadata.defFormation) && (
            <div className="flex flex-wrap gap-2">
              {play.metadata.offFormation && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  OFF: {play.metadata.offFormation}
                </span>
              )}
              {play.metadata.defFormation && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  DEF: {play.metadata.defFormation}
                </span>
              )}
            </div>
          )}

          {play.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {play.metadata.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
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

          <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t">
            <span>作成: {play.metadata.createdAt.toLocaleDateString()}</span>
            <span>更新: {play.metadata.updatedAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>プレイヤー: {play.players.length}人</span>
          <span>矢印: {play.arrows.length}本</span>
          <span>テキスト: {play.texts.length}個</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 検索・フィルターヘッダー */}
      <div className="p-4 border-b border-gray-300 bg-white">
        {/* 検索バー */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="プレイを検索..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* ソート・表示設定 */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">ソート:</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="updatedAt">更新日</option>
              <option value="createdAt">作成日</option>
              <option value="title">タイトル</option>
              <option value="playName">プレイ名</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">表示:</label>
            <button
              onClick={() => setViewMode('grid')}
              className={`text-sm px-2 py-1 rounded ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              グリッド
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`text-sm px-2 py-1 rounded ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              リスト
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="space-y-3">
          {allFormations.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                フォーメーション:
              </label>
              <div className="flex flex-wrap gap-2">
                {allFormations.map(formation => (
                  <button
                    key={formation}
                    onClick={() => handleFormationFilter(formation)}
                    className={`text-xs px-2 py-1 rounded border ${
                      selectedFormations.includes(formation)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {formation}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allTags.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                タグ:
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagFilter(tag)}
                    className={`text-xs px-2 py-1 rounded border ${
                      selectedTags.includes(tag)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(searchQuery || selectedFormations.length > 0 || selectedTags.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800"
            >
              すべてのフィルターをクリア
            </button>
          )}
        </div>
      </div>

      {/* プレイ一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedPlays.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {plays.length === 0 ? (
              <div>
                <div className="text-6xl mb-4">🏈</div>
                <p className="text-lg">プレイがありません</p>
                <p className="text-sm mt-2">新しいプレイを作成して始めましょう</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg">条件に一致するプレイが見つかりません</p>
                <p className="text-sm mt-2">検索条件を変更してみてください</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredAndSortedPlays.length} / {plays.length} 件のプレイを表示
            </div>
            
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {filteredAndSortedPlays.map(play => (
                <PlayCard key={play.id} play={play} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PlayListView