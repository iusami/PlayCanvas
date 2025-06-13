import React, { useState } from 'react'
import { Play, Playlist } from '../types'

interface PlaylistManagerProps {
  playlists: Playlist[]
  plays: Play[]
  onCreatePlaylist: (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdatePlaylist: (playlist: Playlist) => void
  onDeletePlaylist: (playlistId: string) => void
  onSelectPlaylist: (playlist: Playlist) => void
  currentPlaylist: Playlist | null
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  plays,
  onCreatePlaylist,
  onDeletePlaylist,
  onSelectPlaylist,
  currentPlaylist
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) return

    onCreatePlaylist({
      title: newPlaylistTitle.trim(),
      description: newPlaylistDescription.trim(),
      playIds: []
    })

    setNewPlaylistTitle('')
    setNewPlaylistDescription('')
    setIsCreating(false)
  }

  const getPlaylistStats = (playlist: Playlist) => {
    const validPlays = playlist.playIds.filter(id => 
      plays.some(play => play.id === id)
    )
    return {
      totalPlays: validPlays.length,
      invalidPlays: playlist.playIds.length - validPlays.length
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">プレイリスト</h3>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            + 新規作成
          </button>
        </div>

        {/* 新規プレイリスト作成フォーム */}
        {isCreating && (
          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="プレイリスト名を入力..."
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="プレイリストの説明（オプション）"
                  className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistTitle.trim()}
                  className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  作成
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewPlaylistTitle('')
                    setNewPlaylistDescription('')
                  }}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* プレイリスト一覧 */}
      <div className="flex-1 overflow-y-auto p-4">
        {playlists.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg">プレイリストがありません</p>
            <p className="text-sm mt-2">新しいプレイリストを作成して、プレイを整理しましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playlists.map(playlist => {
              const stats = getPlaylistStats(playlist)
              const isSelected = currentPlaylist?.id === playlist.id

              return (
                <div
                  key={playlist.id}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectPlaylist(playlist)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {playlist.title}
                    </h4>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('このプレイリストを削除しますか？\n※プレイ自体は削除されません')) {
                            onDeletePlaylist(playlist.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                        title="プレイリストを削除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {playlist.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {playlist.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>📄 {stats.totalPlays}プレイ</span>
                      {stats.invalidPlays > 0 && (
                        <span className="text-red-500">
                          ⚠️ {stats.invalidPlays}個のプレイが見つかりません
                        </span>
                      )}
                    </div>
                    <span>
                      更新: {playlist.updatedAt.toLocaleDateString()}
                    </span>
                  </div>

                  {playlist.playIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">
                        含まれるプレイ（最大3つ表示）:
                      </div>
                      <div className="space-y-1">
                        {playlist.playIds.slice(0, 3).map(playId => {
                          const play = plays.find(p => p.id === playId)
                          return (
                            <div key={playId} className="text-xs">
                              {play ? (
                                <span className="text-gray-700">
                                  • {play.metadata.title}
                                </span>
                              ) : (
                                <span className="text-red-500">
                                  • [削除済みのプレイ]
                                </span>
                              )}
                            </div>
                          )
                        })}
                        {playlist.playIds.length > 3 && (
                          <div className="text-xs text-gray-400">
                            ...他{playlist.playIds.length - 3}個のプレイ
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaylistManager