import React from 'react'
import { TextBoxEntry } from '../types'

interface TextBoxPanelProps {
  textBoxEntries: TextBoxEntry[]
  onUpdateTextBoxEntries: (entries: TextBoxEntry[]) => void
  disabled?: boolean
}

const TextBoxPanel: React.FC<TextBoxPanelProps> = ({
  textBoxEntries,
  onUpdateTextBoxEntries,
  disabled = false
}) => {
  const handleShortTextChange = (index: number, value: string) => {
    // 3文字制限
    const limitedValue = value.slice(0, 3)
    const updatedEntries = [...textBoxEntries]
    updatedEntries[index] = {
      ...updatedEntries[index],
      shortText: limitedValue
    }
    onUpdateTextBoxEntries(updatedEntries)
  }

  const handleLongTextChange = (index: number, value: string) => {
    const updatedEntries = [...textBoxEntries]
    updatedEntries[index] = {
      ...updatedEntries[index],
      longText: value
    }
    onUpdateTextBoxEntries(updatedEntries)
  }

  const handleLongTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      e.stopPropagation()
      const target = e.target as HTMLTextAreaElement
      target.select()
    }
  }

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.max(textarea.scrollHeight, 32)}px`
  }

  const handleTextareaInput = (index: number, value: string, textarea: HTMLTextAreaElement) => {
    handleLongTextChange(index, value)
    adjustTextareaHeight(textarea)
  }

  if (disabled) {
    return (
      <div className="w-80 bg-gray-100 border-l border-gray-300 p-4">
        <div className="text-center text-gray-500 mt-8">
          <div className="text-lg mb-2">📝</div>
          <div className="text-sm">プレイを選択すると</div>
          <div className="text-sm">テキストボックスが利用できます</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-300 p-4 overflow-y-auto">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">メモ・説明</h3>
        <div className="text-xs text-gray-500 mb-3">
          左列：記号・番号（3文字まで）｜ 右列：説明文
        </div>
      </div>
      
      <div className="space-y-2">
        {textBoxEntries.map((entry, index) => (
          <div key={entry.id} className="flex gap-2 items-start">
            {/* 行番号 */}
            <div className="w-6 text-xs text-gray-400 text-right pt-2">
              {index + 1}
            </div>
            
            {/* 1列目: 短いテキスト（3文字まで） */}
            <input
              type="text"
              value={entry.shortText}
              onChange={(e) => handleShortTextChange(index, e.target.value)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-center"
              placeholder="記号"
              maxLength={3}
            />
            
            {/* 2列目: 長いテキスト（textarea） */}
            <textarea
              value={entry.longText}
              onChange={(e) => handleTextareaInput(index, e.target.value, e.target)}
              onKeyDown={handleLongTextKeyDown}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 mr-2 resize-none overflow-hidden min-h-[32px]"
              placeholder="説明・メモ"
              rows={1}
            />
          </div>
        ))}
      </div>
      
      {/* フッター情報 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          プレイごとに自動保存されます
        </div>
      </div>
    </div>
  )
}

export default TextBoxPanel