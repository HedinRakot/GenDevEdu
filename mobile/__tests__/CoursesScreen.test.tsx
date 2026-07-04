import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

// Einheitliches Muster: an der API-Schicht mocken und über einen echten
// QueryClient gehen, damit der useCourses-Hook samt Query-Keys mitgetestet wird.
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
  mockedFetch.mockImplementation((params?: { level?: string }) =>
    Promise.resolve(params?.level ? ALL.filter((c) => c.level === params.level) : ALL),
  );
});

describe('CoursesScreen', () => {
  it('renders the search field + title', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    expect(getByText(/kurse|courses/i)).toBeTruthy();
    expect(getByPlaceholderText(/suchen|search/i)).toBeTruthy();
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
  });

  it('shows error text and retry button when fetch fails', async () => {
    mockedFetch.mockRejectedValue(new Error('network'));
    const { findByText, getByText } = renderScreen();
    expect(await findByText(/fehler|error/i)).toBeTruthy();
    expect(getByText(/erneut|retry/i)).toBeTruthy();
  });

  it('renders a course (name + tag) when data is loaded', async () => {
    const { findByText, findAllByText } = renderScreen();
    expect(await findByText('C# Kurs')).toBeTruthy();
    // "#csharp" erscheint sowohl als Filter-Chip als auch auf der Kurskarte.
    expect((await findAllByText('#csharp')).length).toBeGreaterThan(0);
  });

  it('shows the empty hint when no courses match', async () => {
    mockedFetch.mockResolvedValue([]);
    const { findByText } = renderScreen();
    expect(await findByText(/keine kurse gefunden|no courses found/i)).toBeTruthy();
  });

  it('narrows the list when a level chip is selected', async () => {
    const { getByText, getByTestId, queryByText, findByText } = renderScreen();

    expect(await findByText('C# Kurs')).toBeTruthy();
    expect(getByText('TS Kurs')).toBeTruthy();

    // Level „Advanced" wählen (testID, da das Label auch im Kurs-Badge steht).
    fireEvent.press(getByTestId('level-Advanced'));

    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith(expect.objectContaining({ level: 'Advanced' })),
    );
    expect(await findByText('TS Kurs')).toBeTruthy();
    expect(queryByText('C# Kurs')).toBeNull();
  });
});
