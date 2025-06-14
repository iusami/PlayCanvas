import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',
  
  // 並列実行を無効化（Electronアプリは同時に複数起動できないため）
  fullyParallel: false,
  workers: 1,
  
  // CI失敗時にリトライしない
  forbidOnly: !!process.env.CI,
  
  // CI環境でのリトライ設定
  retries: process.env.CI ? 2 : 0,
  
  // レポーター設定
  reporter: [
    ['html'],
    ['list']
  ],
  
  // 全テスト共通の設定
  use: {
    // スクリーンショットを失敗時のみ撮影
    screenshot: 'only-on-failure',
    
    // ビデオ録画を失敗時のみ
    video: 'retain-on-failure',
    
    // トレースを失敗時のみ
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:5173',
      },
    },
  ],

  // グローバルセットアップを無効化（各テストで個別に起動）
  // globalSetup: path.resolve(__dirname, 'e2e/global-setup.ts'),
  
  // テスト後のクリーンアップを無効化
  // globalTeardown: path.resolve(__dirname, 'e2e/global-teardown.ts'),

  // 開発サーバー自動起動
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // テストタイムアウト設定
  timeout: 30000,
  expect: {
    timeout: 10000,
  },

  // 出力ディレクトリ
  outputDir: 'playwright-report/',
});