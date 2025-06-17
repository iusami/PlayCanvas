import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// モックユーザー情報
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  confirmation_sent_at: undefined,
  recovery_sent_at: undefined,
  email_change_sent_at: undefined,
  new_email: undefined,
  new_phone: undefined,
  invited_at: undefined,
  action_link: undefined,
  created_at: '2024-01-01T00:00:00.000Z',
  confirmed_at: '2024-01-01T00:00:00.000Z',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone_confirmed_at: undefined,
  last_sign_in_at: '2024-01-01T00:00:00.000Z',
  role: undefined,
  updated_at: '2024-01-01T00:00:00.000Z'
}

// モックセッション情報
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser
}

// AuthContext用のモック値
export const createMockAuthContext = (overrides = {}) => ({
  user: mockUser,
  session: mockSession,
  loading: false,
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  signInWithProvider: vi.fn().mockResolvedValue({ error: null }),
  ...overrides
})

// AuthProviderでラップしてレンダリングするヘルパー関数
interface RenderWithAuthOptions extends RenderOptions {
  authContext?: any
}

export const renderWithAuth = (
  ui: React.ReactElement,
  { authContext = createMockAuthContext(), ...renderOptions }: RenderWithAuthOptions = {}
) => {
  // MockAuthProvider: 実際のAuthProviderの代替として使用
  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    return (
      <div data-testid="mock-auth-provider">
        {children}
      </div>
    )
  }

  const Wrapper = ({ children }: { children?: React.ReactNode }) => (
    <MockAuthProvider>{children}</MockAuthProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// 認証エラーのモック
export const createMockAuthError = (message = 'Authentication error') => ({
  message,
  status: 400
})

// ログアウト済みユーザーのモック
export const createMockLoggedOutContext = () => createMockAuthContext({
  user: null,
  session: null,
  signOut: vi.fn().mockResolvedValue({ error: null })
})

// ログアウトエラーのモック
export const createMockSignOutErrorContext = () => createMockAuthContext({
  signOut: vi.fn().mockResolvedValue({ 
    error: createMockAuthError('Sign out failed') 
  })
})