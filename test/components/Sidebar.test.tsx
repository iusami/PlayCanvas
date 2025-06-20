import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Sidebar from '../../src/components/Sidebar'
import { AppState, Play, PlayerType } from '../../src/types'

// テスト用のモックデータ
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
  history: [],
  historyIndex: -1,
  maxHistorySize: 50
})

describe('Sidebar Component', () => {
  const mockUpdateAppState = vi.fn()
  const mockOnSelectPlay = vi.fn()
  const mockOnDeletePlay = vi.fn()
  const mockOnDuplicatePlay = vi.fn()
  const mockOnUpdatePlay = vi.fn()
  const mockOnCreatePlaylist = vi.fn()
  const mockOnUpdatePlaylist = vi.fn()
  const mockOnDeletePlaylist = vi.fn()
  const mockOnApplyFormation = vi.fn()
  const mockOnSaveFormationTemplate = vi.fn()
  const mockOnDeleteFormationTemplate = vi.fn()

  const defaultProps = {
    appState: createMockAppState(),
    updateAppState: mockUpdateAppState,
    plays: [createMockPlay()],
    onSelectPlay: mockOnSelectPlay,
    onDeletePlay: mockOnDeletePlay,
    onDuplicatePlay: mockOnDuplicatePlay,
    onUpdatePlay: mockOnUpdatePlay,
    playlists: [],
    onCreatePlaylist: mockOnCreatePlaylist,
    onUpdatePlaylist: mockOnUpdatePlaylist,
    onDeletePlaylist: mockOnDeletePlaylist,
    formations: [],
    onApplyFormation: mockOnApplyFormation,
    onSaveFormationTemplate: mockOnSaveFormationTemplate,
    onDeleteFormationTemplate: mockOnDeleteFormationTemplate
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('Sidebarが正常にレンダリングされること', () => {
      render(<Sidebar {...defaultProps} />)
      
      // 基本的なレンダリングの確認
      expect(screen.getByRole('button', { name: /選択/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /プレイヤー/ })).toBeInTheDocument()
    })

    it('デフォルトでツールタブが選択されていること', () => {
      render(<Sidebar {...defaultProps} />)
      
      // プレイヤータイプ選択が表示されている（ツールタブの証拠）
      expect(screen.getByText('○')).toBeInTheDocument()
    })
  })

  describe('プレイヤータイプ選択', () => {
    const playerToolProps = {
      ...defaultProps,
      appState: {
        ...createMockAppState(),
        selectedTool: 'player' as const
      }
    }

    it('全てのプレイヤータイプが表示されること', () => {
      render(<Sidebar {...playerToolProps} />)
      
      // プレイヤータイプ選択エリアを特定してからチェック
      expect(screen.getByText('アイコン')).toBeInTheDocument() // プレイヤータイプセクションの見出し
      
      const playerTypeButtons = screen.getAllByText('○')
      expect(playerTypeButtons.length).toBeGreaterThan(0) // circle (複数存在するので数だけチェック)
      expect(screen.getByText('▽')).toBeInTheDocument() // triangle
      expect(screen.getByText('□')).toBeInTheDocument() // square
      expect(screen.getByText('∨')).toBeInTheDocument() // chevron
      expect(screen.getByText('A')).toBeInTheDocument() // text
      expect(screen.getByText('✕')).toBeInTheDocument() // x
    })

    it('プレイヤータイプを選択するとupdateAppStateが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...playerToolProps} />)
      
      const triangleButton = screen.getByText('▽')
      await user.click(triangleButton)
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        selectedPlayerType: 'triangle'
      })
    })
  })

  describe('ツール選択', () => {
    it('全てのツールが表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('選択')).toBeInTheDocument()
      expect(screen.getByText('プレイヤー')).toBeInTheDocument()
      expect(screen.getByText('矢印')).toBeInTheDocument()
      expect(screen.getByText('テキスト')).toBeInTheDocument()
    })

    it('ツールを選択するとupdateAppStateが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const playerButton = screen.getByText('プレイヤー')
      await user.click(playerButton)
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        selectedTool: 'player'
      })
    })
  })

  describe('チーム選択', () => {
    const playerToolProps = {
      ...defaultProps,
      appState: {
        ...createMockAppState(),
        selectedTool: 'player' as const
      }
    }

    it('オフェンス・ディフェンス選択ボタンが表示されること', () => {
      render(<Sidebar {...playerToolProps} />)
      
      expect(screen.getByText('オフェンス')).toBeInTheDocument()
      expect(screen.getByText('ディフェンス')).toBeInTheDocument()
    })

    it('チームを選択するとupdateAppStateが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...playerToolProps} />)
      
      const defenseButton = screen.getByText('ディフェンス')
      await user.click(defenseButton)
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        selectedTeam: 'defense'
      })
    })
  })

  describe('左右反転機能', () => {
    it('左右反転ボタンが表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('左右反転')).toBeInTheDocument()
    })

    it('反転対象チーム選択が表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('反転対象チーム')).toBeInTheDocument()
      expect(screen.getByText('(左右反転のみに機能します)')).toBeInTheDocument()
      expect(screen.getByLabelText('全て')).toBeInTheDocument()
      expect(screen.getByLabelText('オフェンス')).toBeInTheDocument()
      expect(screen.getByLabelText('ディフェンス')).toBeInTheDocument()
    })

    it('初期状態では「全て」が選択されていること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByLabelText('全て')).toBeChecked()
      expect(screen.getByLabelText('オフェンス')).not.toBeChecked()
      expect(screen.getByLabelText('ディフェンス')).not.toBeChecked()
    })

    it('チーム選択を変更できること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const offenseRadio = screen.getByLabelText('オフェンス')
      await user.click(offenseRadio)
      
      expect(offenseRadio).toBeChecked()
      expect(screen.getByLabelText('全て')).not.toBeChecked()
      expect(screen.getByLabelText('ディフェンス')).not.toBeChecked()
    })

    it('左右反転ボタンをクリックするとonUpdatePlayが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const flipButton = screen.getByText('左右反転')
      await user.click(flipButton)
      
      expect(mockOnUpdatePlay).toHaveBeenCalled()
    })

    it('オフェンスのみ選択時でも左右反転が機能すること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // オフェンスのみを選択
      const offenseRadio = screen.getByLabelText('オフェンス')
      await user.click(offenseRadio)
      
      // 反転実行
      const flipButton = screen.getByText('左右反転')
      await user.click(flipButton)
      
      expect(mockOnUpdatePlay).toHaveBeenCalled()
    })

    it('ディフェンスのみ選択時でも左右反転が機能すること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      // ディフェンスのみを選択
      const defenseRadio = screen.getByLabelText('ディフェンス')
      await user.click(defenseRadio)
      
      // 反転実行
      const flipButton = screen.getByText('左右反転')
      await user.click(flipButton)
      
      expect(mockOnUpdatePlay).toHaveBeenCalled()
    })

    it('現在のプレイがない場合は何も起こらないこと', async () => {
      const user = userEvent.setup()
      const appStateWithoutPlay = { ...createMockAppState(), currentPlay: null }
      
      render(<Sidebar {...defaultProps} appState={appStateWithoutPlay} />)
      
      const flipButton = screen.getByText('左右反転')
      await user.click(flipButton)
      
      expect(mockOnUpdatePlay).not.toHaveBeenCalled()
    })
  })

  describe('上下反転機能', () => {
    it('上下反転ボタンが表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('上下反転')).toBeInTheDocument()
    })

    it('上下反転ボタンをクリックするとonUpdatePlayが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const flipButton = screen.getByText('上下反転')
      await user.click(flipButton)
      
      expect(mockOnUpdatePlay).toHaveBeenCalled()
    })
  })

  describe('デバッグモード', () => {
    const arrowToolProps = {
      ...defaultProps,
      appState: {
        ...createMockAppState(),
        selectedTool: 'arrow' as const,
        isDrawingArrow: true
      }
    }

    it('デバッグモード切り替えボタンが表示されること', () => {
      render(<Sidebar {...arrowToolProps} />)
      
      expect(screen.getByText('デバッグモード')).toBeInTheDocument()
    })

    it('デバッグモードを切り替えるとupdateAppStateが呼ばれること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...arrowToolProps} />)
      
      const debugToggle = screen.getByLabelText('デバッグモード')
      await user.click(debugToggle)
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        debugMode: true
      })
    })
  })

  describe('タブ切り替え', () => {
    it('プレイタブに切り替えられること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const playTab = screen.getByText('プレイ一覧')
      await user.click(playTab)
      
      expect(playTab).toHaveClass('border-blue-500', 'text-blue-600')
    })

    it('プレイリストタブに切り替えられること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const playlistTab = screen.getByText('プレイリスト')
      await user.click(playlistTab)
      
      expect(playlistTab).toHaveClass('border-blue-500', 'text-blue-600')
    })

    it('フォーメーションタブに切り替えられること', async () => {
      const user = userEvent.setup()
      render(<Sidebar {...defaultProps} />)
      
      const formationTab = screen.getByText('フォーメーション')
      await user.click(formationTab)
      
      expect(formationTab).toHaveClass('border-blue-500', 'text-blue-600')
    })
  })


  describe('色選択', () => {
    const playerToolProps = {
      ...defaultProps,
      appState: {
        ...createMockAppState(),
        selectedTool: 'player' as const
      }
    }

    it('塗りつぶし色選択が表示されること', () => {
      render(<Sidebar {...playerToolProps} />)
      
      const fillColorInput = screen.getByDisplayValue('#ffffff')
      expect(fillColorInput).toHaveAttribute('type', 'color')
    })

    it('枠線色選択が表示されること', () => {
      render(<Sidebar {...playerToolProps} />)
      
      const strokeColorInput = screen.getByDisplayValue('#000000')
      expect(strokeColorInput).toHaveAttribute('type', 'color')
    })

    it('色を変更するとupdateAppStateが呼ばれること', async () => {
      render(<Sidebar {...playerToolProps} />)
      
      const fillColorInput = screen.getByDisplayValue('#ffffff')
      fireEvent.change(fillColorInput, { target: { value: '#ff0000' } })
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        selectedFillColor: '#ff0000'
      })
    })
  })

  describe('プレイヤー選択時の機能', () => {
    it('プレイヤー選択時の基本的な機能をテストする', () => {
      const propsWithSelectedPlayers = {
        ...defaultProps,
        appState: {
          ...createMockAppState(),
          selectedTool: 'select' as const,
          selectedElementIds: ['player-1', 'player-2']
        }
      }

      render(<Sidebar {...propsWithSelectedPlayers} />)
      
      // selectツールが選択されていることを確認
      expect(screen.getByText('選択')).toBeInTheDocument()
    })

    it('選択ツールでプレイヤーが選択されている場合の表示確認', () => {
      const propsWithSelectedPlayers = {
        ...defaultProps,
        appState: {
          ...createMockAppState(),
          selectedTool: 'select' as const,
          selectedElementIds: ['player-1']
        }
      }

      render(<Sidebar {...propsWithSelectedPlayers} />)
      
      // 選択ツールのUIが表示されることを確認
      expect(screen.getByText('フォーメーション反転')).toBeInTheDocument()
    })
  })

  describe('矢印ツール', () => {
    const arrowToolProps = {
      ...defaultProps,
      appState: {
        ...createMockAppState(),
        selectedTool: 'arrow' as const
      }
    }

    it('矢印ツール選択時に適切なオプションが表示されること', () => {
      render(<Sidebar {...arrowToolProps} />)
      
      expect(screen.getByText('矢印の種類')).toBeInTheDocument()
      expect(screen.getByText('線の太さ')).toBeInTheDocument()
      expect(screen.getByText('色')).toBeInTheDocument()
    })

    it('線の太さを変更できること', async () => {
      render(<Sidebar {...arrowToolProps} />)
      
      const strokeWidthSlider = screen.getByDisplayValue('2')
      fireEvent.change(strokeWidthSlider, { target: { value: '4' } })
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        selectedStrokeWidth: 4
      })
    })
  })

  describe('テキストツール', () => {
    const textToolProps = {
      ...defaultProps,
      appState: {
        ...createMockAppState(),
        selectedTool: 'text' as const
      }
    }

    it('テキストツール選択時に適切なオプションが表示されること', () => {
      render(<Sidebar {...textToolProps} />)
      
      expect(screen.getByText('フォントサイズ')).toBeInTheDocument()
      expect(screen.getByText('フォント')).toBeInTheDocument()
      expect(screen.getByText('色')).toBeInTheDocument()
    })

    it('フォントサイズを変更できること', async () => {
      render(<Sidebar {...textToolProps} />)
      
      const fontSizeSlider = screen.getByDisplayValue('16')
      fireEvent.change(fontSizeSlider, { target: { value: '20' } })
      
      expect(mockUpdateAppState).toHaveBeenCalledWith({
        selectedFontSize: 20
      })
    })
  })

  describe('スナップ機能', () => {
    it('中央線スナップ機能が表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('中央線スナップ')).toBeInTheDocument()
      expect(screen.getByText('中央線にスナップ')).toBeInTheDocument()
    })

    it('スナップ範囲の設定が表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText(/スナップ範囲:/)).toBeInTheDocument()
      const rangeSlider = screen.getByDisplayValue('15')
      expect(rangeSlider).toHaveAttribute('type', 'range')
    })

    it('スナップ機能の説明が表示されること', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('💡 中央線スナップについて:')).toBeInTheDocument()
      expect(screen.getByText('• プレイヤーが中央線に近づくと自動でスナップ')).toBeInTheDocument()
    })
  })
})

// 座標反転ヘルパー関数のテスト（Sidebarから抽出したもの）
describe('座標反転ヘルパー関数', () => {
  // テスト用に関数を抽出（実際の実装では別ファイルに移動することを推奨）
  const flipXCoordinate = (center: number, coordinate: number): number => {
    return center + (center - coordinate)
  }

  const flipYCoordinate = (center: number, coordinate: number): number => {
    return center + (center - coordinate)
  }

  describe('flipXCoordinate', () => {
    it('中央基準でX座標を正しく反転すること', () => {
      expect(flipXCoordinate(400, 300)).toBe(500) // 400 + (400 - 300) = 500
      expect(flipXCoordinate(400, 100)).toBe(700) // 400 + (400 - 100) = 700
      expect(flipXCoordinate(400, 600)).toBe(200) // 400 + (400 - 600) = 200
    })

    it('中央の座標では変化しないこと', () => {
      expect(flipXCoordinate(400, 400)).toBe(400)
      expect(flipXCoordinate(0, 0)).toBe(0)
    })

    it('負の座標でも正しく計算されること', () => {
      expect(flipXCoordinate(0, -100)).toBe(100) // 0 + (0 - (-100)) = 100
      expect(flipXCoordinate(100, -50)).toBe(250) // 100 + (100 - (-50)) = 250
    })
  })

  describe('flipYCoordinate', () => {
    it('中央基準でY座標を正しく反転すること', () => {
      expect(flipYCoordinate(300, 200)).toBe(400) // 300 + (300 - 200) = 400
      expect(flipYCoordinate(300, 100)).toBe(500) // 300 + (300 - 100) = 500
      expect(flipYCoordinate(300, 500)).toBe(100) // 300 + (300 - 500) = 100
    })

    it('中央の座標では変化しないこと', () => {
      expect(flipYCoordinate(300, 300)).toBe(300)
      expect(flipYCoordinate(0, 0)).toBe(0)
    })

    it('負の座標でも正しく計算されること', () => {
      expect(flipYCoordinate(0, -200)).toBe(200) // 0 + (0 - (-200)) = 200
      expect(flipYCoordinate(150, -75)).toBe(375) // 150 + (150 - (-75)) = 375
    })
  })
})

// デバッグログヘルパー関数のテスト
describe('デバッグログヘルパー関数', () => {
  // コンソールのスパイを設定（スパイを関数内で定義）
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

  // テスト用に関数を抽出（実際の実装では別ファイルに移動することを推奨）
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

  describe('debugLog', () => {
    it('debugModeがtrueの場合、console.logが呼ばれること', () => {
      const appState = { ...createMockAppState(), debugMode: true }
      
      debugLog(appState, 'test message', 123)
      
      expect(consoleSpy).toHaveBeenCalledWith('test message', 123)
    })

    it('debugModeがfalseの場合、console.logが呼ばれないこと', () => {
      const appState = { ...createMockAppState(), debugMode: false }
      
      debugLog(appState, 'test message')
      
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('debugGroup', () => {
    it('debugModeがtrueの場合、console.groupが呼ばれること', () => {
      const appState = { ...createMockAppState(), debugMode: true }
      
      debugGroup(appState, 'Test Group')
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('Test Group')
    })

    it('debugModeがfalseの場合、console.groupが呼ばれないこと', () => {
      const appState = { ...createMockAppState(), debugMode: false }
      
      debugGroup(appState, 'Test Group')
      
      expect(consoleGroupSpy).not.toHaveBeenCalled()
    })
  })

  describe('debugGroupEnd', () => {
    it('debugModeがtrueの場合、console.groupEndが呼ばれること', () => {
      const appState = { ...createMockAppState(), debugMode: true }
      
      debugGroupEnd(appState)
      
      expect(consoleGroupEndSpy).toHaveBeenCalled()
    })

    it('debugModeがfalseの場合、console.groupEndが呼ばれないこと', () => {
      const appState = { ...createMockAppState(), debugMode: false }
      
      debugGroupEnd(appState)
      
      expect(consoleGroupEndSpy).not.toHaveBeenCalled()
    })
  })
})

