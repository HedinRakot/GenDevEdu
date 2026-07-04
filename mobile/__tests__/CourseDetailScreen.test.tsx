import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import '@/i18n';

const mockEnroll = jest.fn();
let mockChapterList: { data: any; isLoading: boolean; error: unknown };

jest.mock('@/hooks/useCourses', () => ({
  useChapterList: () => mockChapterList,
  useEnrollment: () => ({ mutate: mockEnroll }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { courseId: 'c1' } }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { CourseDetailScreen } from '@/screens/CourseDetailScreen';

function chapter(id: string, name: string, opts: Partial<any> = {}) {
  return {
    elementId: id,
    name,
    titel: { items: [{ text: name, language: 1 }] },
    sortOrder: 1,
    rank: 10,
    completed: false,
    hasQuiz: false,
    quizPassed: false,
    ...opts,
  };
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <CourseDetailScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockChapterList = {
    data: { courseName: 'C# Grundlagen', chapters: [chapter('ch1', 'Einführung')] },
    isLoading: false,
    error: null,
  };
});

describe('CourseDetailScreen', () => {
  it('auto-enrolls the learner on mount', () => {
    renderScreen();
    expect(mockEnroll).toHaveBeenCalledWith('c1');
  });

  it('renders the course name and its chapters', () => {
    const { getByText } = renderScreen();
    expect(getByText('C# Grundlagen')).toBeTruthy();
    expect(getByText('Einführung')).toBeTruthy();
  });

  it('navigates to the lesson when a chapter is pressed', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Einführung'));
    expect(mockNavigate).toHaveBeenCalledWith('Lesson', expect.objectContaining({ courseId: 'c1', chapterId: 'ch1' }));
  });

  it('shows a quiz entry and navigates to the chapter quiz', () => {
    mockChapterList.data.chapters = [chapter('ch1', 'Einführung', { hasQuiz: true })];
    const { getByText } = renderScreen();

    fireEvent.press(getByText(/quiz/i));
    expect(mockNavigate).toHaveBeenCalledWith('ChapterQuiz', expect.objectContaining({ chapterId: 'ch1' }));
  });

  it('renders an error state when loading fails', () => {
    mockChapterList = { data: undefined, isLoading: false, error: new Error('boom') };
    const { getByText } = renderScreen();
    expect(getByText(/fehler|error/i)).toBeTruthy();
  });
});
