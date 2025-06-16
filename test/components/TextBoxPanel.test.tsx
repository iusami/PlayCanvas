import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe, vi } from 'vitest'
import TextBoxPanel from '../../src/components/TextBoxPanel'
import { TextBoxEntry } from '../../src/types'

const createMockTextBoxEntries = (): TextBoxEntry[] => {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `textbox-${index + 1}`,
    shortText: '',
    longText: ''
  }))
}

const createMockTextBoxEntriesWithData = (): TextBoxEntry[] => {
  return [
    { id: 'textbox-1', shortText: '1', longText: 'スナップカウント' },
    { id: 'textbox-2', shortText: 'A', longText: 'オーディブル確認' },
    { id: 'textbox-3', shortText: '', longText: '' },
    { id: 'textbox-4', shortText: '', longText: '' },
    { id: 'textbox-5', shortText: '', longText: '' },
    { id: 'textbox-6', shortText: '', longText: '' },
    { id: 'textbox-7', shortText: '', longText: '' },
    { id: 'textbox-8', shortText: '', longText: '' },
    { id: 'textbox-9', shortText: '', longText: '' },
    { id: 'textbox-10', shortText: '', longText: '' }
  ]
}

describe('TextBoxPanel Component', () => {
  describe('初期レンダリング', () => {
    test('有効状態でパネルが正常にレンダリングされること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      expect(screen.getByText('メモ・説明')).toBeInTheDocument()
      expect(screen.getByText('左列：記号・番号（2文字まで）｜ 右列：説明文')).toBeInTheDocument()
      expect(screen.getByText('プレイごとに自動保存されます')).toBeInTheDocument()
    })

    test('無効状態で適切なメッセージが表示されること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={true}
        />
      )
      
      expect(screen.getByText('プレイを選択すると')).toBeInTheDocument()
      expect(screen.getByText('テキストボックスが利用できます')).toBeInTheDocument()
    })

    test('10行のテキストボックスが表示されること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      // 行番号1-10が表示されているか確認
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument()
      }
      
      // 短いテキストボックス（2文字用）が10個あること
      const shortTextBoxes = screen.getAllByPlaceholderText('記号')
      expect(shortTextBoxes).toHaveLength(10)
      
      // 長いテキストボックス（説明用）が10個あること
      const longTextBoxes = screen.getAllByPlaceholderText('説明・メモ')
      expect(longTextBoxes).toHaveLength(10)
    })
  })

  describe('データ表示', () => {
    test('既存のテキストボックス内容が正しく表示されること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntriesWithData()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      expect(screen.getByDisplayValue('1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('スナップカウント')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A')).toBeInTheDocument()
      expect(screen.getByDisplayValue('オーディブル確認')).toBeInTheDocument()
    })
  })

  describe('テキスト入力機能', () => {
    test('短いテキストボックスで2文字制限が機能すること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      const shortTextBox = screen.getAllByPlaceholderText('記号')[0]
      
      // onChange イベントを直接発生させて2文字制限をテスト
      fireEvent.change(shortTextBox, { target: { value: 'ABC' } })
      
      // 更新関数が呼ばれること
      expect(mockOnUpdate).toHaveBeenCalled()
      
      // 2文字制限が適用されていることを確認
      const calls = mockOnUpdate.mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0][0].shortText).toBe('AB') // 2文字に制限される
    })

    test('長いテキストボックスで文字制限がないこと', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      const longTextBox = screen.getAllByPlaceholderText('説明・メモ')[0]
      
      const longText = 'これは長いテキストの例です。特に文字制限はありません。'
      fireEvent.change(longTextBox, { target: { value: longText } })
      
      expect(mockOnUpdate).toHaveBeenCalled()
      const calls = mockOnUpdate.mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0][0].longText).toBe(longText)
    })

    test('異なる行のテキストボックスが独立して動作すること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      const shortTextBoxes = screen.getAllByPlaceholderText('記号')
      const longTextBoxes = screen.getAllByPlaceholderText('説明・メモ')
      
      // 1行目の短いテキストボックスに入力
      fireEvent.change(shortTextBoxes[0], { target: { value: '1' } })
      
      // 3行目の短いテキストボックスに入力
      fireEvent.change(shortTextBoxes[2], { target: { value: 'C' } })
      
      // 更新関数が適切に呼ばれていること
      expect(mockOnUpdate).toHaveBeenCalledTimes(2)
      
      // 各呼び出しが正しいindex と値で行われていることを確認
      const calls = mockOnUpdate.mock.calls
      
      // 1回目の呼び出し: 1行目(index 0)の短いテキストが'1'に更新
      expect(calls[0][0][0].shortText).toBe('1')
      expect(calls[0][0][1].shortText).toBe('') // 他の行は空のまま
      expect(calls[0][0][2].shortText).toBe('') // 他の行は空のまま
      
      // 2回目の呼び出し: 3行目(index 2)の短いテキストが'C'に更新
      expect(calls[1][0][0].shortText).toBe('') // 初期状態に戻る（元のpropsから）
      expect(calls[1][0][2].shortText).toBe('C')
    })
  })

  describe('アクセシビリティ', () => {
    test('フォーム要素に適切な属性が設定されていること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      const shortTextBoxes = screen.getAllByPlaceholderText('記号')
      const longTextBoxes = screen.getAllByPlaceholderText('説明・メモ')
      
      // 短いテキストボックスの属性確認
      expect(shortTextBoxes[0]).toHaveAttribute('type', 'text')
      expect(shortTextBoxes[0]).toHaveAttribute('maxLength', '2')
      
      // 長いテキストボックスの属性確認
      expect(longTextBoxes[0]).toHaveAttribute('type', 'text')
    })
  })

  describe('UI/UX', () => {
    test('適切なCSSクラスが適用されていること', () => {
      const mockOnUpdate = vi.fn()
      const mockEntries = createMockTextBoxEntries()
      
      const { container } = render(
        <TextBoxPanel 
          textBoxEntries={mockEntries}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      // パネル全体の幅が設定されていること
      const panel = container.querySelector('.w-80')
      expect(panel).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    test('空のエントリ配列でもエラーが発生しないこと', () => {
      const mockOnUpdate = vi.fn()
      
      render(
        <TextBoxPanel 
          textBoxEntries={[]}
          onUpdateTextBoxEntries={mockOnUpdate}
          disabled={false}
        />
      )
      
      expect(screen.getByText('メモ・説明')).toBeInTheDocument()
    })
  })
})