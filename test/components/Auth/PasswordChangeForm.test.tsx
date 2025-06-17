import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasswordChangeForm } from '@/components/Auth/PasswordChangeForm'
import { useAuth } from '@/contexts/AuthContext'

// useAuthをモック
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

describe('PasswordChangeForm Component', () => {
  const mockUseAuth = vi.mocked(useAuth)
  const mockUpdatePassword = vi.fn()
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      updatePassword: mockUpdatePassword,
      user: null,
      session: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn()
    })
  })

  describe('表示制御', () => {
    it('isOpenがfalseの場合、何も表示されないこと', () => {
      render(
        <PasswordChangeForm
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )

      expect(screen.queryByText('パスワード変更')).not.toBeInTheDocument()
    })

    it('isOpenがtrueの場合、モーダルが表示されること', () => {
      render(
        <PasswordChangeForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )

      expect(screen.getByRole('heading', { name: 'パスワード変更' })).toBeInTheDocument()
      expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument()
      expect(screen.getByLabelText('新しいパスワード（確認）')).toBeInTheDocument()
    })
  })

  describe('フォーム操作', () => {
    beforeEach(() => {
      render(
        <PasswordChangeForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )
    })

    it('パスワード入力フィールドに値を入力できること', () => {
      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

      expect(newPasswordInput).toHaveValue('newpassword123')
      expect(confirmPasswordInput).toHaveValue('newpassword123')
    })

    it('×ボタンをクリックするとonCloseが呼ばれること', () => {
      const closeButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('キャンセルボタンをクリックするとonCloseが呼ばれること', () => {
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('バリデーション', () => {
    beforeEach(() => {
      render(
        <PasswordChangeForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )
    })

    it('空のフィールドで送信するとエラーが表示されること', async () => {
      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('すべてのフィールドを入力してください')
      })
    })

    it('6文字未満のパスワードで送信するとエラーが表示されること', async () => {
      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: '12345' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } })

      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('パスワードは6文字以上で入力してください')
      })
    })

    it('パスワードが一致しない場合にエラーが表示されること', async () => {
      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } })

      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('新しいパスワードが一致しません')
      })
    })
  })

  describe('パスワード変更処理', () => {
    beforeEach(() => {
      render(
        <PasswordChangeForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )
    })

    it('正常なパスワードで送信が成功すること', async () => {
      mockUpdatePassword.mockResolvedValue({ error: null })

      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123')
        expect(mockOnSuccess).toHaveBeenCalledWith('パスワードを変更しました')
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      })
    })

    it('パスワード変更でエラーが発生した場合にエラーメッセージが表示されること', async () => {
      const errorMessage = 'パスワード変更に失敗しました'
      mockUpdatePassword.mockResolvedValue({ error: { message: errorMessage } })

      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith('newpassword123')
        expect(mockOnError).toHaveBeenCalledWith(errorMessage)
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })

    it('予期しないエラーが発生した場合に適切なエラーメッセージが表示されること', async () => {
      mockUpdatePassword.mockRejectedValue(new Error('Network error'))

      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('予期しないエラーが発生しました')
      })
    })
  })

  describe('ローディング状態', () => {
    beforeEach(() => {
      render(
        <PasswordChangeForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )
    })

    it('送信中はボタンが無効化されること', async () => {
      // 長時間実行されるプロミスを返すモック
      mockUpdatePassword.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ error: null }), 1000)
      }))

      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } })

      const form = screen.getByRole('button', { name: 'パスワード変更' }).closest('form')
      fireEvent.submit(form!)

      // ローディング中の状態を確認
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '変更中...' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '変更中...' })).toBeDisabled()
        expect(screen.getByRole('button', { name: '×' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
      })
    })
  })

  describe('フォームクリア機能', () => {
    it('フォームを閉じる際にフィールドがクリアされること', () => {
      render(
        <PasswordChangeForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      )

      const newPasswordInput = screen.getByLabelText('新しいパスワード')
      const confirmPasswordInput = screen.getByLabelText('新しいパスワード（確認）')

      // フィールドに値を入力
      fireEvent.change(newPasswordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      expect(newPasswordInput).toHaveValue('password123')
      expect(confirmPasswordInput).toHaveValue('password123')

      // フォームを閉じる
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})