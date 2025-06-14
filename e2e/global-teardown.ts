import { FullConfig } from '@playwright/test';
import { electronProcess } from './global-setup';

async function globalTeardown(config: FullConfig) {
  console.log('Cleaning up Electron app...');
  
  if (electronProcess && !electronProcess.killed) {
    console.log('Terminating Electron process...');
    
    // Graceful shutdown
    electronProcess.kill('SIGTERM');
    
    // 強制終了のタイムアウト
    setTimeout(() => {
      if (electronProcess && !electronProcess.killed) {
        console.log('Force killing Electron process...');
        electronProcess.kill('SIGKILL');
      }
    }, 5000);
    
    // プロセス終了を待つ
    await new Promise<void>((resolve) => {
      if (!electronProcess) {
        resolve();
        return;
      }
      
      electronProcess.on('close', () => {
        console.log('Electron process terminated');
        resolve();
      });
      
      // フォールバック
      setTimeout(() => {
        resolve();
      }, 10000);
    });
  }
  
  console.log('Cleanup completed');
}

export default globalTeardown;