import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface PasswordChangeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export function PasswordChangeForm({ isOpen, onClose, onSuccess, onError }: PasswordChangeFormProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { updatePassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    if (!newPassword || !confirmPassword) {
      onError('すべてのフィールドを入力してください')
      return
    }

    if (newPassword.length < 6) {
      onError('パスワードは6文字以上で入力してください')
      return
    }

    if (newPassword !== confirmPassword) {
      onError('新しいパスワードが一致しません')
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(newPassword)
      
      if (error) {
        onError(error.message || 'パスワードの変更に失敗しました')
      } else {
        onSuccess('パスワードを変更しました')
        handleClose()
      }
    } catch (err) {
      onError('予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    onClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            パスワード変更
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="6文字以上で入力してください"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="上記と同じパスワードを入力してください"
              disabled={loading}
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '変更中...' : 'パスワード変更'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            ※ パスワード変更後もログイン状態は維持されます。<br />
            ※ 新しいパスワードは6文字以上で設定してください。
          </p>
        </div>
      </div>
    </div>
  )
}