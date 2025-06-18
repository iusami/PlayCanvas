import React, { useRef } from 'react'
import { Stage, Layer, Rect, Line, Circle, Text, Group } from 'react-konva'
import { Play, Player, Arrow, TextElement } from '../types'

interface PlayThumbnailProps {
  play: Play
  width?: number
  height?: number
  className?: string
}

const PlayThumbnail: React.FC<PlayThumbnailProps> = ({
  play,
  width = 200,
  height = 150,
  className = ''
}) => {
  const stageRef = useRef<any>(null)

  // フィールドのスケール計算
  const scaleX = width / play.field.width
  const scaleY = height / play.field.height
  const scale = Math.min(scaleX, scaleY) * 0.9 // 少し余白を持たせる

  const scaledWidth = play.field.width * scale
  const scaledHeight = play.field.height * scale
  const offsetX = (width - scaledWidth) / 2
  const offsetY = (height - scaledHeight) / 2

  const drawField = () => {
    const fieldWidth = play.field.width
    const fieldHeight = play.field.height
    const lineColor = play.field.lineColor
    
    const elements = []

    // フィールド背景
    elements.push(
      <Rect
        key="field-bg"
        x={0}
        y={0}
        width={fieldWidth}
        height={fieldHeight}
        fill={play.field.backgroundColor}
        stroke={lineColor}
        strokeWidth={2}
        listening={false}
      />
    )

    if (play.field.yardLines) {
      // 6本の水平線を均等に配置（フィールドを6等分）
      // 上部を削除して6本線のみ描画
      for (let i = 1; i <= 6; i++) {
        const y = (fieldHeight * i) / 6
        let strokeWidth = 1
        
        // 上から4番目の線は太く（中央線）
        if (i === 4) {
          strokeWidth = 2
        }
        
        elements.push(
          <Line
            key={`yard-line-${i}`}
            points={[0, y, fieldWidth, y]}
            stroke={lineColor}
            strokeWidth={strokeWidth}
            listening={false}
          />
        )
      }
    }

    return elements
  }

  const renderPlayer = (player: Player) => {
    const baseProps = {
      key: player.id,
      x: player.x,
      y: player.y,
      listening: false
    }

    const strokeColor = player.strokeColor || player.color || '#000'
    const fillColor = player.fillColor === 'transparent' ? '#ffffff' : (player.fillColor || '#ffffff')
    const size = player.size * 0.8 // サムネイルでは少し小さく
    
    switch (player.type) {
      case 'circle':
        return (
          <Circle
            {...baseProps}
            radius={size / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1}
          />
        )
      case 'triangle':
        return (
          <Line
            {...baseProps}
            points={[
              0, size / 2,
              -size / 2, -size / 2,
              size / 2, -size / 2,
              0, size / 2
            ]}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1}
            closed={true}
          />
        )
      case 'square':
        return (
          <Rect
            {...baseProps}
            width={size}
            height={size}
            offsetX={size / 2}
            offsetY={size / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1}
          />
        )
      case 'chevron':
        return (
          <Line
            {...baseProps}
            points={[
              -size / 2, -size / 4,
              0, size / 2,
              size / 2, -size / 4
            ]}
            fill={undefined}
            stroke={strokeColor}
            strokeWidth={1}
            closed={false}
          />
        )
      case 'text':
        return (
          <Group {...baseProps}>
            <Circle
              radius={size / 2}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={1}
            />
            <Text
              text={player.text || player.position || 'A'}
              fontSize={size * 0.5}
              fontFamily="Arial"
              fill="#000"
              width={size}
              height={size}
              align="center"
              verticalAlign="middle"
              offsetX={size / 2}
              offsetY={size / 2}
            />
          </Group>
        )
      default:
        return null
    }
  }

  const renderArrow = (arrow: Arrow) => {
    const points = arrow.points
    if (points.length < 4) return null

    // 矢印の先端を計算
    const endX = points[points.length - 2]
    const endY = points[points.length - 1]
    
    let startX, startY
    if (points.length >= 6) {
      startX = points[points.length - 4]
      startY = points[points.length - 3]
    } else {
      startX = points[0]
      startY = points[1]
    }

    const deltaX = endX - startX
    const deltaY = endY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance < 5) return null
    
    const angle = Math.atan2(deltaY, deltaX)
    const headLength = 8 // サムネイルでは小さく
    const headAngle = Math.PI / 6

    const arrowHeadPoints = []
    if (arrow.headType === 'normal') {
      arrowHeadPoints.push(
        endX - headLength * Math.cos(angle - headAngle),
        endY - headLength * Math.sin(angle - headAngle),
        endX,
        endY,
        endX - headLength * Math.cos(angle + headAngle),
        endY - headLength * Math.sin(angle + headAngle)
      )
    }

    return (
      <Group key={arrow.id}>
        <Line
          points={points}
          stroke={arrow.color}
          strokeWidth={Math.max(1, arrow.strokeWidth * 0.5)}
          dash={arrow.type === 'dashed' ? [5, 3] : undefined}
          tension={0}
          listening={false}
        />
        {arrow.headType !== 'none' && arrowHeadPoints.length > 0 && (
          <Line
            points={arrowHeadPoints}
            stroke={arrow.color}
            strokeWidth={Math.max(1, arrow.strokeWidth * 0.5)}
            fill={arrow.color}
            closed={arrow.headType === 'normal'}
            listening={false}
          />
        )}
      </Group>
    )
  }

  const renderText = (textElement: TextElement) => {
    return (
      <Text
        key={textElement.id}
        x={textElement.x}
        y={textElement.y}
        text={textElement.text}
        fontSize={Math.max(8, textElement.fontSize * 0.6)} // サムネイルでは小さく
        fontFamily={textElement.fontFamily}
        fill={textElement.color}
        listening={false}
      />
    )
  }

  const renderCenter = () => {
    if (!play.center) return null
    
    const centerLineY = (play.field.height * 4) / 6  // 6等分の4番目
    const centerY = centerLineY - 8  // センターの下端を中央線に合わせる（16px高さの半分）
    
    return (
      <Rect
        key="center"
        x={play.center.x}
        y={centerY}
        width={16} // サムネイルでは小さく
        height={16}
        offsetX={8}
        offsetY={8} // 下端基準にする（16pxの半分）
        fill="#ffffff" // 白色の背景
        stroke="#000000"
        strokeWidth={2}
        listening={false}
      />
    )
  }

  return (
    <div className={`inline-block ${className}`} style={{ width, height }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={offsetX}
        y={offsetY}
      >
        <Layer>
          {/* フィールド描画 */}
          <Group>
            {drawField()}
          </Group>
          
          {/* プレイヤー描画 */}
          <Group>
            {play.players.map(renderPlayer)}
            {renderCenter()}
          </Group>
          
          {/* 矢印描画 */}
          <Group>
            {play.arrows.map(renderArrow)}
          </Group>
          
          {/* テキスト描画 */}
          <Group>
            {play.texts.map(renderText)}
          </Group>
        </Layer>
      </Stage>
    </div>
  )
}

export default PlayThumbnail