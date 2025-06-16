// プレイヤーの種類
export type PlayerType = 'circle' | 'triangle' | 'square' | 'text' | 'chevron' | 'x'

// フィールド制約定数
export const FIELD_CONSTRAINTS = Object.freeze({
  // 反転時のディフェンス最小Y座標（フィールド下半分の制限）
  DEFENSE_MIN_Y_FLIPPED: 240,
} as const)

// プレイヤーのポジション
export type PlayerPosition = 
  | 'QB' | 'RB' | 'WR' | 'TE' | 'OL' // オフェンス
  | 'DL' | 'LB' | 'DB' | 'S' // ディフェンス
  | ''

// プレイヤーオブジェクト
export interface Player {
  id: string
  x: number
  y: number
  type: PlayerType
  position: PlayerPosition
  text?: string
  color: string // 後方互換性のため残す（枠線色として使用）
  fillColor: string // 塗りつぶし色
  strokeColor: string // 枠線色
  size: number
  team: 'offense' | 'defense'
  flipped?: boolean // 上下反転状態（triangle/chevronの向き制御）
}

// 矢印・線の種類
export type ArrowType = 'straight' | 'zigzag' | 'dashed'
export type ArrowHead = 'normal' | 't-shaped' | 'none'

// 矢印セグメント
export interface ArrowSegment {
  points: number[] // [x1, y1, x2, y2] - セグメントの開始点と終了点
  type: ArrowType
}

// 矢印オブジェクト
export interface Arrow {
  id: string
  points: number[] // [x1, y1, x2, y2, ...] - 全体の点列（後方互換性のため）
  type: ArrowType // メインのタイプ（後方互換性のため）
  headType: ArrowHead
  color: string
  strokeWidth: number
  linkedPlayerId?: string // リンクされたプレイヤーのID（始点）
  segments?: ArrowSegment[] // 複数セグメントの場合
}

// テキストオブジェクト
export interface TextElement {
  id: string
  x: number
  y: number
  text: string
  fontSize: number
  fontFamily: string
  color: string
}

// フィールド設定
export interface FieldSettings {
  width: number
  height: number
  backgroundColor: string
  lineColor: string
  yardLines: boolean
  hashMarks: boolean
}

// プレイのタイプ
export type PlayType = 'offense' | 'defense' | 'special'

// プレイのメタデータ
export interface PlayMetadata {
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  playName: string
  offFormation: string
  defFormation: string
  playType: PlayType
}

// プレイオブジェクト
export interface Play {
  id: string
  metadata: PlayMetadata
  field: FieldSettings
  players: Player[]
  arrows: Arrow[]
  texts: TextElement[]
  center?: { x: number; y: number } // センターの位置
}

// プレイリスト
export interface Playlist {
  id: string
  title: string
  description: string
  playIds: string[]
  createdAt: Date
  updatedAt: Date
}

// フォーメーションテンプレート
export interface FormationTemplate {
  id: string
  name: string
  type: 'offense' | 'defense'
  description: string
  players: Omit<Player, 'id'>[] // idを除くプレイヤー情報
  center?: { x: number; y: number } // センターの位置
  createdAt: Date
  updatedAt: Date
}

// アプリケーションの状態
export interface AppState {
  currentPlay: Play | null
  selectedTool: 'select' | 'player' | 'arrow' | 'text'
  selectedPlayerType: PlayerType
  selectedPlayerPosition: PlayerPosition
  selectedTeam: 'offense' | 'defense'
  selectedArrowType: ArrowType
  selectedArrowHead: ArrowHead
  selectedStrokeWidth: number // 矢印の線の太さ
  selectedColor: string // 後方互換性のため残す
  selectedFillColor: string // プレイヤーの塗りつぶし色
  selectedStrokeColor: string // プレイヤーの枠線色
  selectedElementIds: string[]
  isDrawingArrow: boolean
  currentArrowPoints: number[]
  currentArrowPreviewPoints: number[]
  currentArrowSegments: ArrowSegment[] // 描画中のセグメント
  currentDrawingSegmentType: ArrowType // 現在描画中のセグメントタイプ
  initialArrowType: ArrowType // 矢印描画開始時のタイプ（履歴用）
  linkedPlayerId?: string // 矢印描画時にリンクするプレイヤーID
  maxSegments: number // 1つの矢印の最大セグメント数（固定値：10）
  segmentLimitWarning: string | null // セグメント上限警告メッセージ
  debugMode: boolean // デバッグモード
  // テキスト関連
  selectedFontFamily: string
  selectedFontSize: number
  selectedFontWeight: 'normal' | 'bold'
  selectedFontStyle: 'normal' | 'italic'
  selectedText: string
  isEditingText: boolean
  editingTextId: string | null
  // 中央線スナップ機能
  snapToObjects: boolean
  snapTolerance: number
  // 範囲選択機能
  isRangeSelecting: boolean
  rangeSelectStart: { x: number; y: number } | null
  rangeSelectEnd: { x: number; y: number } | null
  // Undo/Redo機能
  history: Play[]
  historyIndex: number
  maxHistorySize: number
}