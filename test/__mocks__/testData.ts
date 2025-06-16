// テスト用のサンプルデータ
import { Play, Playlist, FormationTemplate, Player, PlayMetadata, TextBoxEntry } from '../../src/types'

// プレイヤーのサンプルデータ
export const createSamplePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  x: 400,
  y: 300,
  type: 'circle',
  position: 'QB',
  color: '#000000',
  fillColor: '#ffffff',
  strokeColor: '#000000',
  size: 20,
  team: 'offense',
  ...overrides
})

// プレイメタデータのサンプルデータ
export const createSamplePlayMetadata = (overrides: Partial<PlayMetadata> = {}): PlayMetadata => ({
  title: 'サンプルプレイ',
  description: 'テスト用のプレイです',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  tags: ['テスト', 'サンプル'],
  playName: 'テストプレイ名',
  offFormation: '4-3',
  defFormation: '3-4',
  playType: 'offense',
  ...overrides
})

// テキストボックスエントリのサンプルデータ
export const createSampleTextBoxEntries = (): TextBoxEntry[] => {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `textbox-${index + 1}`,
    shortText: index < 2 ? `${index + 1}` : '', // 最初の2つは番号入り
    longText: index < 2 ? `テストメモ${index + 1}` : ''
  }))
}

// プレイのサンプルデータ
export const createSamplePlay = (overrides: Partial<Play> = {}): Play => ({
  id: 'play-1',
  metadata: createSamplePlayMetadata(overrides.metadata),
  field: {
    width: 800,
    height: 600,
    backgroundColor: '#4F7942',
    lineColor: '#FFFFFF',
    yardLines: true,
    hashMarks: true,
    ...overrides.field
  },
  players: [createSamplePlayer()],
  arrows: [],
  texts: [],
  center: { x: 400, y: 300 },
  textBoxEntries: createSampleTextBoxEntries(),
  ...overrides
})

// プレイリストのサンプルデータ
export const createSamplePlaylist = (overrides: Partial<Playlist> = {}): Playlist => ({
  id: 'playlist-1',
  title: 'サンプルプレイリスト',
  description: 'テスト用のプレイリストです',
  playIds: ['play-1', 'play-2'],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

// フォーメーションテンプレートのサンプルデータ
export const createSampleFormation = (overrides: Partial<FormationTemplate> = {}): FormationTemplate => ({
  id: 'formation-1',
  name: 'サンプルフォーメーション',
  description: 'テスト用のフォーメーションです',
  type: 'offense',
  players: [
    {
      x: 400,
      y: 300,
      type: 'circle',
      position: 'QB',
      color: '#000000',
      fillColor: '#ffffff',
      strokeColor: '#000000',
      size: 20,
      team: 'offense'
    }
  ],
  center: { x: 400, y: 300 },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

// 複数のサンプルデータをまとめて作成するヘルパー関数
export const createMultiplePlays = (count: number): Play[] => {
  return Array.from({ length: count }, (_, index) => 
    createSamplePlay({
      id: `play-${index + 1}`,
      metadata: createSamplePlayMetadata({
        title: `プレイ ${index + 1}`,
        playName: `テストプレイ${index + 1}`
      })
    })
  )
}

export const createMultiplePlaylists = (count: number): Playlist[] => {
  return Array.from({ length: count }, (_, index) => 
    createSamplePlaylist({
      id: `playlist-${index + 1}`,
      title: `プレイリスト ${index + 1}`,
      playIds: [`play-${index * 2 + 1}`, `play-${index * 2 + 2}`]
    })
  )
}

export const createMultipleFormations = (count: number): FormationTemplate[] => {
  return Array.from({ length: count }, (_, index) => 
    createSampleFormation({
      id: `formation-${index + 1}`,
      name: `フォーメーション ${index + 1}`,
      type: index % 2 === 0 ? 'offense' : 'defense'
    })
  )
}

// 特殊なケース用のサンプルデータ
export const createEmptyPlay = (): Play => createSamplePlay({
  players: [],
  arrows: [],
  texts: []
})

export const createComplexPlay = (): Play => createSamplePlay({
  players: [
    createSamplePlayer({ id: 'qb', position: 'QB', x: 400, y: 350 }),
    createSamplePlayer({ id: 'rb', position: 'RB', x: 360, y: 380 }),
    createSamplePlayer({ id: 'wr1', position: 'WR', x: 300, y: 350 }),
    createSamplePlayer({ id: 'wr2', position: 'WR', x: 500, y: 350 })
  ],
  arrows: [
    {
      id: 'arrow-1',
      points: [400, 350, 450, 300],
      type: 'straight',
      headType: 'normal',
      color: '#000000',
      strokeWidth: 2
    }
  ],
  texts: [
    {
      id: 'text-1',
      x: 450,
      y: 280,
      text: 'パスルート',
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000'
    }
  ]
})