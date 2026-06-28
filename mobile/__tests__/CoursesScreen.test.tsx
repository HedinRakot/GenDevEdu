import React from 'react';
import { render } from '@testing-library/react-native';

import '@/i18n';

jest.mock('@/hooks/useCourses', () => ({
  useCourses: jest.fn(),
  useCourseTags: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import { useCourses, useCourseTags } from '@/hooks/useCourses';
import { ThemeProvider } from '@/context/ThemeContext';
import { CoursesScreen } from '@/screens/CoursesScreen';
import type { Course } from '@/types/course';

const mockedUseCourses = useCourses as jest.Mock;
const mockedUseCourseTags = useCourseTags as jest.Mock;

function renderScreen() {
  return render(
    <ThemeProvider>
      <CoursesScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseCourseTags.mockReturnValue({ data: [], isLoading: false });
});

describe('CoursesScreen', () => {
  it('renders the search field + title while fetching', () => {
    mockedUseCourses.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: jest.fn() });
    const { getByText, getByPlaceholderText } = renderScreen();
    expect(getByText(/kurse|courses/i)).toBeTruthy();
    expect(getByPlaceholderText(/suchen|search/i)).toBeTruthy();
  });

  it('shows error text and retry button when fetch fails', () => {
    mockedUseCourses.mockReturnValue({ data: undefined, isLoading: false, error: new Error('network'), refetch: jest.fn() });
    const { getByText } = renderScreen();
    expect(getByText(/fehler|error/i)).toBeTruthy();
    expect(getByText(/erneut|retry/i)).toBeTruthy();
  });

  it('renders a course (name + level badge) when data is loaded', () => {
    const courses: Course[] = [
      {
        elementId: 'course-1',
        name: 'C# Kurs',
        titel: { items: [{ text: 'C# Kurs', language: 1 }] },
        chapters: [],
        tags: ['csharp'],
        level: 'Beginner',
      } as unknown as Course,
    ];
    mockedUseCourses.mockReturnValue({ data: courses, isLoading: false, error: null, refetch: jest.fn() });
    const { getByText } = renderScreen();
    expect(getByText('C# Kurs')).toBeTruthy();
    expect(getByText('#csharp')).toBeTruthy();
  });

  it('shows the empty hint when no courses match', () => {
    mockedUseCourses.mockReturnValue({ data: [], isLoading: false, error: null, refetch: jest.fn() });
    const { getByText } = renderScreen();
    expect(getByText(/keine kurse gefunden|no courses found/i)).toBeTruthy();
  });
});
