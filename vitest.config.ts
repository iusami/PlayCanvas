/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    // テスト環境の設定
    environment: 'jsdom',
    
    // jsdom環境の詳細設定
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously'
      }
    },
    
    // グローバル設定
    globals: true,
    
    // セットアップファイル
    setupFiles: ['./test/setup.ts'],
    
    // テストファイルのパターン
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'test/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    
    // 除外するファイル
    exclude: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'electron/**',
      '**/*.d.ts'
    ],
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'build/**',
        'dist/**',
        'electron/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/main.tsx',
        '**/index.css'
      ],
      reportsDirectory: './coverage'
    },
    
    // テストのタイムアウト設定 
    // 統合テストで重いコンポーネント（React + Konva）を考慮したタイムアウト値
    // PlaylistWorkspace、FootballCanvas等の複雑なレンダリングに対応
    testTimeout: 10000,
    
    // watchモードの設定
    watch: false,
    
    // UI設定（必要に応じてコメントアウト解除）
    // ui: true,
    
    // レポーター設定
    reporter: ['verbose'],
    
    // ファイル並列実行の設定
    fileParallelism: true,
    
    // テスト並列実行の設定
    maxConcurrency: 5,
    
    // モック設定
    server: {
      deps: {
        inline: ['konva', 'react-konva']
      }
    },
    
    // 環境変数とグローバル定義
    define: {
      global: 'globalThis',
    },
    
    // テスト環境の環境変数設定
    env: {
      VITE_TEST_MODE: 'true'
    },
    
    // ログ出力制御
    logHeapUsage: true,
    silent: false,
    
    // プールオプション
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    }
  }
})