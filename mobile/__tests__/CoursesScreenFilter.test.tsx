import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

jest.mock('@/api/courses', () => ({
  fetchCourses: jest.fn(),
  fetchCourseTags: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { CoursesScreen } from '@/screens/CoursesScreen';
import type { Course } from '@/types/course';
import { fetchCourses, fetchCourseTags } from '@/api/courses';

const mockedFetch = fetchCourses as jest.Mock;
const mockedTags = fetchCourseTags as jest.Mock;

function course(name: string, level: string, tags: string[]): Course {
  return {
    elementId: name,
    name,
    titel: { items: [{ text: name, language: 1 }] },
    chapters: [],
    tags,
    level,
  } as unknown as Course;
}

const ALL = [course('C# Kurs', 'Beginner', ['csharp']), course('TS Kurs', 'Advanced', ['typescript'])];

function renderScreen() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <CoursesScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedTags.mockResolvedValue(['csharp', 'typescript']);
  // Server-seitige Filterung simulieren: nach level filtern.
  mockedFetch.mockImplementation((params?: { level?: string }) =>
    Promise.resolve(params?.level ? ALL.filter((c) => c.level === params.level) : ALL),
  );
});

describe('CoursesScreen – Filter', () => {
  it('narrows the list when a level chip is selected', async () => {
    const { getByText, getByTestId, queryByText, findByText } = renderScreen();

    // Anfangs beide Kurse sichtbar.
    expect(await findByText('C# Kurs')).toBeTruthy();
    expect(getByText('TS Kurs')).toBeTruthy();

    // Level „Advanced" wählen (testID, da das Label „Experte" auch im Kurs-Badge steht).
    fireEvent.press(getByTestId('level-Advanced'));

    // Param fließt server-seitig durch; gefiltertes Ergebnis abwarten, dann Abwesenheit prüfen.
    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith(expect.objectContaining({ level: 'Advanced' })),
    );
    expect(await findByText('TS Kurs')).toBeTruthy();
    expect(queryByText('C# Kurs')).toBeNull();
  });

  it('shows the no-results hint when the filter matches nothing', async () => {
    mockedFetch.mockResolvedValue([]);
    const { findByText } = renderScreen();
    await findByText(/keine kurse gefunden|no courses found/i);
  });
});
