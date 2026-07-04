import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import '@/i18n';

const mockRemove = jest.fn();
let mockState: { snippets: any[]; isLoading: boolean };

jest.mock('@/hooks/useSnippets', () => ({
  useSnippets: () => ({ ...mockState, remove: mockRemove }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { SnippetsScreen } from '@/screens/SnippetsScreen';

function snippet(id: string, title: string) {
  return { id, title, content: 'console.log(1)', source: 'manual', tags: ['demo'] };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <SnippetsScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockState = { snippets: [], isLoading: false };
});

describe('SnippetsScreen', () => {
  it('shows the empty hint when there are no snippets', () => {
    const { getByText } = renderScreen();
    expect(getByText(/keine|noch keine|no snippets|empty/i)).toBeTruthy();
  });

  it('renders snippet titles and filters by search', () => {
    mockState = { snippets: [snippet('s1', 'Alpha Snippet'), snippet('s2', 'Beta Snippet')], isLoading: false };
    const { getByText, queryByText, getByPlaceholderText } = renderScreen();

    expect(getByText('Alpha Snippet')).toBeTruthy();
    expect(getByText('Beta Snippet')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText(/suchen|search/i), 'alpha');
    expect(getByText('Alpha Snippet')).toBeTruthy();
    expect(queryByText('Beta Snippet')).toBeNull();
  });

  it('confirms deletion and calls remove', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockState = { snippets: [snippet('s1', 'Alpha Snippet')], isLoading: false };
    const { getByText } = renderScreen();

    fireEvent.press(getByText('🗑️'));

    expect(alertSpy).toHaveBeenCalled();
    // Den "Löschen"-Button des Bestätigungsdialogs auslösen.
    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    const destructive = buttons.find((b) => b.onPress);
    destructive?.onPress?.();
    expect(mockRemove).toHaveBeenCalledWith('s1');
  });
});
