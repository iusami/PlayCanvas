import React, { useState } from 'react'
import { Play, PlayMetadata, PlayType } from '../types'

interface PlayMetadataFormProps {
  play: Play
  onSave: (metadata: Partial<PlayMetadata>) => void
  onCancel: () => void
  isOpen: boolean
}

const PlayMetadataForm: React.FC<PlayMetadataFormProps> = ({
  play,
  onSave,
  onCancel,
  isOpen
}) => {
  const [formData, setFormData] = useState({
    title: play.metadata.title,
    description: play.metadata.description,
    tags: play.metadata.tags.join(', '),
    playType: (play.metadata as any).playType || 'offense'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    onSave({
      title: formData.title,
      description: formData.description,
      tags: tagsArray,
      playType: formData.playType as PlayType,
      updatedAt: new Date()
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">プレイ情報編集</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="プレイの詳細説明..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プレイタイプ *
            </label>
            <select
              value={formData.playType}
              onChange={(e) => setFormData({ ...formData, playType: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="offense">オフェンス</option>
              <option value="defense">ディフェンス</option>
              <option value="special">スペシャルチーム</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="タグをカンマ区切りで入力（例: パス, ショート, 3rd Down）"
            />
            <p className="text-xs text-gray-500 mt-1">
              複数のタグはカンマ（,）で区切ってください
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlayMetadataForm