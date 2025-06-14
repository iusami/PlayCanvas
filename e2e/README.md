# E2E テストガイド

このディレクトリには、Football Canvas アプリケーションのE2E（End-to-End）テストが含まれています。

## 必要な依存関係

E2Eテストを実行するには、以下の依存関係をインストールする必要があります：

```bash
npm install --save-dev @playwright/test @playwright/experimental-ct-react
```

## ディレクトリ構造

```
e2e/
├── README.md                 # このファイル
├── example.spec.ts          # 基本的なE2Eテストサンプル
├── electron-utils.ts        # Electronアプリ操作用ユーティリティ
├── global-setup.ts         # グローバルセットアップ（アプリ起動）
└── global-teardown.ts      # グローバルクリーンアップ（アプリ終了）
```

## テストの実行方法

### 基本的な実行

```bash
# E2Eテストを実行
npm run test:e2e

# UIモードでテストを実行（ブラウザで結果を確認）
npm run test:e2e:ui

# デバッグモードでテストを実行
npm run test:e2e:debug

# テストレポートを表示
npm run test:e2e:report
```

### 個別テストの実行

```bash
# 特定のテストファイルを実行
npx playwright test e2e/example.spec.ts

# 特定のテストケースを実行
npx playwright test e2e/example.spec.ts -g "アプリケーションが正常に起動すること"
```

## テストの構成

### Global Setup/Teardown

- `global-setup.ts`: テスト開始前にElectronアプリをビルド・起動
- `global-teardown.ts`: テスト完了後にElectronアプリを終了

### Electron Utils

`electron-utils.ts`は、Electronアプリとの操作を簡単にするためのユーティリティクラスです：

```typescript
const electronUtils = new ElectronTestUtils();
const { app, page } = await electronUtils.connectToElectron();

// 要素の待機
await electronUtils.waitForElement('canvas');

// スクリーンショット撮影
await electronUtils.takeScreenshot('test-result');

// アプリ終了
await electronUtils.closeElectron();
```

## テストの書き方

### 基本的なテスト構造

```typescript
import { test, expect } from '@playwright/test';
import { ElectronTestUtils } from './electron-utils';

test.describe('テスト群の説明', () => {
  let electronUtils: ElectronTestUtils;
  
  test.beforeEach(async () => {
    electronUtils = new ElectronTestUtils();
  });

  test.afterEach(async () => {
    await electronUtils.closeElectron();
  });

  test('テストケースの説明', async () => {
    // Arrange: テスト準備
    const { app, page } = await electronUtils.connectToElectron();
    
    // Act: テスト実行
    const title = await electronUtils.getTitle();
    
    // Assert: 結果検証
    expect(title).toContain('Football Canvas');
  });
});
```

### テストのベストプラクティス

1. **AAA パターンを使用**
   - Arrange: テストの準備
   - Act: テスト対象の実行
   - Assert: 結果の検証

2. **適切な待機処理**
   - 要素の表示を待つ: `waitForElement()`
   - テキストの表示を待つ: `waitForText()`
   - 時間での待機: `page.waitForTimeout()`

3. **スクリーンショットの活用**
   - 重要な状態でスクリーンショットを撮影
   - デバッグ時の状況確認に有効

4. **エラーハンドリング**
   - 要素が見つからない場合の代替処理
   - タイムアウト設定の調整

## トラブルシューティング

### よくある問題

1. **Electronアプリが起動しない**
   - ビルドエラーがないか確認: `npm run build`
   - ポートの競合がないか確認

2. **要素が見つからない**
   - セレクタが正しいか確認
   - 要素の読み込み待機時間を調整
   - `data-testid`属性の追加を検討

3. **テストが不安定**
   - 適切な待機処理の追加
   - タイムアウト設定の調整
   - 並列実行の無効化（既に設定済み）

### デバッグ方法

```bash
# デバッグモードで実行
npm run test:e2e:debug

# ヘッドフルモードで実行
npx playwright test --headed

# スローモーションで実行
npx playwright test --headed --slowMo=1000
```

## 設定ファイル

メインの設定は `playwright.config.ts` で管理されています：

- テストディレクトリ: `./e2e`
- 並列実行: 無効（Electronアプリは1つのみ起動可能）
- レポート: HTML + リスト形式
- スクリーンショット: 失敗時のみ
- ビデオ録画: 失敗時のみ