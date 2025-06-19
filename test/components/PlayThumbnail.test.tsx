import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PlayThumbnail from '../../src/components/PlayThumbnail'
import { Play } from '../../src/types'

// Konvaのモック化
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => (
    <div data-testid="konva-stage" data-props={JSON.stringify(props)}>
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
      team: 'offense'
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
      team: 'offense'
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
    },
    {
      id: 'arrow-2',
      points: [200, 200, 400, 250],
      type: 'dashed',
      headType: 'none',
      color: '#ff0000',
      strokeWidth: 3
    }
  ],
  texts: [
    {
      id: 'text-1',
      x: 150,
      y: 150,
      text: 'Play Start',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000'
    },
    {
      id: 'text-2',
      x: 450,
      y: 450,
      text: 'End Zone',
      fontSize: 14,
      fontFamily: 'Helvetica',
      color: '#ff0000'
    }
  ],
  center: { x: 400, y: 300 }
})

describe('PlayThumbnail Component', () => {
  const defaultProps = {
    play: createMockPlay()
  }

  describe('初期レンダリング', () => {
    it('サムネイルが正常にレンダリングされること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
      expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
    })

    it('デフォルトサイズ（200x150）でレンダリングされること', () => {
      const { container } = render(<PlayThumbnail {...defaultProps} />)
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '200px', height: '150px' })
    })

    it('カスタムサイズでレンダリングされること', () => {
      const { container } = render(
        <PlayThumbnail {...defaultProps} width={300} height={200} />
      )
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '300px', height: '200px' })
    })

    it('カスタムクラス名が適用されること', () => {
      const { container } = render(
        <PlayThumbnail {...defaultProps} className="custom-thumbnail" />
      )
      
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-thumbnail')
    })
  })

  describe('スケール計算', () => {
    it('ステージに適切なスケールが設定されること', () => {
      render(<PlayThumbnail {...defaultProps} width={100} height={75} />)
      
      const stage = screen.getByTestId('konva-stage')
      const stageProps = JSON.parse(stage.getAttribute('data-props') || '{}')
      
      // 800x600のフィールドを100x75に収める場合
      const expectedScale = Math.min(100/800, 75/600) * 0.9
      expect(stageProps.scaleX).toBeCloseTo(expectedScale, 5)
      expect(stageProps.scaleY).toBeCloseTo(expectedScale, 5)
    })

    it('異なるアスペクト比でも正しくスケールされること', () => {
      render(<PlayThumbnail {...defaultProps} width={160} height={120} />)
      
      const stage = screen.getByTestId('konva-stage')
      const stageProps = JSON.parse(stage.getAttribute('data-props') || '{}')
      
      // アスペクト比を保持しつつ、最大サイズに収める
      const expectedScale = Math.min(160/800, 120/600) * 0.9
      expect(stageProps.scaleX).toBeCloseTo(expectedScale, 5)
      expect(stageProps.scaleY).toBeCloseTo(expectedScale, 5)
    })
  })

  describe('フィールド描画', () => {
    it('フィールド背景が描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const rects = screen.getAllByTestId('konva-rect')
      const fieldBackground = rects.find(rect => {
        const props = JSON.parse(rect.getAttribute('data-props') || '{}')
        return props.width === 800 && props.height === 600 && props.fill === '#4F7942'
      })
      
      expect(fieldBackground).toBeTruthy()
    })

    it('ヤードラインが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // 6本のヤードライン + 他の線要素
      expect(lines.length).toBeGreaterThan(6)
    })

    it('4番目の線が太く描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // 太い線（strokeWidth = 2）を探す
      const thickLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.strokeWidth === 2 && Array.isArray(props.points) && props.points.length === 4
      })
      
      expect(thickLines.length).toBeGreaterThan(0)
    })

    it('ヤードラインが無効の場合は描画されないこと', () => {
      const playWithoutYardLines = {
        ...createMockPlay(),
        field: { ...createMockPlay().field, yardLines: false }
      }
      
      render(<PlayThumbnail play={playWithoutYardLines} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // ヤードライン以外の線要素のみ（矢印など）
      const yardLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return Array.isArray(props.points) && props.points.length === 4 && 
               props.points[0] === 0 && props.points[2] === 800
      })
      
      expect(yardLines.length).toBe(0)
    })
  })

  describe('プレイヤー描画', () => {
    it('円形プレイヤーが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const circles = screen.getAllByTestId('konva-circle')
      
      const playerCircles = circles.filter(circle => {
        const props = JSON.parse(circle.getAttribute('data-props') || '{}')
        return props.radius === 8 // size * 0.8 / 2 = 20 * 0.8 / 2 = 8
      })
      
      expect(playerCircles.length).toBeGreaterThan(0)
    })

    it('三角形プレイヤーが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      const triangleLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.closed === true && Array.isArray(props.points) && props.points.length === 8
      })
      
      expect(triangleLines.length).toBeGreaterThan(0)
    })

    it('四角形プレイヤーが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const rects = screen.getAllByTestId('konva-rect')
      
      const playerRects = rects.filter(rect => {
        const props = JSON.parse(rect.getAttribute('data-props') || '{}')
        return props.width === 16 && props.height === 16 // size * 0.8 = 20 * 0.8 = 16
      })
      
      expect(playerRects.length).toBeGreaterThan(0)
    })

    it('シェブロンプレイヤーが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      const chevronLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.closed === false && Array.isArray(props.points) && props.points.length === 6
      })
      
      expect(chevronLines.length).toBeGreaterThan(0)
    })

    it('テキストプレイヤーが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const texts = screen.getAllByTestId('konva-text')
      const groups = screen.getAllByTestId('konva-group')
      
      // テキストプレイヤーはグループ内にCircleとTextが含まれる
      expect(texts.length).toBeGreaterThan(0)
      expect(groups.length).toBeGreaterThan(0)
    })

    it('プレイヤーサイズがサムネイル用に縮小されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const circles = screen.getAllByTestId('konva-circle')
      
      const playerCircle = circles.find(circle => {
        const props = JSON.parse(circle.getAttribute('data-props') || '{}')
        return props.radius === 8 // 元サイズ20の0.8倍 = 16の半径 = 8
      })
      
      expect(playerCircle).toBeTruthy()
    })
  })

  describe('矢印描画', () => {
    it('通常の矢印が描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      const arrowLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.stroke === '#000000' && props.strokeWidth === 1 // strokeWidth * 0.5 = 2 * 0.5 = 1
      })
      
      expect(arrowLines.length).toBeGreaterThan(0)
    })

    it('破線矢印が描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      const dashedLines = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return Array.isArray(props.dash) && props.dash.length === 2
      })
      
      expect(dashedLines.length).toBeGreaterThan(0)
    })

    it('矢印ヘッドが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const lines = screen.getAllByTestId('konva-line')
      
      // 矢印ヘッド用の線を探す（closed=trueで塗りつぶし有り）
      const arrowHeads = lines.filter(line => {
        const props = JSON.parse(line.getAttribute('data-props') || '{}')
        return props.closed === true && props.fill
      })
      
      expect(arrowHeads.length).toBeGreaterThan(0)
    })

    it('短すぎる矢印は描画されないこと', () => {
      const playWithShortArrow = {
        ...createMockPlay(),
        arrows: [{
          id: 'short-arrow',
          points: [100, 100, 102, 102], // 距離が5未満
          type: 'straight' as const,
          headType: 'normal' as const,
          color: '#000000',
          strokeWidth: 2
        }]
      }
      
      render(<PlayThumbnail play={playWithShortArrow} />)
      
      // この場合、矢印は描画されないはず
      const groups = screen.getAllByTestId('konva-group')
      expect(groups.length).toBeLessThan(10) // 他の要素分のグループのみ
    })
  })

  describe('テキスト要素描画', () => {
    it('テキスト要素が描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const texts = screen.getAllByTestId('konva-text')
      
      const fieldTexts = texts.filter(text => {
        const props = JSON.parse(text.getAttribute('data-props') || '{}')
        return props.text === 'Play Start' || props.text === 'End Zone'
      })
      
      expect(fieldTexts.length).toBe(2)
    })

    it('テキストサイズがサムネイル用に縮小されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const texts = screen.getAllByTestId('konva-text')
      
      const fieldText = texts.find(text => {
        const props = JSON.parse(text.getAttribute('data-props') || '{}')
        return props.text === 'Play Start' && props.fontSize === Math.max(8, 16 * 0.6) // 9.6
      })
      
      expect(fieldText).toBeTruthy()
    })

    it('最小フォントサイズが8に制限されること', () => {
      const playWithSmallText = {
        ...createMockPlay(),
        texts: [{
          id: 'small-text',
          x: 100,
          y: 100,
          text: 'Small',
          fontSize: 10, // 0.6倍すると6だが、最小8になる
          fontFamily: 'Arial',
          color: '#000000'
        }]
      }
      
      render(<PlayThumbnail play={playWithSmallText} />)
      
      const texts = screen.getAllByTestId('konva-text')
      
      const smallText = texts.find(text => {
        const props = JSON.parse(text.getAttribute('data-props') || '{}')
        return props.text === 'Small' && props.fontSize === 8
      })
      
      expect(smallText).toBeTruthy()
    })
  })

  describe('センター描画', () => {
    it('センターが描画されること', () => {
      render(<PlayThumbnail {...defaultProps} />)
      
      const rects = screen.getAllByTestId('konva-rect')
      
      const centerRect = rects.find(rect => {
        const props = JSON.parse(rect.getAttribute('data-props') || '{}')
        return props.width === 16 && props.height === 16 && 
               props.fill === '#ffffff' && props.stroke === '#000000'
      })
      
      expect(centerRect).toBeTruthy()
    })

    it('センターが存在しない場合は描画されないこと', () => {
      const playWithoutCenter = {
        ...createMockPlay(),
        center: undefined
      }
      
      render(<PlayThumbnail play={playWithoutCenter} />)
      
      const rects = screen.getAllByTestId('konva-rect')
      
      const centerRects = rects.filter(rect => {
        const props = JSON.parse(rect.getAttribute('data-props') || '{}')
        return props.width === 16 && props.height === 16 && 
               props.fill === '#ffffff' && props.stroke === '#000000' &&
               props.strokeWidth === 2
      })
      
      expect(centerRects.length).toBe(0)
    })
  })

  describe('レスポンシブ対応', () => {
    it('非常に小さいサイズでも正しく描画されること', () => {
      render(<PlayThumbnail {...defaultProps} width={50} height={37} />)
      
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
      expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
    })

    it('非常に大きいサイズでも正しく描画されること', () => {
      render(<PlayThumbnail {...defaultProps} width={1000} height={750} />)
      
      expect(screen.getByTestId('konva-stage')).toBeInTheDocument()
      expect(screen.getByTestId('konva-layer')).toBeInTheDocument()
    })

    it('正方形のサイズでも正しく描画されること', () => {
      render(<PlayThumbnail {...defaultProps} width={200} height={200} />)
      
      const stage = screen.getByTestId('konva-stage')
      const stageProps = JSON.parse(stage.getAttribute('data-props') || '{}')
      
      // アスペクト比を保持してスケール
      expect(stageProps.scaleX).toBe(stageProps.scaleY)
    })
  })

  describe('プロップの変更処理', () => {
    it('プレイが変更されると再レンダリングされること', () => {
      const { rerender } = render(<PlayThumbnail {...defaultProps} />)
      
      const newPlay = {
        ...createMockPlay(),
        field: { ...createMockPlay().field, backgroundColor: '#FF0000' }
      }
      
      rerender(<PlayThumbnail play={newPlay} />)
      
      const rects = screen.getAllByTestId('konva-rect')
      const redBackground = rects.find(rect => {
        const props = JSON.parse(rect.getAttribute('data-props') || '{}')
        return props.fill === '#FF0000'
      })
      
      expect(redBackground).toBeTruthy()
    })

    it('サイズが変更されると適切にスケールが更新されること', () => {
      const { rerender } = render(<PlayThumbnail {...defaultProps} width={200} height={150} />)
      
      rerender(<PlayThumbnail {...defaultProps} width={400} height={300} />)
      
      const stage = screen.getByTestId('konva-stage')
      const stageProps = JSON.parse(stage.getAttribute('data-props') || '{}')
      
      // 新しいサイズに応じたスケール
      const expectedScale = Math.min(400/800, 300/600) * 0.9
      expect(stageProps.scaleX).toBeCloseTo(expectedScale, 5)
    })
  })

  describe('エラーハンドリング', () => {
    it('空のプレイヤー配列でもエラーが発生しないこと', () => {
      const playWithoutPlayers = {
        ...createMockPlay(),
        players: []
      }
      
      expect(() => {
        render(<PlayThumbnail play={playWithoutPlayers} />)
      }).not.toThrow()
    })

    it('空の矢印配列でもエラーが発生しないこと', () => {
      const playWithoutArrows = {
        ...createMockPlay(),
        arrows: []
      }
      
      expect(() => {
        render(<PlayThumbnail play={playWithoutArrows} />)
      }).not.toThrow()
    })

    it('空のテキスト配列でもエラーが発生しないこと', () => {
      const playWithoutTexts = {
        ...createMockPlay(),
        texts: []
      }
      
      expect(() => {
        render(<PlayThumbnail play={playWithoutTexts} />)
      }).not.toThrow()
    })

    it('不正な矢印データでもエラーが発生しないこと', () => {
      const playWithInvalidArrow = {
        ...createMockPlay(),
        arrows: [{
          id: 'invalid-arrow',
          points: [100], // 不正な点数
          type: 'straight' as const,
          headType: 'normal' as const,
          color: '#000000',
          strokeWidth: 2
        }]
      }
      
      expect(() => {
        render(<PlayThumbnail play={playWithInvalidArrow} />)
      }).not.toThrow()
    })
  })
})