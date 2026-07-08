import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

// Einheitliches Muster: an der API-Schicht mocken und über einen echten
// QueryClient gehen, damit der useCourses-Hook samt Query-Keys mitgetestet wird.
jest.mock('@/api/courses', () => ({
  fetchCourses: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { CoursesScreen } from '@/screens/CoursesScreen';
import type { Course } from '@/types/course';
import { fetchCourses } from '@/api/courses';

const mockedFetch = fetchCourses as jest.Mock;

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

const ALL = [
  course('.NET Grundlagen', 'Beginner', ['csharp']),
  course('.NET Aufbau', 'Advanced', ['csharp']),
];

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
  mockedFetch.mockResolvedValue(ALL);
});

describe('CoursesScreen', () => {
  it('renders the title and loads the course list', async () => {
    const { getByText } = renderScreen();
    expect(getByText(/kurse|courses/i)).toBeTruthy();
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
  });

  it('fetches without any filter argument (search/filter removed)', async () => {
    renderScreen();
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
    // Der Screen ruft die Kursliste ohne Filter-Objekt ab.
    expect(mockedFetch).toHaveBeenCalledWith(undefined);
  });

  it('shows error text and retry button when fetch fails', async () => {
    mockedFetch.mockRejectedValue(new Error('network'));
    const { findByText, getByText } = renderScreen();
    expect(await findByText(/fehler|error/i)).toBeTruthy();
    expect(getByText(/erneut|retry/i)).toBeTruthy();
  });

  it('renders both courses (name + tag) when data is loaded', async () => {
    const { findByText, findAllByText } = renderScreen();
    expect(await findByText('.NET Grundlagen')).toBeTruthy();
    expect(await findByText('.NET Aufbau')).toBeTruthy();
    // "#csharp" erscheint nur noch auf den Kurskarten (kein Filter-Chip mehr).
    expect((await findAllByText('#csharp')).length).toBe(2);
  });

  it('shows the empty hint when no courses are returned', async () => {
    mockedFetch.mockResolvedValue([]);
    const { findByText } = renderScreen();
    expect(await findByText(/keine kurse gefunden|no courses found/i)).toBeTruthy();
  });
});
