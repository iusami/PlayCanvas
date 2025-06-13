import React, { useState, useEffect } from 'react'
import { Play, Playlist } from '../types'

interface PlaylistEditorProps {
  playlist: Playlist
  allPlays: Play[]
  onUpdatePlaylist: (playlist: Playlist) => void
  onBack: () => void
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  playlist,
  allPlays,
  onUpdatePlaylist,
  onBack
}) => {
  const [title, setTitle] = useState(playlist.title)
  const [description, setDescription] = useState(playlist.description)
  const [playIds, setPlayIds] = useState<string[]>(playlist.playIds)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const changed = 
      title !== playlist.title ||
      description !== playlist.description ||
      JSON.stringify(playIds) !== JSON.stringify(playlist.playIds)
    setHasChanges(changed)
  }, [title, description, playIds, playlist])

  // プレイリストに含まれるプレイ
  const playlistPlays = playIds
    .map(id => allPlays.find(play => play.id === id))
    .filter(Boolean) as Play[]

  // プレイリストに含まれていないプレイ（検索フィルター付き）
  const availablePlays = allPlays.filter(play => 
    !playIds.includes(play.id) &&
    (searchQuery === '' || 
     play.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     play.metadata.playName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSave = () => {
    const updatedPlaylist: Playlist = {
      ...playlist,
      title: title.trim(),
      description: description.trim(),
      playIds,
      updatedAt: new Date()
    }
    onUpdatePlaylist(updatedPlaylist)
    setHasChanges(false)
  }

  const addPlayToPlaylist = (playId: string) => {
    setPlayIds(prev => [...prev, playId])
  }

  const removePlayFromPlaylist = (playId: string) => {
    setPlayIds(prev => prev.filter(id => id !== playId))
  }

  const movePlayUp = (index: number) => {
    if (index > 0) {
      const newPlayIds = [...playIds]
      ;[newPlayIds[index - 1], newPlayIds[index]] = [newPlayIds[index], newPlayIds[index - 1]]
      setPlayIds(newPlayIds)
    }
  }

  const movePlayDown = (index: number) => {
    if (index < playIds.length - 1) {
      const newPlayIds = [...playIds]
      ;[newPlayIds[index], newPlayIds[index + 1]] = [newPlayIds[index + 1], newPlayIds[index]]
      setPlayIds(newPlayIds)
    }
  }

  const PlayCard: React.FC<{ play: Play; isInPlaylist?: boolean; index?: number }> = ({ 
    play, 
    isInPlaylist = false, 
    index 
  }) => (
    <div className="p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{play.metadata.title}</h4>
          {play.metadata.playName && (
            <p className="text-sm text-gray-600">{play.metadata.playName}</p>
          )}
          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
            <span>プレイヤー: {play.players.length}</span>
            <span>矢印: {play.arrows.length}</span>
            <span>テキスト: {play.texts.length}</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-3">
          {isInPlaylist ? (
            <>
              <button
                onClick={() => movePlayUp(index!)}
                disabled={index === 0}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="上に移動"
              >
                ↑
              </button>
              <button
                onClick={() => movePlayDown(index!)}
                disabled={index === playIds.length - 1}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="下に移動"
              >
                ↓
              </button>
              <button
                onClick={() => removePlayFromPlaylist(play.id)}
                className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800"
                title="プレイリストから削除"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => addPlayToPlaylist(play.id)}
              className="w-8 h-8 flex items-center justify-center text-green-600 hover:text-green-800"
              title="プレイリストに追加"
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
              title="戻る"
            >
              ← 戻る
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              プレイリスト編集
            </h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>

        {/* プレイリスト情報編集 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">
        {/* プレイリスト内容 */}
        <div className="w-1/2 border-r border-gray-300 flex flex-col">
          <div className="p-4 border-b border-gray-300 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">
              プレイリスト内容 ({playlistPlays.length}プレイ)
            </h4>
            <p className="text-sm text-gray-600">
              プレイの順序を変更したり、削除できます
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {playlistPlays.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-2">📝</div>
                <p>プレイがありません</p>
                <p className="text-sm mt-1">右側からプレイを追加してください</p>
              </div>
            ) : (
              <div className="space-y-3">
                {playlistPlays.map((play, index) => (
                  <div key={play.id} className="flex items-center space-x-2">
                    <div className="w-6 text-sm text-gray-500 text-center">
                      {index + 1}.
                    </div>
                    <div className="flex-1">
                      <PlayCard play={play} isInPlaylist={true} index={index} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 利用可能なプレイ */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-gray-300 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">
              利用可能なプレイ ({availablePlays.length}プレイ)
            </h4>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="プレイを検索..."
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {availablePlays.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-2">🔍</div>
                <p>プレイが見つかりません</p>
                {searchQuery && (
                  <p className="text-sm mt-1">検索条件を変更してみてください</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {availablePlays.map(play => (
                  <PlayCard key={play.id} play={play} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フッター（変更状態表示） */}
      {hasChanges && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-yellow-800">
              ⚠️ 変更が保存されていません
            </span>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistEditor