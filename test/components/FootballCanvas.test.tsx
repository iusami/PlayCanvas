import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import FootballCanvas from '../../src/components/FootballCanvas'
import { AppState, Play } from '../../src/types'

// Konvaのモック化
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children, ...props }: any) => (
    <div data-testid="konva-layer" {...props}>
      {children}
    </div>
  ),
  Rect: (props: any) => (
    <div data-testid="konva-rect" data-props={JSON.stringify(props)} />
  ),
  Line: (props: any) => (
    <div data-testid="konva-line" data-props={JSON.stringify(props)} />
  ),
  Circle: (props: any) => (
    <div data-testid="konva-circle" data-props={JSON.stringify(props)} />
  ),
  Text: (props: any) => (
    <div data-testid="konva-text" data-props={JSON.stringify(props)} />
  ),
  Group: ({ children, ...props }: any) => (
    <div data-testid="konva-group" {...props}>
      {children}
    </div>
  )
}))

vi.mock('konva', () => ({
  default: {
    Text: vi.fn().mockImplementation(() => ({
      setAttrs: vi.fn(),
      width: vi.fn(() => 100),
      height: vi.fn(() => 20),
      getTextWidth: vi.fn(() => 100),
      getTextHeight: vi.fn(() => 20)
    })),
    Stage: vi.fn(),
    Layer: vi.fn()
  }
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
      id: 'player-circle',
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
      id: 'player-triangle',
      x: 200,
      y: 200,
      type: 'triangle',
      position: 'RB',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense',
      flipped: false
    },
    {
      id: 'player-square',
      x: 300,
      y: 350,
      type: 'square',
      position: 'WR',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense'
    },
    {
      id: 'player-chevron',
      x: 500,
      y: 250,
      type: 'chevron',
      position: 'TE',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense',
      flipped: false
    },
    {
      id: 'player-text',
      x: 350,
      y: 400,
      type: 'text',
      position: 'OL',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense',
      text: 'C'
    },
    {
      id: 'player-x',
      x: 450,
      y: 150,
      type: 'x',
      position: 'WR',
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
  history: [],
  historyIndex: -1,
  maxHistorySize: 50
})

describe('FootballCanvas Component', () => {
  const mockUpdateAppState = vi.fn()
  const mockOnUpdatePlay = vi.fn()
  const mockOnNewPlay = vi.fn()
  const mockOnUndo = vi.fn()
  const mockOnRedo = vi.fn()

  const defaultProps = {
    play: createMockPlay(),
    appState: createMockAppState(),
    updateAppState: mockUpdateAppState,
    onUpdatePlay: mockOnUpdatePlay,
    onUndo: mockOnUndo,
    onRedo: mockOnRedo
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('キャンバスが正常にレンダリングされること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
      expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
    })

    it('プレイが存在しない場合はメッセージが表示されること', () => {
      render(<FootballCanvas {...defaultProps} play={null as any} />)
      
      expect(screen.getByText('プレイが読み込まれていません')).toBeInTheDocument()
    })
  })

  describe('フィールド描画', () => {
    it('フィールド背景が描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const fieldBackground = screen.getAllByTestId('konva-rect')[0]
      const props = JSON.parse(fieldBackground.getAttribute('data-props') || '{}')
      
      expect(props.width).toBe(800)
      expect(props.height).toBe(600)
      expect(props.fill).toBe('#4F7942')
    })

    it('ヤードラインが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      expect(lines.length).toBeGreaterThan(0)
    })

    it('フィールド反転時に適切な線が太くなること', () => {
      // フィールドが反転状態のプレイを作成
      const flippedPlay = {
        ...createMockPlay(),
        center: { x: 400, y: 225 } // 3番目の線付近（反転状態）
      }
      const appStateWithFlippedField = {
        ...createMockAppState(),
        currentPlay: flippedPlay
      }
      
      render(<FootballCanvas {...defaultProps} appState={appStateWithFlippedField} />)
      
      const lines = screen.getAllByTestId('konva-line')
      expect(lines.length).toBeGreaterThan(0)
      
      // 太い線（strokeWidth=4）が存在することを確認
      const thickLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.strokeWidth === 4
      })
      expect(thickLines.length).toBeGreaterThan(0)
    })
  })

  describe('プレイヤー描画', () => {
    it('円形プレイヤーが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const circles = screen.getAllByTestId('konva-circle')
      expect(circles.length).toBeGreaterThan(0)
      
      const circleProps = JSON.parse(circles[0].getAttribute('data-props') || '{}')
      expect(circleProps.radius).toBe(10) // size / 2
      expect(circleProps.fill).toBe('#ffffff')
      expect(circleProps.stroke).toBe('#000000')
    })

    it('三角形プレイヤーが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // 三角形（閉じたパス）を探す
      const triangleLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.closed === true && props.points && props.points.length >= 6
      })
      
      expect(triangleLines.length).toBeGreaterThan(0)
    })

    it('四角形プレイヤーが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const rects = screen.getAllByTestId('konva-rect')
      
      // フィールド背景以外の四角形を探す
      const playerRects = rects.filter(rect => {
        const props = JSON.parse(rect.getAttribute('data-props') || '{}')
        return props.width === 20 && props.height === 20 // プレイヤーサイズ
      })
      
      expect(playerRects.length).toBeGreaterThan(0)
    })

    it('シェブロンプレイヤーが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // シェブロン（開いたパス）を探す
      const chevronLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.closed === false && props.points && props.points.length === 6
      })
      
      expect(chevronLines.length).toBeGreaterThan(0)
    })

    it('テキストプレイヤーが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const texts = screen.getAllByTestId('konva-text')
      expect(texts.length).toBeGreaterThan(0)
      
      const textProps = JSON.parse(texts[0].getAttribute('data-props') || '{}')
      expect(textProps.fontFamily).toBe('Arial')
      expect(textProps.fontStyle).toBe('bold')
    })

    it('Xマークプレイヤーが描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const groups = screen.getAllByTestId('konva-group')
      expect(groups.length).toBeGreaterThan(0)
      
      // X型プレイヤーは2本の線で構成されるGroup
      const xGroups = groups.filter(group => {
        const lines = group.querySelectorAll('[data-testid="konva-line"]')
        return lines.length === 2
      })
      
      expect(xGroups.length).toBeGreaterThan(0)
    })
  })

  describe('矢印描画', () => {
    it('矢印が描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // 矢印本体の線を探す
      const arrowLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.points && props.points.length === 4 && props.strokeWidth === 2
      })
      
      expect(arrowLines.length).toBeGreaterThan(0)
    })
  })

  describe('テキスト要素描画', () => {
    it('テキスト要素が描画されること', () => {
      render(<FootballCanvas {...defaultProps} />)
      
      const texts = screen.getAllByTestId('konva-text')
      
      // フィールド上のテキスト要素を探す
      const fieldTexts = texts.filter(text => {
        const props = JSON.parse(text.getAttribute('data-props') || '{}')
        return props.text === 'Test Text'
      })
      
      expect(fieldTexts.length).toBeGreaterThan(0)
    })
  })

  describe('選択状態の表示', () => {
    it('選択されたプレイヤーが強調表示されること', () => {
      const appStateWithSelection = {
        ...createMockAppState(),
        selectedElementIds: ['player-circle']
      }
      
      render(<FootballCanvas {...defaultProps} appState={appStateWithSelection} />)
      
      const circles = screen.getAllByTestId('konva-circle')
      const selectedCircle = circles.find(circle => {
        const props = JSON.parse(circle.getAttribute('data-props') || '{}')
        return props.stroke === '#2563eb' && props.strokeWidth === 3
      })
      
      expect(selectedCircle).toBeTruthy()
    })
  })



  describe('キーボードショートカット', () => {
    it('Undoキーボードショートカットが機能すること', () => {
      const { container } = render(<FootballCanvas {...defaultProps} />)
      
      // Ctrl+Z キーイベントをシミュレート
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true
      })
      
      container.dispatchEvent(event)
      
      expect(mockOnUndo).toHaveBeenCalled()
    })

    it('Redoキーボードショートカットが機能すること', () => {
      const { container } = render(<FootballCanvas {...defaultProps} />)
      
      // Ctrl+Y キーイベントをシミュレート
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true
      })
      
      container.dispatchEvent(event)
      
      expect(mockOnRedo).toHaveBeenCalled()
    })
  })
})

// セグメント最適化関数のテスト（FootballCanvasから抽出）
describe('セグメント最適化関数', () => {
  // テスト用の関数を抽出（実際の実装では別ファイルに移動することを推奨）
  const optimizeSegments = (segments: any[]): any[] => {
    if (segments.length <= 1) return segments

    const optimized: any[] = []
    
    for (let i = 0; i < segments.length; i++) {
      const currentSegment = segments[i]
      
      if (!currentSegment || !currentSegment.points || currentSegment.points.length < 4) {
        continue
      }
      
      const startX = currentSegment.points[0]
      const startY = currentSegment.points[1]
      const endX = currentSegment.points[currentSegment.points.length - 2]
      const endY = currentSegment.points[currentSegment.points.length - 1]
      
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        continue
      }
      
      const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
      if (distance < 1) {
        continue
      }
      
      optimized.push(currentSegment)
    }
    
    return optimized
  }

  it('空のセグメント配列をそのまま返すこと', () => {
    expect(optimizeSegments([])).toEqual([])
  })

  it('単一セグメントをそのまま返すこと', () => {
    const segments = [{ points: [0, 0, 100, 100], type: 'straight' }]
    expect(optimizeSegments(segments)).toEqual(segments)
  })

  it('無効なセグメントを除外すること', () => {
    const segments = [
      { points: [0, 0, 100, 100], type: 'straight' }, // 有効
      { points: [0, 0], type: 'straight' }, // 無効（points不足）
      { points: [NaN, 0, 100, 100], type: 'straight' }, // 無効（NaN含む）
      { points: [0, 0, 0, 0], type: 'straight' }, // 無効（距離0）
      { points: [50, 50, 150, 150], type: 'straight' } // 有効
    ]
    
    const result = optimizeSegments(segments)
    expect(result).toHaveLength(2)
    expect(result[0].points).toEqual([0, 0, 100, 100])
    expect(result[1].points).toEqual([50, 50, 150, 150])
  })

  it('距離1未満のセグメントを除外すること', () => {
    const segments = [
      { points: [0, 0, 0.5, 0.5], type: 'straight' }, // 距離 < 1
      { points: [0, 0, 2, 2], type: 'straight' } // 距離 > 1
    ]
    
    const result = optimizeSegments(segments)
    expect(result).toHaveLength(1)
    expect(result[0].points).toEqual([0, 0, 2, 2])
  })
})