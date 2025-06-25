/**
 * プレイヤー関連のユーティリティ関数集
 */

/**
 * フィールドの中央線のY座標を取得
 * @param fieldHeight フィールドの高さ
 * @returns 中央線のY座標
 */
export const getCenterLineY = (fieldHeight: number): number => {
  return (fieldHeight * 4) / 6  // 6等分の4番目（中央線）
}

/**
 * フィールドが反転しているかどうかを判定
 * @param center センターの座標
 * @param fieldHeight フィールドの高さ
 * @returns フィールドが反転している場合true
 */
export const isFieldFlipped = (center: { x: number; y: number } | undefined, fieldHeight: number): boolean => {
  if (!center) return false
  
  // 6等分システムに統一：2番目と4番目の線で判定
  const secondLineY = (fieldHeight * 2) / 6
  const fourthLineY = (fieldHeight * 4) / 6
  
  return Math.abs(center.y - secondLineY) < Math.abs(center.y - fourthLineY)
}

/**
 * プレイヤーの位置を制約に従って調整
 * @param x X座標
 * @param y Y座標
 * @param team チーム（offense/defense）
 * @param fieldWidth フィールドの幅
 * @param fieldHeight フィールドの高さ
 * @param center センターの座標
 * @param playerSize プレイヤーのサイズ（デフォルト: 20）
 * @returns 制約後の座標
 */
export const constrainPlayerPosition = (
  x: number, 
  y: number, 
  team: 'offense' | 'defense', 
  fieldWidth: number, 
  fieldHeight: number, 
  center: { x: number; y: number } | undefined,
  playerSize: number = 20
): { x: number; y: number } => {
  const flipped = isFieldFlipped(center, fieldHeight)
  // 常に固定の中央線位置を使用（centerの実際位置ではなく）
  const centerLineY = getCenterLineY(fieldHeight)
  const halfSize = playerSize / 2
  
  // プレイヤーの実際の上端・下端位置の計算方法:
  // プレイヤーの上端 = y - halfSize
  // プレイヤーの下端 = y + halfSize
  
  // オフセット距離設定（中央線から少し離した位置）
  const offenseSnapOffset = 15 // オフェンス用の距離（中央線より下に）
  const defenseSnapOffset = 15 // ディフェンス用の距離（中央線より上に）
  
  const constrainedX = Math.max(halfSize, Math.min(fieldWidth - halfSize, x))
  
  let constrainedY = y
  
  if (flipped) {
    if (team === 'offense') {
      // 反転時オフェンス：プレイヤーの下端が中央線より15px上まで配置可能（フィールド上半分で制約）
      // プレイヤーの下端 = center.y + halfSize <= centerLineY - 15
      // つまり: center.y <= centerLineY - 15 - halfSize
      const maxY = centerLineY - offenseSnapOffset - halfSize
      constrainedY = Math.max(halfSize, Math.min(maxY, y))
    } else {
      // 反転時ディフェンス：プレイヤーの上端が中央線より10px下まで配置可能（フィールド下半分で制約）
      // プレイヤーの上端 = center.y - halfSize >= centerLineY + 10
      // つまり: center.y >= centerLineY + 10 + halfSize
      const minY = centerLineY + 10 + halfSize
      constrainedY = Math.max(minY, Math.min(fieldHeight - halfSize, y))
    }
  } else {
    if (team === 'offense') {
      // 通常時オフェンス：プレイヤーの上端が中央線より15px下まで配置可能
      // プレイヤーの上端 = center.y - halfSize >= centerLineY + 15
      // つまり: center.y >= centerLineY + 15 + halfSize  
      const minY = centerLineY + offenseSnapOffset + halfSize
      constrainedY = Math.max(minY, Math.min(fieldHeight - halfSize, y))
    } else {
      // 通常時ディフェンス：下端が中央線より上
      // プレイヤーの下端 = center.y + halfSize
      // 下端 <= centerLineY - defenseSnapOffset
      // center.y <= centerLineY - defenseSnapOffset - halfSize
      const maxY = centerLineY - defenseSnapOffset - halfSize
      constrainedY = Math.max(halfSize, Math.min(maxY, y))
    }
  }
  
  return { x: constrainedX, y: constrainedY }
}