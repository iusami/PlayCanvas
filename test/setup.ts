import '@testing-library/jest-dom'
import { vi } from 'vitest'

// localStorage をモック化
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
  get length() {
    return Object.keys(localStorageMock.store).length
  },
  key: vi.fn((index: number) => {
    const keys = Object.keys(localStorageMock.store)
    return keys[index] || null
  })
}

// sessionStorage もモック化
const sessionStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {}
  }),
  get length() {
    return Object.keys(sessionStorageMock.store).length
  },
  key: vi.fn((index: number) => {
    const keys = Object.keys(sessionStorageMock.store)
    return keys[index] || null
  })
}

// crypto.randomUUID をモック化
const mockRandomUUID = vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))

// グローバルオブジェクトを設定
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
})

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID
  },
  writable: true
})

// matchMedia をモック化（React Testing Library で必要）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

// テスト前の共通セットアップ
beforeEach(() => {
  // localStorage をクリア
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  
  // sessionStorage をクリア
  sessionStorageMock.clear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  
  // UUID モックをクリア
  mockRandomUUID.mockClear()
  
  // コンソールエラーを非表示にする（テスト時のノイズ削減）
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

// テスト後のクリーンアップ
afterEach(() => {
  // モックを復元
  vi.restoreAllMocks()
})

// Konva コンポーネント作成ヘルパー
const createMockKonvaComponent = (name: string) => {
  return vi.fn((props) => {
    const { children, ...otherProps } = props || {}
    return children || null
  })
}

// Konva のモック
vi.mock('konva', () => ({
  default: {
    Node: vi.fn(),
    Stage: vi.fn(() => ({
      add: vi.fn(),
      draw: vi.fn(),
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
      destroy: vi.fn(),
      getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
      container: vi.fn(() => ({
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })),
    Layer: vi.fn(() => ({
      add: vi.fn(),
      draw: vi.fn(),
      destroy: vi.fn(),
    })),
    Circle: vi.fn(() => ({
      destroy: vi.fn(),
    })),
    Arrow: vi.fn(() => ({
      destroy: vi.fn(),
    })),
    Text: vi.fn(() => ({
      destroy: vi.fn(),
    })),
    Line: vi.fn(() => ({
      destroy: vi.fn(),
    })),
    Group: vi.fn(() => ({
      destroy: vi.fn(),
    })),
    Rect: vi.fn(() => ({
      destroy: vi.fn(),
    })),
  }
}))

// React-Konva のモック
vi.mock('react-konva', () => ({
  Stage: createMockKonvaComponent('Stage'),
  Layer: createMockKonvaComponent('Layer'),
  Circle: createMockKonvaComponent('Circle'),
  Arrow: createMockKonvaComponent('Arrow'),
  Text: createMockKonvaComponent('Text'),
  Line: createMockKonvaComponent('Line'),
  Group: createMockKonvaComponent('Group'),
  Rect: createMockKonvaComponent('Rect'),
}))

// テストユーティリティ関数をエクスポート
export { localStorageMock, sessionStorageMock, mockRandomUUID }