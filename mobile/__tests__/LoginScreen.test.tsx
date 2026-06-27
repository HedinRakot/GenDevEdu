import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@clerk/expo', () => ({
  useSignIn: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
}));

import { LoginScreen } from '@/screens/auth/LoginScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { useSignIn } from '@clerk/expo';

const mockedUseSignIn = useSignIn as jest.Mock;

// Future API shape: useSignIn() -> { signIn, errors, fetchStatus }.
// Password sign-in uses signIn.password() (returns { error }); session via signIn.finalize().
function makeSignInMock(passwordOverride?: jest.Mock) {
  return {
    signIn: {
      status: 'complete',
      password: passwordOverride ?? jest.fn().mockResolvedValue({ error: null }),
      finalize: jest.fn().mockResolvedValue({ error: null }),
    },
    errors: null,
    fetchStatus: 'idle',
  };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <LoginScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseSignIn.mockReturnValue(makeSignInMock());
});

describe('LoginScreen', () => {
  it('renders the form even when the signIn resource is not yet available', () => {
    mockedUseSignIn.mockReturnValue({ signIn: null, errors: null, fetchStatus: 'idle' });
    const { getByTestId } = renderScreen();
    expect(getByTestId('oidc-login-button')).toBeTruthy();
  });

  it('calls signIn.password and finalize when the login button is pressed', async () => {
    const passwordSpy = jest.fn().mockResolvedValue({ error: null });
    const finalizeSpy = jest.fn().mockResolvedValue({ error: null });
    mockedUseSignIn.mockReturnValue({
      signIn: { status: 'complete', password: passwordSpy, finalize: finalizeSpy },
      errors: null,
      fetchStatus: 'idle',
    });

    const { getByTestId } = renderScreen();
    fireEvent.changeText(getByTestId('login-email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('login-password-input'), 'secret123');
    fireEvent.press(getByTestId('oidc-login-button'));

    await waitFor(() =>
      expect(passwordSpy).toHaveBeenCalledWith({ identifier: 'user@example.com', password: 'secret123' }),
    );
    await waitFor(() => expect(finalizeSpy).toHaveBeenCalled());
  });

  it('shows an inline error when sign-in returns an error', async () => {
    mockedUseSignIn.mockReturnValue(
      makeSignInMock(jest.fn().mockResolvedValue({ error: { message: 'boom', longMessage: 'boom long' } })),
    );

    const { getByTestId, findByTestId } = renderScreen();
    fireEvent.press(getByTestId('oidc-login-button'));

    const banner = await findByTestId('login-error');
    expect(banner.props.children).toBe('boom long');
  });

  it('uses the network-specific error message for network failures', async () => {
    mockedUseSignIn.mockReturnValue(
      makeSignInMock(jest.fn().mockRejectedValue(new Error('Network request failed'))),
    );

    const { getByTestId, findByTestId } = renderScreen();
    fireEvent.press(getByTestId('oidc-login-button'));

    const banner = await findByTestId('login-error');
    expect(banner.props.children).toMatch(/Netzwerkverbindung|network connection/i);
  });

  it('navigates to SignUp when the sign-up link is pressed', () => {
    const navigateSpy = jest.fn();
    const { useNavigation } = require('@react-navigation/native');
    (useNavigation as jest.Mock).mockReturnValue({ navigate: navigateSpy, goBack: jest.fn() });

    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('sign-up-link'));
    expect(navigateSpy).toHaveBeenCalledWith('SignUp');
  });

  it('navigates to ForgotPassword when the forgot-password link is pressed', () => {
    const navigateSpy = jest.fn();
    const { useNavigation } = require('@react-navigation/native');
    (useNavigation as jest.Mock).mockReturnValue({ navigate: navigateSpy, goBack: jest.fn() });

    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('forgot-password-link'));
    expect(navigateSpy).toHaveBeenCalledWith('ForgotPassword');
  });
});
