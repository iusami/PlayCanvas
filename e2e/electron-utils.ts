import { Page, ElectronApplication, _electron as electron } from '@playwright/test';

/**
 * Electronアプリ用のユーティリティ関数
 */
export class ElectronTestUtils {
  private electronApp: ElectronApplication | null = null;
  private page: Page | null = null;

  /**
   * Electronアプリに接続
   */
  async connectToElectron(): Promise<{ app: ElectronApplication; page: Page }> {
    try {
      // 既に起動中のElectronアプリに接続を試みる
      // この方法では、global-setupで起動したアプリに接続する
      console.log('Attempting to connect to running Electron app...');
      
      // 新しいElectronアプリを直接起動する方法
      this.electronApp = await electron.launch({
        args: ['.'],
        cwd: process.cwd(),
        env: {
          ...process.env,
          ELECTRON_IS_DEV: '0'
        }
      });

      // メインページを取得
      this.page = await this.electronApp.firstWindow();
      
      // ページが読み込まれるまで待機
      await this.page.waitForLoadState('domcontentloaded');
      
      console.log('Successfully connected to Electron app');
      return { app: this.electronApp, page: this.page };
      
    } catch (error) {
      console.error('Failed to connect to Electron app:', error);
      throw error;
    }
  }

  /**
   * Electronアプリを閉じる
   */
  async closeElectron(): Promise<void> {
    if (this.electronApp) {
      await this.electronApp.close();
      this.electronApp = null;
      this.page = null;
      console.log('Electron app closed');
    }
  }

  /**
   * スクリーンショットを撮影
   */
  async takeScreenshot(name: string): Promise<void> {
    if (this.page) {
      await this.page.screenshot({ path: `playwright-report/screenshots/${name}.png` });
    }
  }

  /**
   * 要素が表示されるまで待機
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<void> {
    if (this.page) {
      await this.page.waitForSelector(selector, { timeout });
    }
  }

  /**
   * テキストが表示されるまで待機
   */
  async waitForText(text: string, timeout: number = 10000): Promise<void> {
    if (this.page) {
      await this.page.waitForFunction(
        (text) => document.body.textContent?.includes(text),
        text,
        { timeout }
      );
    }
  }

  /**
   * アプリのタイトルを取得
   */
  async getTitle(): Promise<string> {
    if (this.page) {
      return await this.page.title();
    }
    return '';
  }

  /**
   * 現在のページを取得
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Electronアプリを取得
   */
  getApp(): ElectronApplication | null {
    return this.electronApp;
  }
}