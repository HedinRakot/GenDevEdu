import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@clerk/expo', () => ({
  useSignUp: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
}));

import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { useSignUp } from '@clerk/expo';

const mockedUseSignUp = useSignUp as jest.Mock;

// Future API shape: useSignUp() -> { signUp, errors, fetchStatus }.
// Methods return { error } and the session is activated via signUp.finalize().
function makeSignUpMock(signUpOverrides: Record<string, unknown> = {}) {
  return {
    signUp: {
      status: 'complete',
      create: jest.fn().mockResolvedValue({ error: null }),
      verifications: {
        sendEmailCode: jest.fn().mockResolvedValue({ error: null }),
        verifyEmailCode: jest.fn().mockResolvedValue({ error: null }),
      },
      finalize: jest.fn().mockResolvedValue({ error: null }),
      ...signUpOverrides,
    },
    errors: null,
    fetchStatus: 'idle',
  };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <SignUpScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseSignUp.mockReturnValue(makeSignUpMock());
});

describe('SignUpScreen', () => {
  it('renders the form even when the signUp resource is not yet available', () => {
    mockedUseSignUp.mockReturnValue({ signUp: null, errors: null, fetchStatus: 'idle' });
    const { getByTestId } = renderScreen();
    expect(getByTestId('signup-button')).toBeTruthy();
  });

  it('shows an inline error when passwords differ', async () => {
    const { getByTestId, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('signup-email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('signup-password-input'), 'password1');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'different');
    fireEvent.press(getByTestId('signup-button'));

    const banner = await findByTestId('signup-error');
    expect(banner.props.children).toMatch(/Passwörter|Passwords/);
  });

  it('calls signUp.create and verifications.sendEmailCode on valid submission', async () => {
    const mock = makeSignUpMock();
    mockedUseSignUp.mockReturnValue(mock);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('signup-email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('signup-password-input'), 'Password1!');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'Password1!');
    fireEvent.press(getByTestId('signup-button'));

    await waitFor(() =>
      expect(mock.signUp.create).toHaveBeenCalledWith({
        emailAddress: 'user@example.com',
        password: 'Password1!',
      }),
    );
    await waitFor(() =>
      expect(mock.signUp.verifications.sendEmailCode).toHaveBeenCalled(),
    );
  });

  it('shows verification code input after successful sign-up creation', async () => {
    const { getByTestId, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('signup-email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('signup-password-input'), 'Password1!');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'Password1!');
    fireEvent.press(getByTestId('signup-button'));

    const codeInput = await findByTestId('verification-code-input');
    expect(codeInput).toBeTruthy();
  });

  it('calls verifyEmailCode and finalize on valid code', async () => {
    const mock = makeSignUpMock();
    mockedUseSignUp.mockReturnValue(mock);
    const { getByTestId, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('signup-email-input'), 'user@example.com');
    fireEvent.changeText(getByTestId('signup-password-input'), 'Password1!');
    fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'Password1!');
    fireEvent.press(getByTestId('signup-button'));

    const codeInput = await findByTestId('verification-code-input');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.press(getByTestId('verify-button'));

    await waitFor(() =>
      expect(mock.signUp.verifications.verifyEmailCode).toHaveBeenCalledWith({ code: '123456' }),
    );
    await waitFor(() => expect(mock.signUp.finalize).toHaveBeenCalled());
  });
});
