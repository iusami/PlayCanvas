import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrivateRoute } from '@/components/Auth/PrivateRoute'
import { useAuth } from '@/contexts/AuthContext'
import type { User } from '@supabase/supabase-js'

// useAuthをモック
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// AuthPageとPendingApprovalPageをモック
vi.mock('@/components/Auth/AuthPage', () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>
}))

vi.mock('@/components/Auth/PendingApprovalPage', () => ({
  PendingApprovalPage: () => <div data-testid="pending-approval-page">Pending Approval Page</div>
}))

describe('PrivateRoute Component', () => {
  const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    vi.clearAllMocks()
    // テストモードを無効化
    vi.stubEnv('VITE_TEST_MODE', 'false')
  })

  describe('認証状態による表示制御', () => {
    it('ローディング中の場合、ローディング画面が表示されること', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByText('認証状態を確認中...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('未認証の場合、認証ページが表示されること', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('auth-page')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('認証済みかつメール確認済みの場合、子コンポーネントが表示されること', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2023-01-01T00:00:00Z',
        user_metadata: {}
      } as User

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('pending-approval-page')).not.toBeInTheDocument()
    })
  })

  describe('管理者承認フロー', () => {
    it('管理者承認が必要かつメール未確認の場合、承認待ち画面が表示されること', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null,
        user_metadata: {
          manual_approval_required: true
        }
      } as User

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('pending-approval-page')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
    })

    it('管理者承認が不要でメール未確認の場合、子コンポーネントが表示されること', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null,
        user_metadata: {
          manual_approval_required: false
        }
      } as User

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-approval-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
    })

    it('ソーシャルログインユーザー（manual_approval_requiredなし）の場合、子コンポーネントが表示されること', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null, // ソーシャルログインでは確認不要の場合がある
        user_metadata: {} // manual_approval_requiredフラグなし
      } as User

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-approval-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
    })

    it('管理者承認が必要だがメール確認済みの場合、子コンポーネントが表示されること', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2023-01-01T00:00:00Z',
        user_metadata: {
          manual_approval_required: true
        }
      } as User

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('pending-approval-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
    })
  })

  describe('テスト環境での動作', () => {
    it('テストモードの場合、認証チェックがバイパスされること', () => {
      vi.stubEnv('VITE_TEST_MODE', 'true')

      mockUseAuth.mockReturnValue({
        user: null,
        loading: false
      })

      render(
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('pending-approval-page')).not.toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('userがundefinedでmetadataが存在する場合でもエラーが発生しないこと', () => {
      mockUseAuth.mockReturnValue({
        user: undefined,
        loading: false
      })

      expect(() => {
        render(
          <PrivateRoute>
            <div data-testid="protected-content">Protected Content</div>
          </PrivateRoute>
        )
      }).not.toThrow()

      expect(screen.getByTestId('auth-page')).toBeInTheDocument()
    })

    it('user_metadataがnullの場合でもエラーが発生しないこと', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: null,
        user_metadata: null
      } as User

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false
      })

      expect(() => {
        render(
          <PrivateRoute>
            <div data-testid="protected-content">Protected Content</div>
          </PrivateRoute>
        )
      }).not.toThrow()

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })
})