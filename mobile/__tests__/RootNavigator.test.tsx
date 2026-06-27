import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

jest.mock('@clerk/expo', () => ({
  useSignIn: jest.fn(() => ({
    signIn: { create: jest.fn() },
    setActive: jest.fn(),
    isLoaded: true,
  })),
  useSignUp: jest.fn(() => ({
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
    },
    setActive: jest.fn(),
    isLoaded: true,
  })),
  useAuth: jest.fn(() => ({ isSignedIn: false, isLoaded: true })),
  useUser: jest.fn(() => ({ user: null })),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
}));

import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { QueryProvider } from '@/context/QueryProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

const mockedUseAuth = useAuth as jest.Mock;

function makeAuthState(overrides: Record<string, unknown> = {}) {
  return {
    isAuthenticated: false,
    isLoading: false,
    isAuthenticating: false,
    user: null,
    tokens: null,
    login: jest.fn(),
    logout: jest.fn(),
    ...overrides,
  };
}

function renderWithProviders() {
  return render(
    <ThemeProvider>
      <QueryProvider>
        <RootNavigator />
      </QueryProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RootNavigator – auth-gated routing', () => {
  it('renders the LoginScreen when not signed in', async () => {
    mockedUseAuth.mockReturnValue(makeAuthState({ isAuthenticated: false }));
    const { findByTestId } = renderWithProviders();
    const button = await findByTestId('oidc-login-button');
    expect(button).toBeTruthy();
  });

  it('does not render the LoginScreen when signed in', async () => {
    mockedUseAuth.mockReturnValue(
      makeAuthState({
        isAuthenticated: true,
        user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'student' },
      }),
    );
    const { queryByTestId } = renderWithProviders();
    await waitFor(() => expect(queryByTestId('oidc-login-button')).toBeNull());
  });
});
