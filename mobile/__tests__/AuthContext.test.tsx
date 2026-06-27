import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

jest.mock('@clerk/expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock('@/services/apiClient', () => ({
  setApiTokenProvider: jest.fn(),
  apiClient: {},
}));

jest.mock('@/services/authEvents', () => ({
  onForceLogout: jest.fn(() => () => {}),
  emitForceLogout: jest.fn(),
}));

jest.mock('@/context/QueryProvider', () => ({
  queryClient: { clear: jest.fn() },
}));

import { useAuth as useClerkAuth, useUser } from '@clerk/expo';
import { setApiTokenProvider } from '@/services/apiClient';
import { onForceLogout } from '@/services/authEvents';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const mockedUseClerkAuth = useClerkAuth as jest.Mock;
const mockedUseUser = useUser as jest.Mock;
const mockedSetApiTokenProvider = setApiTokenProvider as jest.Mock;
const mockedOnForceLogout = onForceLogout as jest.Mock;

function makeAuthMock(overrides: Record<string, unknown> = {}) {
  return {
    isSignedIn: false,
    isLoaded: true,
    signOut: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue('clerk-token'),
    ...overrides,
  };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockedOnForceLogout.mockReturnValue(() => {});
  mockedUseClerkAuth.mockReturnValue(makeAuthMock());
  mockedUseUser.mockReturnValue({ user: null });
});

describe('AuthContext', () => {
  it('is unauthenticated when Clerk reports not signed in', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('is authenticated and maps Clerk user fields when signed in', () => {
    mockedUseClerkAuth.mockReturnValue(makeAuthMock({ isSignedIn: true }));
    mockedUseUser.mockReturnValue({
      user: {
        id: 'user_123',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        fullName: 'Test User',
        imageUrl: 'https://img.example.com/avatar',
        publicMetadata: { role: 'student' },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('user_123');
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.user?.role).toBe('student');
  });

  it('maps publicMetadata.role=instructor to role instructor', () => {
    mockedUseClerkAuth.mockReturnValue(makeAuthMock({ isSignedIn: true }));
    mockedUseUser.mockReturnValue({
      user: {
        id: 'user_456',
        primaryEmailAddress: { emailAddress: 'instructor@example.com' },
        fullName: 'Instructor',
        imageUrl: null,
        publicMetadata: { role: 'instructor' },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.role).toBe('instructor');
  });

  it('wires Clerk getToken into setApiTokenProvider on mount', () => {
    const getToken = jest.fn().mockResolvedValue('tok-abc');
    mockedUseClerkAuth.mockReturnValue(makeAuthMock({ getToken }));

    renderHook(() => useAuth(), { wrapper });
    expect(mockedSetApiTokenProvider).toHaveBeenCalled();
  });

  it('calls Clerk signOut when the force-logout event fires', async () => {
    let capturedCallback: (() => void) | undefined;
    mockedOnForceLogout.mockImplementation((cb: () => void) => {
      capturedCallback = cb;
      return () => {};
    });

    const signOut = jest.fn().mockResolvedValue(undefined);
    mockedUseClerkAuth.mockReturnValue(makeAuthMock({ isSignedIn: true, signOut }));

    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      capturedCallback?.();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(signOut).toHaveBeenCalled();
  });
});
