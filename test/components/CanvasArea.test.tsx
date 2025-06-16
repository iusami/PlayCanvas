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
  center: { x: 400, y: 300 }
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

  describe('エラーハンドリング', () => {
    it('空の配列でもエラーが発生しないこと', () => {
      const playWithEmptyArrays = {
        ...createMockPlay(),
        players: [],
        arrows: [],
        texts: []
      }
      
      const appStateWithEmptyPlay = {
        ...createMockAppState(),
        currentPlay: playWithEmptyArrays
      }
      
      expect(() => {
        render(<CanvasArea {...defaultProps} appState={appStateWithEmptyPlay} />)
      }).not.toThrow()
      
      expect(screen.getByText('プレイヤー: 0人')).toBeInTheDocument()
      expect(screen.getByText('矢印: 0本')).toBeInTheDocument()
      expect(screen.getByText('テキスト: 0個')).toBeInTheDocument()
    })
  })
})