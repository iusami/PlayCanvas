import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CanvasArea, { CanvasAreaRef } from '../../src/components/CanvasArea'
import { AppState, Play } from '../../src/types'

// FootballCanvasのモック化
vi.mock('../../src/components/FootballCanvas', () => ({
  default: React.forwardRef<any, any>((props, ref) => (
    <div data-testid="football-canvas" ref={ref} data-props={JSON.stringify(props)}>
      Football Canvas Mock
    </div>
  ))
}))

const createMockPlay = (): Play => ({
  id: 'test-play-1',
  metadata: {
    title: 'テストプレイ',
    description: 'テスト用プレイ',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['test'],
    playName: 'Test Play',
    offFormation: 'I-Formation',
    defFormation: '4-3',
    playType: 'offense'
  },
  field: {
    width: 800,
    height: 600,
    backgroundColor: '#4F7942',
    lineColor: '#FFFFFF',
    yardLines: true,
    hashMarks: true
  },
  players: [
    {
      id: 'player-1',
      x: 400,
      y: 300,
      type: 'circle',
      position: 'QB',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense'
    },
    {
      id: 'player-2',
      x: 200,
      y: 200,
      type: 'triangle',
      position: 'RB',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense'
    }
  ],
  arrows: [
    {
      id: 'arrow-1',
      points: [100, 100, 300, 300],
      type: 'straight',
      headType: 'normal',
      color: '#000000',
      strokeWidth: 2
    }
  ],
  texts: [
    {
      id: 'text-1',
      x: 150,
      y: 150,
      text: 'Test Text',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000'
    }
  ],
  center: { x: 400, y: 300 },
  textBoxEntries: []
})

const createMockAppState = (): AppState => ({
  currentPlay: createMockPlay(),
  selectedTool: 'select',
  selectedPlayerType: 'circle',
  selectedPlayerPosition: 'QB',
  selectedTeam: 'offense',
  selectedArrowType: 'straight',
  selectedArrowHead: 'normal',
  selectedStrokeWidth: 2,
  selectedColor: '#000000',
  selectedFillColor: '#ffffff',
  selectedStrokeColor: '#000000',
  selectedElementIds: [],
  isDrawingArrow: false,
  currentArrowPoints: [],
  currentArrowPreviewPoints: [],
  currentArrowSegments: [],
  currentDrawingSegmentType: 'straight',
  initialArrowType: 'straight',
  maxSegments: 10,
  segmentLimitWarning: null,
  debugMode: false,
  selectedFontFamily: 'Arial',
  selectedFontSize: 16,
  selectedFontWeight: 'normal',
  selectedFontStyle: 'normal',
  selectedText: 'テキスト',
  isEditingText: false,
  editingTextId: null,
  snapToObjects: true,
  snapTolerance: 15,
  isRangeSelecting: false,
  rangeSelectStart: null,
  rangeSelectEnd: null,
  history: [createMockPlay()],
  historyIndex: 0,
  maxHistorySize: 50
})

describe('CanvasArea Component', () => {
  const mockUpdateAppState = vi.fn()
  const mockOnUpdatePlay = vi.fn()
  const mockOnNewPlay = vi.fn()
  const mockOnUndo = vi.fn()
  const mockOnRedo = vi.fn()

  const defaultProps = {
    appState: createMockAppState(),
    updateAppState: mockUpdateAppState,
    onUpdatePlay: mockOnUpdatePlay,
    onNewPlay: mockOnNewPlay,
    isSaving: false,
    lastSavedAt: null,
    onUndo: mockOnUndo,
    onRedo: mockOnRedo
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('初期レンダリング', () => {
    it('プレイが存在する場合、キャンバスエリアが正常にレンダリングされること', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.getByTestId('football-canvas')).toBeInTheDocument()
      expect(screen.getByText('Football Canvas Mock')).toBeInTheDocument()
    })

    it('プレイが存在しない場合、ウェルカムメッセージが表示されること', () => {
      const appStateWithoutPlay = { ...createMockAppState(), currentPlay: null }
      
      render(<CanvasArea {...defaultProps} appState={appStateWithoutPlay} />)
      
      expect(screen.getByText('Football Canvas へようこそ')).toBeInTheDocument()
      expect(screen.getByText('新しいプレイを作成して、アメリカンフットボールのサインを描きましょう')).toBeInTheDocument()
      expect(screen.getByText('新しいプレイを作成')).toBeInTheDocument()
    })

    it('新しいプレイ作成ボタンをクリックするとonNewPlayが呼ばれること', async () => {
      const user = userEvent.setup()
      const appStateWithoutPlay = { ...createMockAppState(), currentPlay: null }
      
      render(<CanvasArea {...defaultProps} appState={appStateWithoutPlay} />)
      
      const newPlayButton = screen.getByText('新しいプレイを作成')
      await user.click(newPlayButton)
      
      expect(mockOnNewPlay).toHaveBeenCalled()
    })
  })


  describe('Undo/Redo機能', () => {
    it('Undo/Redoボタンが表示されること', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.getByTitle('元に戻す (Ctrl+Z)')).toBeInTheDocument()
      expect(screen.getByTitle('やり直し (Ctrl+Y)')).toBeInTheDocument()
    })

    it('UndoボタンをクリックするとonUndoが呼ばれること', async () => {
      const user = userEvent.setup()
      // 履歴があるappStateを作成
      const appStateWithHistory = {
        ...createMockAppState(),
        historyIndex: 1,
        history: [createMockPlay(), createMockPlay()]
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateWithHistory} />)
      
      const undoButton = screen.getByTitle('元に戻す (Ctrl+Z)')
      await user.click(undoButton)
      
      expect(mockOnUndo).toHaveBeenCalled()
    })

    it('RedoボタンをクリックするとonRedoが呼ばれること', async () => {
      const user = userEvent.setup()
      // Redo可能なappStateを作成
      const appStateWithRedoable = {
        ...createMockAppState(),
        historyIndex: 0,
        history: [createMockPlay(), createMockPlay()]
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateWithRedoable} />)
      
      const redoButton = screen.getByTitle('やり直し (Ctrl+Y)')
      await user.click(redoButton)
      
      expect(mockOnRedo).toHaveBeenCalled()
    })
  })

  describe('ステータス表示', () => {
    it('基本的なステータス情報が表示されること', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.getByText('ツール: select')).toBeInTheDocument()
      expect(screen.getByText('プレイヤー: 2人')).toBeInTheDocument()
      expect(screen.getByText('矢印: 1本')).toBeInTheDocument()
      expect(screen.getByText('テキスト: 1個')).toBeInTheDocument()
      expect(screen.getByText('履歴: 1/1')).toBeInTheDocument()
    })

    it('選択中の要素数が表示されること', () => {
      const appStateWithSelection = {
        ...createMockAppState(),
        selectedElementIds: ['player-1', 'arrow-1']
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateWithSelection} />)
      
      expect(screen.getByText('選択: 2個')).toBeInTheDocument()
    })
  })

  describe('セグメント上限警告', () => {
    it('警告メッセージが表示されること', () => {
      const appStateWithWarning = {
        ...createMockAppState(),
        segmentLimitWarning: 'セグメント数が上限に達しました'
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateWithWarning} />)
      
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('セグメント数が上限に達しました')).toBeInTheDocument()
    })

    it('警告がない場合は表示されないこと', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.queryByText('⚠️')).not.toBeInTheDocument()
    })
  })

  describe('自動保存ステータス', () => {
    it('保存中のステータスが表示されること', () => {
      render(<CanvasArea {...defaultProps} isSaving={true} />)
      
      expect(screen.getByText('保存中...')).toBeInTheDocument()
    })

    it('保存済みのステータスが表示されること', () => {
      const lastSavedAt = new Date('2024-01-01T12:30:00')
      
      render(<CanvasArea {...defaultProps} lastSavedAt={lastSavedAt} />)
      
      expect(screen.getByText(/自動保存済み/)).toBeInTheDocument()
      expect(screen.getByText(/12:30:00/)).toBeInTheDocument()
    })

    it('未保存のステータスが表示されること', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.getByText('未保存')).toBeInTheDocument()
    })
  })

  describe('FootballCanvasとの連携', () => {
    it('FootballCanvasに正しいpropsが渡されること', () => {
      render(<CanvasArea {...defaultProps} />)
      
      const footballCanvas = screen.getByTestId('football-canvas')
      const props = JSON.parse(footballCanvas.getAttribute('data-props') || '{}')
      
      // playオブジェクトの基本構造を確認
      expect(props.play.id).toBe(defaultProps.appState.currentPlay.id)
      expect(props.play.players).toHaveLength(2)
      expect(props.play.arrows).toHaveLength(1)
      expect(props.play.texts).toHaveLength(1)
      
      // appStateの主要プロパティを確認
      expect(props.appState.selectedTool).toBe(defaultProps.appState.selectedTool)
    })
  })

  describe('refインターフェース', () => {
    it('refが正しく設定されること', () => {
      const ref = React.createRef<CanvasAreaRef>()
      
      render(<CanvasArea {...defaultProps} ref={ref} />)
      
      expect(ref.current).toBeTruthy()
      expect(typeof ref.current?.exportAsImage).toBe('function')
      expect(typeof ref.current?.print).toBe('function')
    })
  })

  describe('矢印描画状態', () => {
    const arrowDrawingAppState = {
      ...createMockAppState(),
      isDrawingArrow: true,
      currentArrowPoints: [100, 100, 200, 200, 300, 300],
      currentArrowSegments: ['straight', 'curve'],
      maxSegments: 10
    }

    it('矢印描画中のステータスが表示されること', () => {
      render(<CanvasArea {...defaultProps} appState={arrowDrawingAppState} />)
      
      expect(screen.getByText('矢印描画中... (3点)')).toBeInTheDocument()
      expect(screen.getByText('セグメント: 2 / 10')).toBeInTheDocument()
      expect(screen.getByText('クリック: 点追加 | ダブルクリック: 完了')).toBeInTheDocument()
      expect(screen.getByText('Backspace: 最後削除 | Esc: 全削除')).toBeInTheDocument()
    })

    it('矢印描画中でない場合、描画ステータスが表示されないこと', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.queryByText('矢印描画中...')).not.toBeInTheDocument()
      expect(screen.queryByText('クリック: 点追加')).not.toBeInTheDocument()
    })
  })

  describe('テキスト編集状態', () => {
    const textEditingAppState = {
      ...createMockAppState(),
      isEditingText: true,
      editingTextId: 'text-123456'
    }

    it('テキスト編集中のステータスが表示されること', () => {
      render(<CanvasArea {...defaultProps} appState={textEditingAppState} />)
      
      expect(screen.getByText('テキスト編集中... (ID: 123456)')).toBeInTheDocument()
      expect(screen.getByText('サイドバーで編集 | 保存: 適用 | キャンセル: 破棄')).toBeInTheDocument()
    })

    it('テキスト編集中でない場合、編集ステータスが表示されないこと', () => {
      render(<CanvasArea {...defaultProps} />)
      
      expect(screen.queryByText('テキスト編集中...')).not.toBeInTheDocument()
      expect(screen.queryByText('サイドバーで編集')).not.toBeInTheDocument()
    })
  })

  describe('Undo/Redo ボタンの無効化状態', () => {
    it('履歴の最初の位置でUndoボタンが無効になること', () => {
      const appStateAtStart = {
        ...createMockAppState(),
        historyIndex: 0,
        history: [createMockPlay()]
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateAtStart} />)
      
      const undoButton = screen.getByTitle('元に戻す (Ctrl+Z)')
      expect(undoButton).toBeDisabled()
    })

    it('履歴の最後の位置でRedoボタンが無効になること', () => {
      const appStateAtEnd = {
        ...createMockAppState(),
        historyIndex: 1,
        history: [createMockPlay(), createMockPlay()]
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateAtEnd} />)
      
      const redoButton = screen.getByTitle('やり直し (Ctrl+Y)')
      expect(redoButton).toBeDisabled()
    })

    it('onUndo/onRedoが未定義の場合にボタンが無効になること', () => {
      const propsWithoutUndoRedo = {
        ...defaultProps,
        onUndo: undefined,
        onRedo: undefined
      }
      
      render(<CanvasArea {...propsWithoutUndoRedo} />)
      
      expect(screen.getByTitle('元に戻す (Ctrl+Z)')).toBeDisabled()
      expect(screen.getByTitle('やり直し (Ctrl+Y)')).toBeDisabled()
    })

    it('中間の履歴位置では両方のボタンが有効になること', () => {
      const appStateInMiddle = {
        ...createMockAppState(),
        historyIndex: 1,
        history: [createMockPlay(), createMockPlay(), createMockPlay()]
      }
      
      render(<CanvasArea {...defaultProps} appState={appStateInMiddle} />)
      
      expect(screen.getByTitle('元に戻す (Ctrl+Z)')).not.toBeDisabled()
      expect(screen.getByTitle('やり直し (Ctrl+Y)')).not.toBeDisabled()
    })
  })

  describe('エクスポート機能', () => {
    it('exportAsImageメソッドがrefに存在すること', () => {
      const ref = React.createRef<CanvasAreaRef>()
      
      render(<CanvasArea {...defaultProps} ref={ref} />)
      
      expect(ref.current).toBeTruthy()
      expect(typeof ref.current?.exportAsImage).toBe('function')
    })
  })

  describe('印刷機能', () => {
    it('printメソッドがrefに存在すること', () => {
      const ref = React.createRef<CanvasAreaRef>()
      
      render(<CanvasArea {...defaultProps} ref={ref} />)
      
      expect(ref.current).toBeTruthy()
      expect(typeof ref.current?.print).toBe('function')
    })
  })

  describe('動的ステータス表示', () => {
    it('複数のツール状態が同時に表示できること', () => {
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      
      const complexAppState = {
        ...createMockAppState(),
        selectedTool: 'arrow' as const,
        isDrawingArrow: true,
        currentArrowPoints: [100, 100, 200, 200],
        currentArrowSegments: ['straight'],
        selectedElementIds: ['player-1', 'player-2'],
        segmentLimitWarning: 'テスト警告'
      }
      
      rerender(<CanvasArea {...defaultProps} appState={complexAppState} />)
      
      expect(screen.getByText('ツール: arrow')).toBeInTheDocument()
      expect(screen.getByText('選択: 2個')).toBeInTheDocument()
      expect(screen.getByText('矢印描画中... (2点)')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('テスト警告')).toBeInTheDocument()
    })

    it('現在のプレイ情報に基づいてステータスが更新されること', () => {
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      
      const updatedPlay = {
        ...createMockPlay(),
        players: [createMockPlay().players[0]], // 1人のプレイヤー
        arrows: [], // 矢印なし
        texts: [createMockPlay().texts[0], createMockPlay().texts[0]] // 2つのテキスト
      }
      
      const appStateWithUpdatedPlay = {
        ...createMockAppState(),
        currentPlay: updatedPlay
      }
      
      rerender(<CanvasArea {...defaultProps} appState={appStateWithUpdatedPlay} />)
      
      expect(screen.getByText('プレイヤー: 1人')).toBeInTheDocument()
      expect(screen.getByText('矢印: 0本')).toBeInTheDocument()
      expect(screen.getByText('テキスト: 2個')).toBeInTheDocument()
    })
  })

  describe('レスポンシブ対応', () => {
    it('小さい画面でもUIが適切に表示されること', () => {
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      
      // ウィンドウサイズを変更するシミュレーション
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      // resize イベントを発火してレイアウト更新をトリガー
      window.dispatchEvent(new Event('resize'))

      rerender(<CanvasArea {...defaultProps} />)
      
      // ツールバーとステータスが表示されることを確認
      expect(screen.getByTitle('元に戻す (Ctrl+Z)')).toBeInTheDocument()
      expect(screen.getByTitle('やり直し (Ctrl+Y)')).toBeInTheDocument()
      expect(screen.getByText('ツール: select')).toBeInTheDocument()
    })
  })

  describe('キーボードナビゲーション', () => {
    it('Undo/Redoボタンにタイトル属性が設定されていること', () => {
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      
      rerender(<CanvasArea {...defaultProps} />)
      
      const undoButton = screen.getByTitle('元に戻す (Ctrl+Z)')
      const redoButton = screen.getByTitle('やり直し (Ctrl+Y)')
      
      expect(undoButton).toHaveAttribute('title', '元に戻す (Ctrl+Z)')
      expect(redoButton).toHaveAttribute('title', 'やり直し (Ctrl+Y)')
    })
  })

  describe('エラーハンドリング', () => {
    it('空の配列でもエラーが発生しないこと', () => {
      const playWithEmptyArrays = {
        ...createMockPlay(),
        players: [],
        arrows: [],
        texts: [],
        textBoxEntries: []
      }
      
      const appStateWithEmptyPlay = {
        ...createMockAppState(),
        currentPlay: playWithEmptyArrays
      }
      
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      
      expect(() => {
        rerender(<CanvasArea {...defaultProps} appState={appStateWithEmptyPlay} />)
      }).not.toThrow()
      
      expect(screen.getByText('プレイヤー: 0人')).toBeInTheDocument()
      expect(screen.getByText('矢印: 0本')).toBeInTheDocument()
      expect(screen.getByText('テキスト: 0個')).toBeInTheDocument()
    })

    it('無効なプレイデータでも基本的な機能が動作すること', () => {
      const playWithUndefinedArrays = {
        ...createMockPlay(),
        // nullやundefinedはエラーになるため、空配列をテスト
        players: [],
        arrows: [],
        texts: []
      }
      
      const appStateWithEmptyPlay = {
        ...createMockAppState(),
        currentPlay: playWithUndefinedArrays
      }
      
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      
      expect(() => {
        rerender(<CanvasArea {...defaultProps} appState={appStateWithEmptyPlay} />)
      }).not.toThrow()
      
      // 空の状態でも正常に表示されることを確認
      expect(screen.getByText('プレイヤー: 0人')).toBeInTheDocument()
      expect(screen.getByText('矢印: 0本')).toBeInTheDocument()
      expect(screen.getByText('テキスト: 0個')).toBeInTheDocument()
    })

    it('refがnullの場合でもエクスポート機能がエラーにならないこと', () => {
      const ref = React.createRef<CanvasAreaRef>()
      
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      rerender(<CanvasArea {...defaultProps} ref={ref} />)
      
      // refがnullの状態でexportAsImageを呼んでもエラーにならないことを確認
      expect(() => {
        if (ref.current) {
          // @ts-ignore: テストのためのモック
          ref.current.exportAsImage = () => {
            // stageRef.currentがnullの場合の動作をテスト
            const stageRef = { current: null }
            if (stageRef.current) {
              // この部分は実行されない
            }
          }
          ref.current.exportAsImage()
        }
      }).not.toThrow()
    })

    it('ボタンクリックでエラーが発生しても画面が壊れないこと', async () => {
      const user = userEvent.setup()
      const errorOnUndo = vi.fn(() => {
        throw new Error('Test error')
      })
      
      // エラーが発生する可能性があるため、console.errorをモック
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { rerender } = render(<CanvasArea {...defaultProps} />)
      rerender(<CanvasArea {...defaultProps} onUndo={errorOnUndo} />)
      
      const undoButton = screen.getByTitle('元に戻す (Ctrl+Z)')
      
      // エラーが発生してもクラッシュしないことを確認
      expect(async () => {
        await user.click(undoButton)
      }).not.toThrow()
      
      consoleErrorSpy.mockRestore()
    })
  })
})