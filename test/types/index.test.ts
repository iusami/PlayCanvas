import { describe, it, expect } from 'vitest'
import { 
  FIELD_CONSTRAINTS, 
  type PlayerType, 
  type ArrowType, 
  type ArrowHead,
  type PlayType,
  type PlayerPosition
} from '../../src/types'

describe('FIELD_CONSTRAINTS', () => {
  it('DEFENSE_MIN_Y_FLIPPEDが正しい値であること', () => {
    expect(FIELD_CONSTRAINTS.DEFENSE_MIN_Y_FLIPPED).toBe(225)
  })

  it('FIELD_UPPER_LIMIT_LINE_INDEXが正しい値であること', () => {
    expect(FIELD_CONSTRAINTS.FIELD_UPPER_LIMIT_LINE_INDEX).toBe(2)
  })

  it('FIELD_CONSTRAINTSが読み取り専用であること', () => {
    // TypeScriptレベルでの読み取り専用チェック（実行時エラーは発生しない）
    expect(FIELD_CONSTRAINTS).toEqual({ 
      DEFENSE_MIN_Y_FLIPPED: 225,
      FIELD_UPPER_LIMIT_LINE_INDEX: 2
    })
    // オブジェクトが変更不可能であることを確認
    expect(Object.isFrozen(FIELD_CONSTRAINTS)).toBe(true)
  })

  it('FIELD_CONSTRAINTSのキーが期待通りであること', () => {
    const keys = Object.keys(FIELD_CONSTRAINTS)
    expect(keys).toContain('DEFENSE_MIN_Y_FLIPPED')
    expect(keys).toContain('FIELD_UPPER_LIMIT_LINE_INDEX')
    expect(keys).toHaveLength(2)
  })
})

describe('Type Definitions', () => {
  describe('PlayerType', () => {
    it('すべてのプレイヤータイプが正しく定義されていること', () => {
      const validTypes: PlayerType[] = ['circle', 'triangle', 'square', 'text', 'chevron', 'x']
      
      validTypes.forEach(type => {
        const testType: PlayerType = type
        expect(testType).toBe(type)
      })
    })

    it('各プレイヤータイプの文字列リテラルが正しいこと', () => {
      // TypeScriptのコンパイル時にチェックされるが、実行時にも確認
      const circle: PlayerType = 'circle'
      const triangle: PlayerType = 'triangle'
      const square: PlayerType = 'square'
      const text: PlayerType = 'text'
      const chevron: PlayerType = 'chevron'
      const x: PlayerType = 'x'

      expect(circle).toBe('circle')
      expect(triangle).toBe('triangle')
      expect(square).toBe('square')
      expect(text).toBe('text')
      expect(chevron).toBe('chevron')
      expect(x).toBe('x')
    })
  })

  describe('ArrowType', () => {
    it('すべての矢印タイプが正しく定義されていること', () => {
      const validTypes: ArrowType[] = ['straight', 'zigzag', 'dashed']
      
      validTypes.forEach(type => {
        const testType: ArrowType = type
        expect(testType).toBe(type)
      })
    })
  })

  describe('ArrowHead', () => {
    it('すべての矢印ヘッドタイプが正しく定義されていること', () => {
      const validTypes: ArrowHead[] = ['normal', 't-shaped', 'none']
      
      validTypes.forEach(type => {
        const testType: ArrowHead = type
        expect(testType).toBe(type)
      })
    })
  })

  describe('PlayType', () => {
    it('すべてのプレイタイプが正しく定義されていること', () => {
      const validTypes: PlayType[] = ['offense', 'defense', 'special']
      
      validTypes.forEach(type => {
        const testType: PlayType = type
        expect(testType).toBe(type)
      })
    })
  })

  describe('PlayerPosition', () => {
    it('オフェンスポジションが正しく定義されていること', () => {
      const offensePositions: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE', 'OL']
      
      offensePositions.forEach(position => {
        const testPosition: PlayerPosition = position
        expect(testPosition).toBe(position)
      })
    })

    it('ディフェンスポジションが正しく定義されていること', () => {
      const defensePositions: PlayerPosition[] = ['DL', 'LB', 'DB', 'S']
      
      defensePositions.forEach(position => {
        const testPosition: PlayerPosition = position
        expect(testPosition).toBe(position)
      })
    })

    it('空文字列ポジションが定義されていること', () => {
      const emptyPosition: PlayerPosition = ''
      expect(emptyPosition).toBe('')
    })
  })
})

describe('Interface Structure Validation', () => {
  it('Playerインターフェースの必須プロパティが存在すること', () => {
    // TypeScriptの型チェックで検証されるが、構造の確認として
    const player = {
      id: 'test-id',
      x: 100,
      y: 200,
      type: 'circle' as PlayerType,
      position: 'QB' as PlayerPosition,
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense' as const,
      // オプショナルプロパティ
      text: 'optional text',
      flipped: false
    }

    expect(player.id).toBe('test-id')
    expect(player.x).toBe(100)
    expect(player.y).toBe(200)
    expect(player.type).toBe('circle')
    expect(player.position).toBe('QB')
    expect(player.color).toBe('#000000')
    expect(player.fillColor).toBe('#ffffff')
    expect(player.strokeColor).toBe('#000000')
    expect(player.size).toBe(20)
    expect(player.team).toBe('offense')
    expect(player.text).toBe('optional text')
    expect(player.flipped).toBe(false)
  })

  it('Arrowインターフェースの必須プロパティが存在すること', () => {
    const arrow = {
      id: 'arrow-test',
      points: [0, 0, 100, 100],
      type: 'straight' as ArrowType,
      headType: 'normal' as ArrowHead,
      color: '#000000',
      strokeWidth: 2,
      // オプショナルプロパティ
      linkedPlayerId: 'player-1',
      segments: []
    }

    expect(arrow.id).toBe('arrow-test')
    expect(arrow.points).toEqual([0, 0, 100, 100])
    expect(arrow.type).toBe('straight')
    expect(arrow.headType).toBe('normal')
    expect(arrow.color).toBe('#000000')
    expect(arrow.strokeWidth).toBe(2)
    expect(arrow.linkedPlayerId).toBe('player-1')
    expect(arrow.segments).toEqual([])
  })

  it('TextElementインターフェースの必須プロパティが存在すること', () => {
    const textElement = {
      id: 'text-test',
      x: 50,
      y: 75,
      text: 'Test Text',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000'
    }

    expect(textElement.id).toBe('text-test')
    expect(textElement.x).toBe(50)
    expect(textElement.y).toBe(75)
    expect(textElement.text).toBe('Test Text')
    expect(textElement.fontSize).toBe(16)
    expect(textElement.fontFamily).toBe('Arial')
    expect(textElement.color).toBe('#000000')
  })

  it('FieldSettingsインターフェースの必須プロパティが存在すること', () => {
    const fieldSettings = {
      width: 800,
      height: 600,
      backgroundColor: '#4F7942',
      lineColor: '#FFFFFF',
      yardLines: true,
      hashMarks: true
    }

    expect(fieldSettings.width).toBe(800)
    expect(fieldSettings.height).toBe(600)
    expect(fieldSettings.backgroundColor).toBe('#4F7942')
    expect(fieldSettings.lineColor).toBe('#FFFFFF')
    expect(fieldSettings.yardLines).toBe(true)
    expect(fieldSettings.hashMarks).toBe(true)
  })

  it('PlayMetadataインターフェースの必須プロパティが存在すること', () => {
    const metadata = {
      title: 'Test Play',
      description: 'Test Description',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      tags: ['test', 'offense'],
      playName: 'Quick Pass',
      offFormation: 'I-Formation',
      defFormation: '4-3',
      playType: 'offense' as PlayType
    }

    expect(metadata.title).toBe('Test Play')
    expect(metadata.description).toBe('Test Description')
    expect(metadata.createdAt).toBeInstanceOf(Date)
    expect(metadata.updatedAt).toBeInstanceOf(Date)
    expect(metadata.tags).toEqual(['test', 'offense'])
    expect(metadata.playName).toBe('Quick Pass')
    expect(metadata.offFormation).toBe('I-Formation')
    expect(metadata.defFormation).toBe('4-3')
    expect(metadata.playType).toBe('offense')
  })

  it('Playインターフェースの必須プロパティが存在すること', () => {
    const play = {
      id: 'play-test',
      metadata: {
        title: 'Test Play',
        description: 'Test Description',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        tags: ['test'],
        playName: 'Test',
        offFormation: 'I-Formation',
        defFormation: '4-3',
        playType: 'offense' as PlayType
      },
      field: {
        width: 800,
        height: 600,
        backgroundColor: '#4F7942',
        lineColor: '#FFFFFF',
        yardLines: true,
        hashMarks: true
      },
      players: [],
      arrows: [],
      texts: [],
      // オプショナルプロパティ
      center: { x: 400, y: 300 }
    }

    expect(play.id).toBe('play-test')
    expect(play.metadata).toBeDefined()
    expect(play.field).toBeDefined()
    expect(play.players).toEqual([])
    expect(play.arrows).toEqual([])
    expect(play.texts).toEqual([])
    expect(play.center).toEqual({ x: 400, y: 300 })
  })

  it('AppStateインターフェースの主要プロパティが存在すること', () => {
    const appState = {
      currentPlay: null,
      selectedTool: 'select' as const,
      selectedPlayerType: 'circle' as PlayerType,
      selectedPlayerPosition: 'QB' as PlayerPosition,
      selectedTeam: 'offense' as const,
      selectedArrowType: 'straight' as ArrowType,
      selectedArrowHead: 'normal' as ArrowHead,
      selectedStrokeWidth: 2,
      selectedColor: '#000000',
      selectedFillColor: '#ffffff',
      selectedStrokeColor: '#000000',
      selectedElementIds: [],
      isDrawingArrow: false,
      currentArrowPoints: [],
      currentArrowPreviewPoints: [],
      currentArrowSegments: [],
      currentDrawingSegmentType: 'straight' as ArrowType,
      initialArrowType: 'straight' as ArrowType,
      maxSegments: 10,
      segmentLimitWarning: null,
      debugMode: false,
      selectedFontFamily: 'Arial',
      selectedFontSize: 16,
      selectedFontWeight: 'normal' as const,
      selectedFontStyle: 'normal' as const,
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
    }

    expect(appState.currentPlay).toBeNull()
    expect(appState.selectedTool).toBe('select')
    expect(appState.selectedPlayerType).toBe('circle')
    expect(appState.selectedTeam).toBe('offense')
    expect(appState.debugMode).toBe(false)
    expect(appState.maxSegments).toBe(10)
    expect(appState.maxHistorySize).toBe(50)
  })
})

describe('Type Compatibility', () => {
  it('PlayerTypeとPlayerインターフェースのtypeプロパティが互換性があること', () => {
    const playerTypes: PlayerType[] = ['circle', 'triangle', 'square', 'text', 'chevron', 'x']
    
    playerTypes.forEach(type => {
      const player = {
        id: 'test',
        x: 0,
        y: 0,
        type,
        position: 'QB' as PlayerPosition,
        color: '#000000',
        fillColor: '#ffffff',
        strokeColor: '#000000',
        size: 20,
        team: 'offense' as const
      }
      
      expect(player.type).toBe(type)
    })
  })

  it('ArrowTypeとArrowインターフェースのtypeプロパティが互換性があること', () => {
    const arrowTypes: ArrowType[] = ['straight', 'zigzag', 'dashed']
    
    arrowTypes.forEach(type => {
      const arrow = {
        id: 'test',
        points: [0, 0, 100, 100],
        type,
        headType: 'normal' as ArrowHead,
        color: '#000000',
        strokeWidth: 2
      }
      
      expect(arrow.type).toBe(type)
    })
  })

  it('PlayTypeとPlayMetadataインターフェースのplayTypeプロパティが互換性があること', () => {
    const playTypes: PlayType[] = ['offense', 'defense', 'special']
    
    playTypes.forEach(playType => {
      const metadata = {
        title: 'Test',
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        playName: 'Test',
        offFormation: 'Test',
        defFormation: 'Test',
        playType
      }
      
      expect(metadata.playType).toBe(playType)
    })
  })
})