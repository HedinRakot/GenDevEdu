import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

// Code questions submit asynchronously and poll for the result.
jest.mock('@/api/courses', () => ({
  submitCode: jest.fn(),
  fetchCodeSubmission: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { QuestionCard } from '@/screens/LessonScreen';
import { QuestionType, CodeLanguage } from '@/types/course';
import type { Question, CodeSubmissionResult } from '@/types/course';
import { submitCode, fetchCodeSubmission } from '@/api/courses';

const mockedSubmit = submitCode as jest.Mock;
const mockedFetch = fetchCodeSubmission as jest.Mock;

function makeCodeQuestion(): Question {
  return {
    elementId: 'qc',
    name: 'QC',
    titel: { items: [{ text: 'Verdopple die Eingabe', language: 1 }] },
    questionType: QuestionType.Code,
    answers: [],
    answerValue: '',
    completed: false,
    code: {
      language: CodeLanguage.CSharp,
      starterCode: '// start',
      timeLimitMs: 5000,
      memoryLimitMb: 256,
      solutionCode: null,
      testCases: [{ id: 'tc1', hidden: false, input: '3', expectedOutput: '6' }],
    },
  };
}

function result(outcome: string, passedCount: number): CodeSubmissionResult {
  return {
    id: 'sub1',
    questionId: 'qc',
    status: 'Completed',
    outcome,
    passedCount,
    totalCount: 1,
    durationMs: 42,
    compileError: null,
    errorMessage: null,
    testResults: [
      {
        testCaseId: 'tc1',
        hidden: false,
        passed: outcome === 'Passed',
        outcome,
        durationMs: 10,
        input: '3',
        expectedOutput: '6',
        actualOutput: outcome === 'Passed' ? '6' : '7',
        stderr: null,
      },
    ],
  };
}

function renderCard(onAnsweredCorrectly = jest.fn()) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <QuestionCard question={makeCodeQuestion()} onAnsweredCorrectly={onAnsweredCorrectly} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { ...utils, onAnsweredCorrectly };
}

beforeEach(() => jest.clearAllMocks());

describe('QuestionCard – Code', () => {
  it('submits the code, polls, and calls onAnsweredCorrectly when all tests pass', async () => {
    mockedSubmit.mockResolvedValue({ id: 'sub1', status: 'Queued' });
    mockedFetch.mockResolvedValue(result('Passed', 1));
    const { getByText, onAnsweredCorrectly } = renderCard();

    fireEvent.press(getByText(/code testen|run code/i));

    await waitFor(() => expect(onAnsweredCorrectly).toHaveBeenCalledTimes(1));
    expect(mockedSubmit).toHaveBeenCalledWith('qc', '// start');
    expect(getByText(/alle tests bestanden|all tests passed/i)).toBeTruthy();
  });

  it('does NOT call onAnsweredCorrectly when tests fail', async () => {
    mockedSubmit.mockResolvedValue({ id: 'sub1', status: 'Queued' });
    mockedFetch.mockResolvedValue(result('Failed', 0));
    const { getByText, onAnsweredCorrectly } = renderCard();

    fireEvent.press(getByText(/code testen|run code/i));

    await waitFor(() => expect(getByText(/fehlgeschlagen|tests failed/i)).toBeTruthy());
    expect(onAnsweredCorrectly).not.toHaveBeenCalled();
  });
});
