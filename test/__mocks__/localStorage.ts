// localStorage のモック実装
// test/setup.ts で既に設定済みですが、個別に使用したい場合のために提供

import { vi } from 'vitest'

export const createLocalStorageMock = () => {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    // ストアの内容を直接アクセスするためのヘルパー
    _getStore: () => ({ ...store }),
    _setStore: (newStore: Record<string, string>) => {
      Object.keys(store).forEach(key => delete store[key])
      Object.assign(store, newStore)
    }
  }
}

export default createLocalStorageMock()