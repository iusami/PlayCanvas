// localStorage のモック実装
// test/setup.ts で既に設定済みですが、個別に使用したい場合のために提供

export const createLocalStorageMock = () => {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => {
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