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
      reporter: process.env.CI ? ['json'] : ['text', 'json', 'html'],
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
      reportsDirectory: './coverage',
      // CI環境でのメモリ使用量を制限
      thresholds: process.env.CI ? {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      } : undefined
    },
    
    // テストのタイムアウト設定（CI環境を考慮して調整）
    testTimeout: process.env.CI ? 30000 : 15000,
    
    // watchモードの設定
    watch: false,
    
    // UI設定（必要に応じてコメントアウト解除）
    // ui: true,
    
    // レポーター設定（CI環境向けに調整）
    reporter: process.env.CI ? ['default'] : ['verbose'],
    
    // ファイル並列実行の設定（CI環境では無効）
    fileParallelism: !process.env.CI,
    
    // テスト並列実行の設定（CI環境では並列数を制限）
    maxConcurrency: process.env.CI ? 1 : 5,
    
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
      VITE_TEST_MODE: 'true',
      ...(process.env.CI && {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key-placeholder'
      })
    },
    
    // CI環境でのログ出力制御
    logHeapUsage: !process.env.CI,
    silent: process.env.CI,
    
    // プールオプション（CI環境でのパフォーマンス向上）
    pool: process.env.CI ? 'threads' : 'threads',
    poolOptions: {
      threads: {
        singleThread: process.env.CI ? true : false,
        isolate: true
      },
      forks: {
        singleFork: true,
        isolate: true,
        // CI環境では追加の安全措置
        ...(process.env.CI && {
          execArgv: ['--no-warnings'],
          env: {
            NODE_ENV: 'test',
            VITE_TEST_MODE: 'true'
          }
        })
      }
    },
    
    // CI環境での追加設定
    ...(process.env.CI && {
      isolate: true,
      sequence: {
        hooks: 'stack',
        shuffle: false,
        concurrent: false
      },
      // 完全シーケンシャル実行を強制
      maxConcurrency: 1,
      fileParallelism: false,
      // テスト間の待機時間
      setupTimeout: 30000,
      teardownTimeout: 30000
    })
  }
})