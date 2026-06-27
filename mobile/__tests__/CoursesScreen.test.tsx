import React from 'react';
import { render } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@/hooks/useCourses', () => ({
  useCourses: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import { useCourses } from '@/hooks/useCourses';
import { ThemeProvider } from '@/context/ThemeContext';
import { CoursesScreen } from '@/screens/CoursesScreen';
import type { Course } from '@/types/course';

const mockedUseCourses = useCourses as jest.Mock;

function renderScreen() {
  return render(
    <ThemeProvider>
      <CoursesScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CoursesScreen', () => {
  it('shows loading indicator while fetching', () => {
    mockedUseCourses.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    const { getByText } = renderScreen();
    expect(getByText(/laden|loading/i)).toBeTruthy();
  });

  it('shows error text and retry button when fetch fails', () => {
    mockedUseCourses.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network'),
      refetch: jest.fn(),
    });
    const { getByText } = renderScreen();
    expect(getByText(/fehler|error/i)).toBeTruthy();
    expect(getByText(/erneut|retry/i)).toBeTruthy();
  });

  it('renders course name when data is loaded', () => {
    const courses: Course[] = [
      {
        elementId: 'course-1',
        name: 'C# Kurs',
        titel: { items: [{ text: 'C# Kurs', language: 1 }] },
        status: 'published',
        chapters: [],
      } as unknown as Course,
    ];
    mockedUseCourses.mockReturnValue({
      data: courses,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    const { getByText } = renderScreen();
    expect(getByText('C# Kurs')).toBeTruthy();
  });
});
