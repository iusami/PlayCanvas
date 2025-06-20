import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../src/App'
import { localStorageMock } from '../setup'

// 統合テスト: 設定変更とアプリケーション状態の統合
describe('設定統合フロー', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('テーマ設定の変更がアプリケーション全体に反映されること', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // 1. 初期状態でライトテーマが適用されていることを確認
    const appElement = screen.getByTestId('app-container')
    expect(appElement).toHaveClass('theme-light')

    // 2. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    // 3. テーマタブを選択
    const themeTab = screen.getByRole('tab', { name: /テーマ/ })
    await user.click(themeTab)

    // 4. ダークテーマを選択
    const darkThemeRadio = screen.getByRole('radio', { name: /ダーク/ })
    await user.click(darkThemeRadio)

    // 5. 設定を保存
    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 6. アプリケーション全体にダークテーマが適用されることを確認
    await waitFor(() => {
      expect(appElement).toHaveClass('theme-dark')
      expect(appElement).not.toHaveClass('theme-light')
    })

    // 7. 設定がlocalStorageに保存されていることを確認
    const savedSettings = JSON.parse(localStorageMock.getItem('football-canvas-settings') || '{}')
    expect(savedSettings.theme).toBe('dark')

    // 8. ヘッダー、サイドバー、キャンバスエリアもダークテーマになることを確認
    const header = screen.getByTestId('header')
    const sidebar = screen.getByTestId('sidebar')
    const canvasArea = screen.getByTestId('canvas-area')

    expect(header).toHaveClass('theme-dark')
    expect(sidebar).toHaveClass('theme-dark')
    expect(canvasArea).toHaveClass('theme-dark')
  })

  it('自動保存設定の変更が動作に反映されること', async () => {
    const user = userEvent.setup()
    
    // テストプレイを準備
    const testPlay = {
      id: 'auto-save-test',
      name: '自動保存テストプレイ',
      players: [
        { id: 'player-1', position: { x: 100, y: 200 }, team: 'offense', number: 1 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([testPlay]))

    render(<App />)

    // 1. 設定画面を開いて自動保存を無効にする
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    const generalTab = screen.getByRole('tab', { name: /一般/ })
    await user.click(generalTab)

    const autoSaveCheckbox = screen.getByRole('checkbox', { name: /自動保存/ })
    await user.click(autoSaveCheckbox) // 無効にする

    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 2. プレイを編集
    const playItem = screen.getByText('自動保存テストプレイ')
    await user.click(playItem)

    // プレーヤーの位置を変更（ドラッグ操作をシミュレート）
    const canvas = screen.getByRole('canvas')
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 200 })
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 250 })
    fireEvent.mouseUp(canvas, { clientX: 150, clientY: 250 })

    // 3. 自動保存が無効の場合、変更が自動保存されないことを確認
    await waitFor(() => {
      const savedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const savedPlay = savedPlays.find((p: any) => p.id === 'auto-save-test')
      
      // 元の座標のまま（自動保存されていない）
      expect(savedPlay.players[0].position.x).toBe(100)
      expect(savedPlay.players[0].position.y).toBe(200)
    })

    // 4. 手動保存ボタンが表示されることを確認
    const manualSaveButton = screen.getByRole('button', { name: /保存/ })
    expect(manualSaveButton).toBeInTheDocument()
    expect(manualSaveButton).not.toBeDisabled()

    // 5. 手動保存を実行
    await user.click(manualSaveButton)

    // 6. 変更が保存されることを確認
    await waitFor(() => {
      const savedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const savedPlay = savedPlays.find((p: any) => p.id === 'auto-save-test')
      
      // 変更された座標が保存されている
      expect(savedPlay.players[0].position.x).toBe(150)
      expect(savedPlay.players[0].position.y).toBe(250)
    })
  })

  it('自動バックアップ設定が実際のバックアップ動作に反映されること', async () => {
    const user = userEvent.setup()
    
    // タイマーをモック
    vi.useFakeTimers()

    render(<App />)

    // 1. 自動バックアップ設定を有効にする
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    const backupTab = screen.getByRole('tab', { name: /バックアップ/ })
    await user.click(backupTab)

    const autoBackupCheckbox = screen.getByRole('checkbox', { name: /自動バックアップを有効/ })
    await user.click(autoBackupCheckbox)

    const intervalSelect = screen.getByRole('combobox', { name: /バックアップ間隔/ })
    await user.selectOptions(intervalSelect, '1') // 1時間間隔

    const maxBackupsInput = screen.getByRole('spinbutton', { name: /最大バックアップ数/ })
    await user.clear(maxBackupsInput)
    await user.type(maxBackupsInput, '5')

    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 2. 設定がlocalStorageに保存されていることを確認
    await waitFor(() => {
      const savedSettings = JSON.parse(localStorageMock.getItem('football-canvas-settings') || '{}')
      expect(savedSettings.backupSettings.autoBackup).toBe(true)
      expect(savedSettings.backupSettings.backupInterval).toBe(1)
      expect(savedSettings.backupSettings.maxBackups).toBe(5)
    })

    // 3. プレイを作成してデータ変更をトリガー
    const addPlayButton = screen.getByRole('button', { name: /新しいプレイを追加/ })
    await user.click(addPlayButton)

    const playNameInput = screen.getByLabelText(/プレイ名/)
    await user.type(playNameInput, '自動バックアップテストプレイ')

    const createButton = screen.getByRole('button', { name: /作成/ })
    await user.click(createButton)

    // 4. 時間を進めて自動バックアップをトリガー
    vi.advanceTimersByTime(60 * 60 * 1000) // 1時間

    // 5. 自動バックアップが実行されたことを確認
    await waitFor(() => {
      const lastBackupTime = localStorageMock.getItem('football-canvas-last-auto-backup')
      expect(lastBackupTime).toBeTruthy()
    })

    vi.useRealTimers()
  })

  it('言語設定の変更がUI表示に反映されること', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // 1. 初期状態で日本語が表示されていることを確認
    expect(screen.getByText('Football Canvas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /新しいプレイを追加/ })).toBeInTheDocument()

    // 2. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    const generalTab = screen.getByRole('tab', { name: /一般/ })
    await user.click(generalTab)

    // 3. 言語を英語に変更
    const languageSelect = screen.getByRole('combobox', { name: /言語/ })
    await user.selectOptions(languageSelect, 'en')

    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 4. UI表示が英語に変更されることを確認
    await waitFor(() => {
      expect(screen.getByText('Football Canvas')).toBeInTheDocument() // アプリ名は変わらず
      expect(screen.getByRole('button', { name: /Add New Play/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Settings/ })).toBeInTheDocument()
    })

    // 5. 設定がlocalStorageに保存されていることを確認
    const savedSettings = JSON.parse(localStorageMock.getItem('football-canvas-settings') || '{}')
    expect(savedSettings.language).toBe('en')
  })

  it('キーボードショートカット設定が動作に反映されること', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // 1. 設定画面でキーボードショートカットを変更
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    const shortcutsTab = screen.getByRole('tab', { name: /ショートカット/ })
    await user.click(shortcutsTab)

    // 保存のショートカットをCtrl+SからCtrl+Alt+Sに変更
    const saveShortcutInput = screen.getByRole('textbox', { name: /保存ショートカット/ })
    await user.clear(saveShortcutInput)
    await user.type(saveShortcutInput, 'Ctrl+Alt+S')

    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 2. プレイを作成して編集状態にする
    const addPlayButton = screen.getByRole('button', { name: /新しいプレイを追加/ })
    await user.click(addPlayButton)

    const playNameInput = screen.getByLabelText(/プレイ名/)
    await user.type(playNameInput, 'ショートカットテストプレイ')

    // 3. 新しいショートカット（Ctrl+Alt+S）で保存を実行
    await user.keyboard('{Control>}{Alt>}s{/Alt}{/Control}')

    // 4. 保存が実行されることを確認
    await waitFor(() => {
      expect(screen.getByText('ショートカットテストプレイ')).toBeInTheDocument()
      
      const savedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      expect(savedPlays).toHaveLength(1)
      expect(savedPlays[0].name).toBe('ショートカットテストプレイ')
    })

    // 5. 古いショートカット（Ctrl+S）が動作しないことを確認
    const playNameInput2 = screen.getByLabelText(/プレイ名/)
    await user.clear(playNameInput2)
    await user.type(playNameInput2, '変更されたプレイ名')

    await user.keyboard('{Control>}s{/Control}') // 古いショートカット

    // 古いショートカットでは保存されない
    const savedPlaysAfterOldShortcut = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
    expect(savedPlaysAfterOldShortcut[0].name).toBe('ショートカットテストプレイ') // 変更されていない
  })

  it('フィールド表示設定がキャンバスに反映されること', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // 1. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /設定/ })
    await user.click(settingsButton)

    const displayTab = screen.getByRole('tab', { name: /表示/ })
    await user.click(displayTab)

    // 2. フィールドライン表示を変更
    const showYardLinesCheckbox = screen.getByRole('checkbox', { name: /ヤードライン表示/ })
    await user.click(showYardLinesCheckbox) // 無効にする

    const showHashMarksCheckbox = screen.getByRole('checkbox', { name: /ハッシュマーク表示/ })
    await user.click(showHashMarksCheckbox) // 無効にする

    // 3. グリッド表示を有効にする
    const showGridCheckbox = screen.getByRole('checkbox', { name: /グリッド表示/ })
    await user.click(showGridCheckbox)

    const saveButton = screen.getByRole('button', { name: /保存/ })
    await user.click(saveButton)

    // 4. キャンバスに設定が反映されることを確認
    await waitFor(() => {
      const canvas = screen.getByRole('canvas')
      
      // キャンバスの描画内容は直接確認できないため、
      // 設定がlocalStorageに保存されていることで間接的に確認
      const savedSettings = JSON.parse(localStorageMock.getItem('football-canvas-settings') || '{}')
      expect(savedSettings.display.showYardLines).toBe(false)
      expect(savedSettings.display.showHashMarks).toBe(false)
      expect(savedSettings.display.showGrid).toBe(true)
    })

    // 5. プレイを作成してキャンバスが正常に動作することを確認
    const addPlayButton = screen.getByRole('button', { name: /新しいプレイを追加/ })
    await user.click(addPlayButton)

    const playNameInput = screen.getByLabelText(/プレイ名/)
    await user.type(playNameInput, '表示設定テストプレイ')

    const createButton = screen.getByRole('button', { name: /作成/ })
    await user.click(createButton)

    // キャンバスが正常に描画されることを確認
    await waitFor(() => {
      const canvas = screen.getByRole('canvas')
      expect(canvas).toBeInTheDocument()
      expect(canvas).toBeVisible()
    })
  })

  it('設定のリセット機能が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    // カスタム設定を事前に設定
    const customSettings = {
      theme: 'dark',
      language: 'en',
      autoSave: false,
      backupSettings: {
        autoBackup: false,
        backupInterval: 12,
        maxBackups: 3
      },
      display: {
        showYardLines: false,
        showHashMarks: false,
        showGrid: true
      }
    }

    localStorageMock.setItem('football-canvas-settings', JSON.stringify(customSettings))

    render(<App />)

    // 1. カスタム設定が適用されていることを確認
    const appElement = screen.getByTestId('app-container')
    expect(appElement).toHaveClass('theme-dark')

    // 2. 設定画面を開く
    const settingsButton = screen.getByRole('button', { name: /Settings/ }) // 英語表示
    await user.click(settingsButton)

    // 3. 設定をリセット
    const resetButton = screen.getByRole('button', { name: /Reset to Default/ })
    await user.click(resetButton)

    // 確認ダイアログで確定
    const confirmButton = screen.getByRole('button', { name: /Confirm/ })
    await user.click(confirmButton)

    // 4. デフォルト設定に戻ることを確認
    await waitFor(() => {
      const resetSettings = JSON.parse(localStorageMock.getItem('football-canvas-settings') || '{}')
      expect(resetSettings.theme).toBe('light')
      expect(resetSettings.language).toBe('ja')
      expect(resetSettings.autoSave).toBe(true)
      expect(resetSettings.backupSettings.autoBackup).toBe(true)
      expect(resetSettings.display.showYardLines).toBe(true)
    })

    // 5. UI表示がデフォルトに戻ることを確認
    expect(appElement).toHaveClass('theme-light')
    expect(appElement).not.toHaveClass('theme-dark')

    // 日本語表示に戻る
    expect(screen.getByRole('button', { name: /設定/ })).toBeInTheDocument()
  })
})