import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@clerk/expo', () => ({
  useSignIn: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
}));

import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { useSignIn } from '@clerk/expo';

const mockedUseSignIn = useSignIn as jest.Mock;

// Future API shape: useSignIn() -> { signIn, errors, fetchStatus }.
// Reset flow: create() -> resetPasswordEmailCode.sendCode() -> verifyCode() ->
// submitPassword() -> finalize(). Each method returns { error }.
function makeSignInMock(signInOverrides: Record<string, unknown> = {}) {
  return {
    signIn: {
      status: 'complete',
      create: jest.fn().mockResolvedValue({ error: null }),
      resetPasswordEmailCode: {
        sendCode: jest.fn().mockResolvedValue({ error: null }),
        verifyCode: jest.fn().mockResolvedValue({ error: null }),
        submitPassword: jest.fn().mockResolvedValue({ error: null }),
      },
      finalize: jest.fn().mockResolvedValue({ error: null }),
      ...signInOverrides,
    },
    errors: null,
    fetchStatus: 'idle',
  };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <ForgotPasswordScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseSignIn.mockReturnValue(makeSignInMock());
});

describe('ForgotPasswordScreen', () => {
  it('renders the email step even when the signIn resource is not yet available', () => {
    mockedUseSignIn.mockReturnValue({ signIn: null, errors: null, fetchStatus: 'idle' });
    const { getByTestId } = renderScreen();
    expect(getByTestId('send-reset-code-button')).toBeTruthy();
  });

  it('calls create and resetPasswordEmailCode.sendCode on valid email submission', async () => {
    const mock = makeSignInMock();
    mockedUseSignIn.mockReturnValue(mock);
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('send-reset-code-button'));

    await waitFor(() =>
      expect(mock.signIn.create).toHaveBeenCalledWith({ identifier: 'user@example.com' }),
    );
    await waitFor(() =>
      expect(mock.signIn.resetPasswordEmailCode.sendCode).toHaveBeenCalled(),
    );
  });

  it('shows the code + new-password step after the code is sent', async () => {
    const { getByTestId, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('send-reset-code-button'));

    expect(await findByTestId('reset-code-input')).toBeTruthy();
    expect(getByTestId('reset-new-password-input')).toBeTruthy();
  });

  it('shows an inline error when the new passwords differ', async () => {
    const { getByTestId, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('send-reset-code-button'));

    const codeInput = await findByTestId('reset-code-input');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.changeText(getByTestId('reset-new-password-input'), 'newPass1!');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'different');
    fireEvent.press(getByTestId('reset-password-button'));

    const banner = await findByTestId('forgot-password-error');
    expect(banner.props.children).toMatch(/Passwörter|Passwords|Пароли/);
  });

  it('verifies the code, submits the new password and finalizes the session', async () => {
    const mock = makeSignInMock();
    mockedUseSignIn.mockReturnValue(mock);
    const { getByTestId, findByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('send-reset-code-button'));

    const codeInput = await findByTestId('reset-code-input');
    fireEvent.changeText(codeInput, '123456');
    fireEvent.changeText(getByTestId('reset-new-password-input'), 'newPass1!');
    fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'newPass1!');
    fireEvent.press(getByTestId('reset-password-button'));

    await waitFor(() =>
      expect(mock.signIn.resetPasswordEmailCode.verifyCode).toHaveBeenCalledWith({ code: '123456' }),
    );
    await waitFor(() =>
      expect(mock.signIn.resetPasswordEmailCode.submitPassword).toHaveBeenCalledWith({
        password: 'newPass1!',
      }),
    );
    await waitFor(() => expect(mock.signIn.finalize).toHaveBeenCalled());
  });

  it('navigates back to login when the back link is pressed', async () => {
    const goBackSpy = jest.fn();
    const { useNavigation } = require('@react-navigation/native');
    (useNavigation as jest.Mock).mockReturnValue({ navigate: jest.fn(), goBack: goBackSpy });

    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('back-to-login-link'));
    expect(goBackSpy).toHaveBeenCalled();
  });
});
