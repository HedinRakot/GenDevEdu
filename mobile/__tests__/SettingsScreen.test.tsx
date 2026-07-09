import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import '@/i18n';

const mockLogout = jest.fn();
let mockUser: { name?: string; email?: string; role?: string } | null;

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

jest.mock('@/store/storage', () => ({
  ...jest.requireActual('@/store/storage'),
  saveLanguage: jest.fn(),
}));

jest.mock('@/services/notifications', () => ({
  isStreakReminderEnabled: jest.fn().mockResolvedValue(false),
  scheduleDailyStreakReminder: jest.fn().mockResolvedValue('id'),
  cancelStreakReminder: jest.fn().mockResolvedValue(undefined),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Verwaltung ist web-only; per Mock steuerbar (Jest simuliert sonst iOS).
let mockIsManagementPlatform = true;
jest.mock('@/utils/platform', () => ({
  get isManagementPlatform() {
    return mockIsManagementPlatform;
  },
}));

import i18n from '@/i18n';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { saveLanguage } from '@/store/storage';

function renderScreen() {
  return render(
    <ThemeProvider>
      <SettingsScreen />
    </ThemeProvider>,
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  // i18n ist ein globaler Singleton — vor jedem Test auf Deutsch zurücksetzen,
  // damit der Sprachwechsel-Test andere Tests nicht beeinflusst.
  await i18n.changeLanguage('de');
  mockUser = { name: 'Ada Lovelace', email: 'ada@devedu.test', role: 'learner' };
  mockIsManagementPlatform = true;
});

describe('SettingsScreen', () => {
  it('renders the profile of the signed-in user', () => {
    const { getByText } = renderScreen();
    expect(getByText('Ada Lovelace')).toBeTruthy();
    expect(getByText('ada@devedu.test')).toBeTruthy();
  });

  it('persists the language when a language row is pressed', async () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('English'));
    await waitFor(() => expect(saveLanguage).toHaveBeenCalledWith('en'));
  });

  it('asks for confirmation before logging out', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderScreen();

    fireEvent.press(getByText(/abmelden|log ?out|logout/i));
    expect(alertSpy).toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((b) => b.onPress)?.onPress?.();
    expect(mockLogout).toHaveBeenCalled();
  });

  it('hides the management section for plain learners', () => {
    const { queryByText } = renderScreen();
    expect(queryByText('Autorenbereich')).toBeNull();
  });

  it('shows the author entry for instructors (web)', () => {
    mockUser = { name: 'Tom', email: 'tom@devedu.test', role: 'instructor' };
    const { getByText } = renderScreen();
    expect(getByText('Autorenbereich')).toBeTruthy();
  });

  it('shows a web-only hint instead of management entries on native', () => {
    mockUser = { name: 'Tom', email: 'tom@devedu.test', role: 'instructor' };
    mockIsManagementPlatform = false;
    const { getByText, queryByText } = renderScreen();
    expect(queryByText('Autorenbereich')).toBeNull();
    expect(getByText('Nur im Web verfügbar')).toBeTruthy();
  });
});
