import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import AccountDropdown from '../../src/components/AccountDropdown'
import { renderWithAuth } from '../utils/testUtils'

describe('AccountDropdown Component', () => {
  const mockUser = { email: 'test@example.com' }
  const mockOnPasswordChange = vi.fn()
  const mockOnBackupManager = vi.fn()
  const mockOnSettings = vi.fn()
  const mockOnSignOut = vi.fn()

  const defaultProps = {
    user: mockUser,
    isTestMode: false,
    onPasswordChange: mockOnPasswordChange,
    onBackupManager: mockOnBackupManager,
    onSettings: mockOnSettings,
    onSignOut: mockOnSignOut
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期レンダリング', () => {
    it('アカウントボタンが正常にレンダリングされること', () => {
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      // アバター文字が表示される
      expect(screen.getByText('T')).toBeInTheDocument()
      
      // ドロップダウンボタンが存在する
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-haspopup', 'true')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('初期状態でドロップダウンメニューが閉じていること', () => {
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      // メニュー項目が表示されていない
      expect(screen.queryByText('設定')).not.toBeInTheDocument()
      expect(screen.queryByText('バックアップ')).not.toBeInTheDocument()
      expect(screen.queryByText('パスワード変更')).not.toBeInTheDocument()
      expect(screen.queryByText('ログアウト')).not.toBeInTheDocument()
    })

    it('ユーザーアバターが正しく表示されること', () => {
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      // メールアドレスの最初の文字がアバターとして表示される
      expect(screen.getByText('T')).toBeInTheDocument()
    })
  })

  describe('ドロップダウンの開閉', () => {
    it('ボタンをクリックするとドロップダウンが開くこと', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // メニュー項目が表示される
      expect(screen.getByText('設定')).toBeInTheDocument()
      expect(screen.getByText('バックアップ')).toBeInTheDocument()
      expect(screen.getByText('パスワード変更')).toBeInTheDocument()
      expect(screen.getByText('ログアウト')).toBeInTheDocument()
      
      // ユーザー情報が表示される
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('アカウント設定')).toBeInTheDocument()
      
      // aria-expanded が true になる
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('開いている状態でボタンを再クリックするとドロップダウンが閉じること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      const button = screen.getByRole('button')
      
      // 開く
      await user.click(button)
      expect(screen.getByText('設定')).toBeInTheDocument()
      
      // 閉じる
      await user.click(button)
      expect(screen.queryByText('設定')).not.toBeInTheDocument()
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('click-outside機能', () => {
    it('ドロップダウンの外側をクリックすると閉じること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      const button = screen.getByRole('button')
      
      // ドロップダウンを開く
      await user.click(button)
      expect(screen.getByText('設定')).toBeInTheDocument()
      
      // 外側をクリック
      await user.click(document.body)
      
      // ドロップダウンが閉じる
      expect(screen.queryByText('設定')).not.toBeInTheDocument()
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('キーボード操作', () => {
    it('Escapeキーでドロップダウンが閉じること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      const button = screen.getByRole('button')
      
      // ドロップダウンを開く
      await user.click(button)
      expect(screen.getByText('設定')).toBeInTheDocument()
      
      // Escapeキーを押す
      await user.keyboard('{Escape}')
      
      // ドロップダウンが閉じる
      expect(screen.queryByText('設定')).not.toBeInTheDocument()
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('メニュー項目のクリック', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      // ドロップダウンを開く
      const button = screen.getByRole('button')
      await user.click(button)
    })

    it('設定ボタンをクリックするとonSettingsが呼ばれ、ドロップダウンが閉じること', async () => {
      const user = userEvent.setup()
      
      const settingsButton = screen.getByText('設定')
      await user.click(settingsButton)
      
      expect(mockOnSettings).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('設定')).not.toBeInTheDocument()
    })

    it('バックアップボタンをクリックするとonBackupManagerが呼ばれ、ドロップダウンが閉じること', async () => {
      const user = userEvent.setup()
      
      const backupButton = screen.getByText('バックアップ')
      await user.click(backupButton)
      
      expect(mockOnBackupManager).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('バックアップ')).not.toBeInTheDocument()
    })

    it('パスワード変更ボタンをクリックするとonPasswordChangeが呼ばれ、ドロップダウンが閉じること', async () => {
      const user = userEvent.setup()
      
      const passwordButton = screen.getByText('パスワード変更')
      await user.click(passwordButton)
      
      expect(mockOnPasswordChange).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('パスワード変更')).not.toBeInTheDocument()
    })

    it('ログアウトボタンをクリックするとonSignOutが呼ばれ、ドロップダウンが閉じること', async () => {
      const user = userEvent.setup()
      
      const signOutButton = screen.getByText('ログアウト')
      await user.click(signOutButton)
      
      expect(mockOnSignOut).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('ログアウト')).not.toBeInTheDocument()
    })
  })

  describe('テストモード', () => {
    it('テストモードではメニュー項目が表示されないこと', async () => {
      const user = userEvent.setup()
      const testModeProps = { ...defaultProps, isTestMode: true }
      renderWithAuth(<AccountDropdown {...testModeProps} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // メニュー項目が表示されない
      expect(screen.queryByText('設定')).not.toBeInTheDocument()
      expect(screen.queryByText('バックアップ')).not.toBeInTheDocument()
      expect(screen.queryByText('パスワード変更')).not.toBeInTheDocument()
      expect(screen.queryByText('ログアウト')).not.toBeInTheDocument()
      
      // ユーザー情報は表示される
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  describe('アバター表示', () => {
    it('異なるメールアドレスで正しいアバターが表示されること', () => {
      const props = { ...defaultProps, user: { email: 'john@example.com' } }
      renderWithAuth(<AccountDropdown {...props} />)
      
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('小文字のメールアドレスでも大文字のアバターが表示されること', () => {
      const props = { ...defaultProps, user: { email: 'alice@example.com' } }
      renderWithAuth(<AccountDropdown {...props} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されていること', () => {
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-haspopup', 'true')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('ドロップダウンが開いているときに適切なARIA属性が設定されていること', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AccountDropdown {...defaultProps} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })
  })
})