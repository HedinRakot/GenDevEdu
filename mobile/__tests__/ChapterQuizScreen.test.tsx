import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

jest.mock('@/api/courses', () => ({
  getChapterQuiz: jest.fn(),
  submitChapterQuiz: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { courseId: 'c1', chapterId: 'ch1', chapterName: 'Kapitel 1' } }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { ChapterQuizScreen } from '@/screens/ChapterQuizScreen';
import { QuestionType } from '@/types/course';
import type { ChapterQuizView, ChapterQuizResult, Question } from '@/types/course';
import { getChapterQuiz, submitChapterQuiz } from '@/api/courses';

const mockedGet = getChapterQuiz as jest.Mock;
const mockedSubmit = submitChapterQuiz as jest.Mock;

function q(id: string, correctId: string): Question {
  return {
    elementId: id,
    name: id,
    titel: { items: [{ text: `Frage ${id}`, language: 1 }] },
    questionType: QuestionType.OneChoice,
    answers: [
      { id: `${id}a`, isCorrect: correctId === 'a', titel: { items: [{ text: 'A', language: 1 }] }, comment: '' },
      { id: `${id}b`, isCorrect: correctId === 'b', titel: { items: [{ text: 'B', language: 1 }] }, comment: '' },
    ],
    answerValue: '',
    completed: false,
  };
}

function view(overrides: Partial<ChapterQuizView> = {}): ChapterQuizView {
  return {
    chapterId: 'ch1',
    passThresholdPercent: 60,
    maxAttempts: 3,
    questions: [q('q1', 'a')],
    attemptsUsed: 0,
    bestPercent: null,
    passed: false,
    attemptsExhausted: false,
    ...overrides,
  };
}

function result(passed: boolean): ChapterQuizResult {
  return {
    correctCount: passed ? 1 : 0,
    totalCount: 1,
    percent: passed ? 100 : 0,
    passed,
    attemptNo: 1,
    maxAttempts: 3,
    attemptsRemaining: passed ? 2 : 2,
    questions: [q('q1', 'a')],
  };
}

function renderScreen() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <ChapterQuizScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('ChapterQuizScreen', () => {
  it('submits selected answers and shows a passed result', async () => {
    mockedGet.mockResolvedValue(view());
    mockedSubmit.mockResolvedValue(result(true));
    const { getByText, findByText } = renderScreen();

    fireEvent.press(await findByText('A'));
    fireEvent.press(getByText(/quiz abgeben|submit quiz/i));

    await waitFor(() => expect(getByText(/bestanden|passed/i)).toBeTruthy());
    expect(mockedSubmit).toHaveBeenCalledWith('ch1', { answers: [{ questionId: 'q1', answerId: 'q1a' }] });
  });

  it('shows failure + a retry option when not passed and attempts remain', async () => {
    mockedGet.mockResolvedValue(view());
    mockedSubmit.mockResolvedValue(result(false));
    const { getByText, findByText } = renderScreen();

    fireEvent.press(await findByText('B'));
    fireEvent.press(getByText(/quiz abgeben|submit quiz/i));

    await waitFor(() => expect(getByText(/nicht bestanden|not passed/i)).toBeTruthy());
    expect(getByText(/erneut versuchen|try again/i)).toBeTruthy();
  });

  it('locks the quiz when attempts are exhausted', async () => {
    mockedGet.mockResolvedValue(view({ attemptsUsed: 3, attemptsExhausted: true }));
    const { findByText, queryByText } = renderScreen();

    await findByText(/keine versuche mehr|no attempts left/i);
    expect(queryByText(/quiz abgeben|submit quiz/i)).toBeNull();
  });
});
