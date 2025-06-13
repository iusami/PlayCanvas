import React, { useState } from 'react'
import { FormationTemplate, Player } from '../types'

interface FormationTemplateManagerProps {
  formations: FormationTemplate[]
  currentFormationType: 'offense' | 'defense'
  onApplyFormation: (formation: FormationTemplate) => void
  onSaveCurrentAsTemplate: (name: string, description: string, type: 'offense' | 'defense') => void
  onDeleteFormation: (formationId: string) => void
  currentPlayers: Player[]
}

const FormationTemplateManager: React.FC<FormationTemplateManagerProps> = ({
  formations,
  currentFormationType,
  onApplyFormation,
  onSaveCurrentAsTemplate,
  onDeleteFormation,
  currentPlayers
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [newFormationName, setNewFormationName] = useState('')
  const [newFormationDescription, setNewFormationDescription] = useState('')
  const [selectedFormationType, setSelectedFormationType] = useState<'offense' | 'defense'>(currentFormationType)

  // 選択されたタイプのフォーメーションのみ表示
  const filteredFormations = formations.filter(f => f.type === selectedFormationType)

  const handleSaveTemplate = () => {
    if (!newFormationName.trim()) return

    onSaveCurrentAsTemplate(newFormationName.trim(), newFormationDescription.trim(), selectedFormationType)
    setNewFormationName('')
    setNewFormationDescription('')
    setIsCreating(false)
  }

  const handleCancel = () => {
    setNewFormationName('')
    setNewFormationDescription('')
    setIsCreating(false)
  }

  // 現在のプレイヤーから選択されたタイプのプレイヤーのみをカウント
  const currentTeamPlayers = currentPlayers.filter(p => p.team === selectedFormationType)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">フォーメーションテンプレート</h3>
        <div className="flex items-center space-x-2">
          <select
            value={selectedFormationType}
            onChange={(e) => setSelectedFormationType(e.target.value as 'offense' | 'defense')}
            className="text-xs px-2 py-1 border border-gray-300 rounded"
          >
            <option value="offense">オフェンス</option>
            <option value="defense">ディフェンス</option>
          </select>
        </div>
      </div>

      {/* 新規テンプレート作成 */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          disabled={currentTeamPlayers.length === 0}
          className="w-full p-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          現在の{selectedFormationType === 'offense' ? 'オフェンス' : 'ディフェンス'}配置をテンプレート化
          {currentTeamPlayers.length > 0 && (
            <span className="block text-xs text-gray-500 mt-1">
              ({currentTeamPlayers.length}人のプレイヤー)
            </span>
          )}
        </button>
      ) : (
        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                テンプレート名
              </label>
              <input
                type="text"
                value={newFormationName}
                onChange={(e) => setNewFormationName(e.target.value)}
                placeholder="例: Custom 3-4 Defense"
                className="w-full p-2 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                説明（任意）
              </label>
              <textarea
                value={newFormationDescription}
                onChange={(e) => setNewFormationDescription(e.target.value)}
                placeholder="フォーメーションの特徴や用途を記入"
                rows={2}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveTemplate}
                disabled={!newFormationName.trim()}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テンプレート一覧 */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredFormations.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            {selectedFormationType === 'offense' ? 'オフェンス' : 'ディフェンス'}の
            テンプレートがありません
          </div>
        ) : (
          filteredFormations.map(formation => (
            <div
              key={formation.id}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{formation.name}</h4>
                  {formation.description && (
                    <p className="text-xs text-gray-600 mt-1">{formation.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {formation.players.length}人のプレイヤー
                  </div>
                </div>
                <div className="flex flex-col space-y-1 ml-2">
                  <button
                    onClick={() => onApplyFormation(formation)}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    適用
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`"${formation.name}"を削除しますか？`)) {
                        onDeleteFormation(formation.id)
                      }
                    }}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default FormationTemplateManager