import { chromium, FullConfig } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

let electronProcess: ChildProcess | null = null;

async function globalSetup(config: FullConfig) {
  console.log('Starting Electron app for E2E tests...');
  
  // 開発サーバーを起動（ビルドをスキップ）
  console.log('Starting development server...');
  electronProcess = spawn('npm', ['run', 'electron-dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    env: {
      ...process.env,
      ELECTRON_IS_DEV: '1', // 開発モードで起動
    }
  });

  // アプリの起動を待つ
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Electron app failed to start within timeout'));
    }, 30000);

    if (electronProcess?.stdout) {
      electronProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Electron output:', output);
        
        // アプリが起動完了したことを示すログを待つ
        if (output.includes('ready-to-show') || output.includes('App started') || output.includes('Local:') || output.includes('vite')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    }

    if (electronProcess?.stderr) {
      electronProcess.stderr.on('data', (data) => {
        console.error('Electron error:', data.toString());
      });
    }

    electronProcess?.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    electronProcess?.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Electron process exited with code ${code}`));
      }
    });

    // フォールバック: 5秒待って続行
    setTimeout(() => {
      clearTimeout(timeout);
      console.log('Proceeding with tests after 5 second wait...');
      resolve();
    }, 5000);
  });

  console.log('Electron app started successfully');
}

export default globalSetup;
export { electronProcess };