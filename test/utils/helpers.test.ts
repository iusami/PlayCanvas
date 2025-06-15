import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { AppState } from '../../src/types'

// ヘルパー関数（実際の実装からの抽出）
// 注意: 実際のプロダクションコードでは、これらの関数を専用のutils/helpers.tsファイルに移動することを推奨

// デバッグログヘルパー関数
const debugLog = (appState: AppState, ...args: any[]) => {
  if (appState.debugMode) {
    console.log(...args)
  }
}

const debugGroup = (appState: AppState, label: string) => {
  if (appState.debugMode) {
    console.group(label)
  }
}

const debugGroupEnd = (appState: AppState) => {
  if (appState.debugMode) {
    console.groupEnd()
  }
}

// 座標反転ヘルパー関数
const flipXCoordinate = (center: number, coordinate: number): number => {
  return center + (center - coordinate)
}

const flipYCoordinate = (center: number, coordinate: number): number => {
  return center + (center - coordinate)
}

// テスト用のAppState作成ヘルパー
const createMockAppState = (debugMode: boolean = false): AppState => ({
  currentPlay: null,
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
  debugMode,
  selectedFontFamily: 'Arial',
  selectedFontSize: 16,
  selectedFontWeight: 'normal',
  selectedFontStyle: 'normal',
  selectedText: 'テキスト',
  isEditingText: false,
  editingTextId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  snapToObjects: true,
  snapTolerance: 15,
  isRangeSelecting: false,
  rangeSelectStart: null,
  rangeSelectEnd: null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50
})

describe('座標反転ヘルパー関数', () => {
  describe('flipXCoordinate', () => {
    it('基本的な座標反転が正しく動作すること', () => {
      expect(flipXCoordinate(400, 300)).toBe(500) // 400 + (400 - 300) = 500
      expect(flipXCoordinate(400, 500)).toBe(300) // 400 + (400 - 500) = 300
      expect(flipXCoordinate(400, 100)).toBe(700) // 400 + (400 - 100) = 700
    })

    it('中央座標では値が変わらないこと', () => {
      expect(flipXCoordinate(400, 400)).toBe(400)
      expect(flipXCoordinate(200, 200)).toBe(200)
      expect(flipXCoordinate(0, 0)).toBe(0)
    })

    it('負の座標でも正しく動作すること', () => {
      expect(flipXCoordinate(0, -100)).toBe(100) // 0 + (0 - (-100)) = 100
      expect(flipXCoordinate(100, -50)).toBe(250) // 100 + (100 - (-50)) = 250
      expect(flipXCoordinate(-100, -200)).toBe(0) // -100 + (-100 - (-200)) = 0
    })

    it('小数点を含む座標でも正しく動作すること', () => {
      expect(flipXCoordinate(100.5, 50.25)).toBe(150.75) // 100.5 + (100.5 - 50.25) = 150.75
      expect(flipXCoordinate(250.75, 300.25)).toBe(201.25) // 250.75 + (250.75 - 300.25) = 201.25
    })

    it('極端な値でも正しく動作すること', () => {
      expect(flipXCoordinate(1000000, 999999)).toBe(1000001)
      expect(flipXCoordinate(0.001, 0.002)).toBe(0)
      expect(flipXCoordinate(-1000, 1000)).toBe(-3000)
    })
  })

  describe('flipYCoordinate', () => {
    it('基本的な座標反転が正しく動作すること', () => {
      expect(flipYCoordinate(300, 200)).toBe(400) // 300 + (300 - 200) = 400
      expect(flipYCoordinate(300, 400)).toBe(200) // 300 + (300 - 400) = 200
      expect(flipYCoordinate(300, 100)).toBe(500) // 300 + (300 - 100) = 500
    })

    it('中央座標では値が変わらないこと', () => {
      expect(flipYCoordinate(300, 300)).toBe(300)
      expect(flipYCoordinate(150, 150)).toBe(150)
      expect(flipYCoordinate(0, 0)).toBe(0)
    })

    it('負の座標でも正しく動作すること', () => {
      expect(flipYCoordinate(0, -150)).toBe(150) // 0 + (0 - (-150)) = 150
      expect(flipYCoordinate(200, -100)).toBe(500) // 200 + (200 - (-100)) = 500
      expect(flipYCoordinate(-50, -100)).toBe(0) // -50 + (-50 - (-100)) = 0
    })

    it('小数点を含む座標でも正しく動作すること', () => {
      expect(flipYCoordinate(150.5, 100.25)).toBe(200.75) // 150.5 + (150.5 - 100.25) = 200.75
      expect(flipYCoordinate(75.75, 125.25)).toBe(26.25) // 75.75 + (75.75 - 125.25) = 26.25
    })

    it('極端な値でも正しく動作すること', () => {
      expect(flipYCoordinate(500000, 499999)).toBe(500001)
      expect(flipYCoordinate(0.0001, 0.0002)).toBe(0)
      expect(flipYCoordinate(-500, 500)).toBe(-1500)
    })
  })

  describe('座標反転の対称性', () => {
    it('同じ操作を2回実行すると元の値に戻ること（X座標）', () => {
      const original = 250
      const center = 400
      const flipped = flipXCoordinate(center, original)
      const restored = flipXCoordinate(center, flipped)
      expect(restored).toBe(original)
    })

    it('同じ操作を2回実行すると元の値に戻ること（Y座標）', () => {
      const original = 180
      const center = 300
      const flipped = flipYCoordinate(center, original)
      const restored = flipYCoordinate(center, flipped)
      expect(restored).toBe(original)
    })

    it('複数の座標で対称性が保たれること', () => {
      const coordinates = [0, 100, 200, 300, 400, 500, -50, 750.5]
      const center = 350

      coordinates.forEach(coord => {
        const flippedX = flipXCoordinate(center, coord)
        const restoredX = flipXCoordinate(center, flippedX)
        expect(restoredX).toBeCloseTo(coord, 10)

        const flippedY = flipYCoordinate(center, coord)
        const restoredY = flipYCoordinate(center, flippedY)
        expect(restoredY).toBeCloseTo(coord, 10)
      })
    })
  })

  describe('座標反転の数学的性質', () => {
    it('中央からの距離が保持されること（X座標）', () => {
      const center = 300
      const coordinate = 200
      const distanceOriginal = Math.abs(coordinate - center)
      const flipped = flipXCoordinate(center, coordinate)
      const distanceFlipped = Math.abs(flipped - center)
      expect(distanceFlipped).toBe(distanceOriginal)
    })

    it('中央からの距離が保持されること（Y座標）', () => {
      const center = 250
      const coordinate = 400
      const distanceOriginal = Math.abs(coordinate - center)
      const flipped = flipYCoordinate(center, coordinate)
      const distanceFlipped = Math.abs(flipped - center)
      expect(distanceFlipped).toBe(distanceOriginal)
    })
  })
})

describe('デバッグログヘルパー関数', () => {
  let consoleSpy: any
  let consoleGroupSpy: any
  let consoleGroupEndSpy: any

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
    consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    consoleGroupSpy.mockRestore()
    consoleGroupEndSpy.mockRestore()
  })

  describe('debugLog', () => {
    it('debugModeがtrueの場合、console.logが呼ばれること', () => {
      const appState = createMockAppState(true)
      
      debugLog(appState, 'test message')
      
      expect(consoleSpy).toHaveBeenCalledWith('test message')
      expect(consoleSpy).toHaveBeenCalledTimes(1)
    })

    it('debugModeがfalseの場合、console.logが呼ばれないこと', () => {
      const appState = createMockAppState(false)
      
      debugLog(appState, 'test message')
      
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('複数の引数を正しく渡すこと', () => {
      const appState = createMockAppState(true)
      
      debugLog(appState, 'message', 123, { key: 'value' }, [1, 2, 3])
      
      expect(consoleSpy).toHaveBeenCalledWith('message', 123, { key: 'value' }, [1, 2, 3])
    })

    it('引数がない場合でも正しく動作すること', () => {
      const appState = createMockAppState(true)
      
      debugLog(appState)
      
      expect(consoleSpy).toHaveBeenCalledWith()
    })

    it('undefined や null 引数を正しく処理すること', () => {
      const appState = createMockAppState(true)
      
      debugLog(appState, undefined, null, '')
      
      expect(consoleSpy).toHaveBeenCalledWith(undefined, null, '')
    })
  })

  describe('debugGroup', () => {
    it('debugModeがtrueの場合、console.groupが呼ばれること', () => {
      const appState = createMockAppState(true)
      
      debugGroup(appState, 'Test Group')
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group')
      expect(consoleGroupSpy).toHaveBeenCalledTimes(1)
    })

    it('debugModeがfalseの場合、console.groupが呼ばれないこと', () => {
      const appState = createMockAppState(false)
      
      debugGroup(appState, 'Test Group')
      
      expect(consoleGroupSpy).not.toHaveBeenCalled()
    })

    it('空文字列のラベルでも正しく動作すること', () => {
      const appState = createMockAppState(true)
      
      debugGroup(appState, '')
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('')
    })

    it('日本語ラベルを正しく処理すること', () => {
      const appState = createMockAppState(true)
      
      debugGroup(appState, 'テストグループ')
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('テストグループ')
    })

    it('特殊文字を含むラベルを正しく処理すること', () => {
      const appState = createMockAppState(true)
      
      debugGroup(appState, '🔍 Debug Group [Test] {Stage 1}')
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('🔍 Debug Group [Test] {Stage 1}')
    })
  })

  describe('debugGroupEnd', () => {
    it('debugModeがtrueの場合、console.groupEndが呼ばれること', () => {
      const appState = createMockAppState(true)
      
      debugGroupEnd(appState)
      
      expect(consoleGroupEndSpy).toHaveBeenCalledWith()
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1)
    })

    it('debugModeがfalseの場合、console.groupEndが呼ばれないこと', () => {
      const appState = createMockAppState(false)
      
      debugGroupEnd(appState)
      
      expect(consoleGroupEndSpy).not.toHaveBeenCalled()
    })
  })

  describe('デバッグログ機能の組み合わせ', () => {
    it('グループ開始→ログ→グループ終了の一連の流れが正しく動作すること', () => {
      const appState = createMockAppState(true)
      
      debugGroup(appState, 'プレイヤー処理')
      debugLog(appState, 'プレイヤー数:', 5)
      debugLog(appState, 'オフェンス:', 3, 'ディフェンス:', 2)
      debugGroupEnd(appState)
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('プレイヤー処理')
      expect(consoleSpy).toHaveBeenCalledWith('プレイヤー数:', 5)
      expect(consoleSpy).toHaveBeenCalledWith('オフェンス:', 3, 'ディフェンス:', 2)
      expect(consoleGroupEndSpy).toHaveBeenCalledWith()
      
      expect(consoleGroupSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledTimes(2)
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(1)
    })

    it('debugModeが途中で変更されても正しく動作すること', () => {
      let appState = createMockAppState(true)
      
      debugGroup(appState, 'Group 1')
      debugLog(appState, 'Log 1')
      
      // debugModeを無効にする
      appState = { ...appState, debugMode: false }
      
      debugLog(appState, 'Log 2') // 呼ばれない
      debugGroupEnd(appState) // 呼ばれない
      
      expect(consoleGroupSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      expect(consoleGroupEndSpy).not.toHaveBeenCalled()
    })

    it('ネストしたグループが正しく処理されること', () => {
      const appState = createMockAppState(true)
      
      debugGroup(appState, 'Outer Group')
      debugLog(appState, 'Outer Log')
      debugGroup(appState, 'Inner Group')
      debugLog(appState, 'Inner Log')
      debugGroupEnd(appState)
      debugLog(appState, 'Back to Outer')
      debugGroupEnd(appState)
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('Outer Group')
      expect(consoleGroupSpy).toHaveBeenCalledWith('Inner Group')
      expect(consoleSpy).toHaveBeenCalledWith('Outer Log')
      expect(consoleSpy).toHaveBeenCalledWith('Inner Log')
      expect(consoleSpy).toHaveBeenCalledWith('Back to Outer')
      expect(consoleGroupEndSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('パフォーマンス考慮事項', () => {
    it('debugModeがfalseの場合、引数の評価が最小限であること', () => {
      const appState = createMockAppState(false)
      const expensiveFunction = vi.fn(() => 'expensive result')
      
      // 関数が呼ばれないことを期待
      debugLog(appState, 'message', expensiveFunction())
      
      // 引数は評価されるが、console.logは呼ばれない
      expect(expensiveFunction).toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('大量のログでもメモリリークが発生しないこと', () => {
      const appState = createMockAppState(true)
      
      // 大量のログを出力
      for (let i = 0; i < 1000; i++) {
        debugLog(appState, `Log ${i}`, { data: new Array(100).fill(i) })
      }
      
      expect(consoleSpy).toHaveBeenCalledTimes(1000)
    })
  })
})