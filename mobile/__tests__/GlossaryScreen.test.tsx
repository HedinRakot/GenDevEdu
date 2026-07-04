import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { GlossaryScreen } from '@/screens/GlossaryScreen';
import { GLOSSARY } from '@/data/glossary';

function renderScreen() {
  return render(
    <ThemeProvider>
      <GlossaryScreen />
    </ThemeProvider>,
  );
}

describe('GlossaryScreen', () => {
  it('renders the first glossary term initially', () => {
    const { getByText } = renderScreen();
    // Mindestens ein echter Glossar-Begriff wird gerendert.
    expect(getByText(GLOSSARY[0].term)).toBeTruthy();
  });

  it('shows the no-results hint when the search matches nothing', () => {
    const { getByPlaceholderText, getByText, queryByText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText(/begriff|schlüsselwort|search/i), 'zzz-kein-treffer-xyz');

    expect(getByText(/keine ergebnisse|no results/i)).toBeTruthy();
    expect(queryByText(GLOSSARY[0].term)).toBeNull();
  });
});
