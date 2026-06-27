import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

// Quiz grading is now server-side via submitAttempt(); mock it to control the verdict.
jest.mock('@/api/courses', () => ({
  submitAttempt: jest.fn(),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { QuestionCard } from '@/screens/LessonScreen';
import { QuestionType } from '@/types/course';
import type { Answer, Question } from '@/types/course';
import { submitAttempt } from '@/api/courses';

const mockedSubmit = submitAttempt as jest.Mock;

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    elementId: 'q1',
    name: 'Q1',
    titel: { items: [{ text: 'Was ist 2 + 2?', language: 1 }] },
    questionType: QuestionType.OneChoice,
    answers: [
      { id: 'a1', isCorrect: true, titel: { items: [{ text: '4', language: 1 }] }, comment: '' },
      { id: 'a2', isCorrect: false, titel: { items: [{ text: '5', language: 1 }] }, comment: '' },
    ],
    answerValue: '',
    completed: false,
    ...overrides,
  };
}

/** Build a server-style result; `answers` mirror the question's answers (revealed). */
function result(isCorrect: boolean, answers: Answer[]) {
  return { isCorrect, score: isCorrect ? 1 : 0, answers };
}

function renderCard(question: Question, onAnsweredCorrectly = jest.fn()) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <QuestionCard question={question} onAnsweredCorrectly={onAnsweredCorrectly} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('QuestionCard – OneChoice', () => {
  it('submits the selected answer and calls onAnsweredCorrectly when the server says correct', async () => {
    const q = makeQuestion();
    mockedSubmit.mockResolvedValue(result(true, q.answers));
    const onCorrect = jest.fn();
    const { getByText } = renderCard(q, onCorrect);

    fireEvent.press(getByText('4'));
    fireEvent.press(getByText(/prüfen|check/i));

    await waitFor(() => expect(onCorrect).toHaveBeenCalledTimes(1));
    expect(mockedSubmit).toHaveBeenCalledWith('q1', { answerId: 'a1' });
  });

  it('does NOT call onAnsweredCorrectly for a wrong answer and shows retry', async () => {
    const q = makeQuestion();
    mockedSubmit.mockResolvedValue(result(false, q.answers));
    const onCorrect = jest.fn();
    const { getByText } = renderCard(q, onCorrect);

    fireEvent.press(getByText('5'));
    fireEvent.press(getByText(/prüfen|check/i));

    await waitFor(() => expect(getByText(/erneut|retry/i)).toBeTruthy());
    expect(mockedSubmit).toHaveBeenCalledWith('q1', { answerId: 'a2' });
    expect(onCorrect).not.toHaveBeenCalled();
  });
});

describe('QuestionCard – MultipleChoice', () => {
  function makeMultiQuestion(): Question {
    return makeQuestion({
      elementId: 'q2',
      questionType: QuestionType.MultipleChoice,
      titel: { items: [{ text: 'Welche sind korrekt?', language: 1 }] },
      answers: [
        { id: 'a1', isCorrect: true, titel: { items: [{ text: 'Richtig A', language: 1 }] }, comment: '' },
        { id: 'a2', isCorrect: true, titel: { items: [{ text: 'Richtig B', language: 1 }] }, comment: '' },
        { id: 'a3', isCorrect: false, titel: { items: [{ text: 'Falsch C', language: 1 }] }, comment: '' },
      ],
    });
  }

  it('submits all selected ids and calls onAnsweredCorrectly when the server says correct', async () => {
    const q = makeMultiQuestion();
    mockedSubmit.mockResolvedValue(result(true, q.answers));
    const onCorrect = jest.fn();
    const { getByText } = renderCard(q, onCorrect);

    fireEvent.press(getByText('Richtig A'));
    fireEvent.press(getByText('Richtig B'));
    fireEvent.press(getByText(/prüfen|check/i));

    await waitFor(() => expect(onCorrect).toHaveBeenCalledTimes(1));
    expect(mockedSubmit).toHaveBeenCalledWith('q2', { answerIds: ['a1', 'a2'] });
  });

  it('does NOT call onAnsweredCorrectly when the server says incorrect', async () => {
    const q = makeMultiQuestion();
    mockedSubmit.mockResolvedValue(result(false, q.answers));
    const onCorrect = jest.fn();
    const { getByText } = renderCard(q, onCorrect);

    fireEvent.press(getByText('Richtig A'));
    fireEvent.press(getByText(/prüfen|check/i));

    await waitFor(() => expect(getByText(/erneut|retry/i)).toBeTruthy());
    expect(mockedSubmit).toHaveBeenCalledWith('q2', { answerIds: ['a1'] });
    expect(onCorrect).not.toHaveBeenCalled();
  });
});

describe('QuestionCard – TrueFalse', () => {
  function makeTrueFalseQuestion(): Question {
    return makeQuestion({
      elementId: 'q3',
      questionType: QuestionType.TrueFalse,
      titel: { items: [{ text: 'string ist ein Referenztyp.', language: 1 }] },
      answers: [
        { id: 'tf-true', isCorrect: true, titel: { items: [{ text: 'Wahr', language: 1 }] }, comment: '' },
        { id: 'tf-false', isCorrect: false, titel: { items: [{ text: 'Falsch', language: 1 }] }, comment: '' },
      ],
    });
  }

  it('renders the two true/false buttons with dedicated testIDs', () => {
    const { getByTestId } = renderCard(makeTrueFalseQuestion());
    expect(getByTestId('truefalse-true')).toBeTruthy();
    expect(getByTestId('truefalse-false')).toBeTruthy();
  });

  it('submits a single answerId (like OneChoice) and calls onAnsweredCorrectly when correct', async () => {
    const q = makeTrueFalseQuestion();
    mockedSubmit.mockResolvedValue(result(true, q.answers));
    const onCorrect = jest.fn();
    const { getByTestId, getByText } = renderCard(q, onCorrect);

    fireEvent.press(getByTestId('truefalse-true'));
    fireEvent.press(getByText(/prüfen|check/i));

    await waitFor(() => expect(onCorrect).toHaveBeenCalledTimes(1));
    expect(mockedSubmit).toHaveBeenCalledWith('q3', { answerId: 'tf-true' });
  });

  it('does NOT call onAnsweredCorrectly for the wrong choice and shows retry', async () => {
    const q = makeTrueFalseQuestion();
    mockedSubmit.mockResolvedValue(result(false, q.answers));
    const onCorrect = jest.fn();
    const { getByTestId, getByText } = renderCard(q, onCorrect);

    fireEvent.press(getByTestId('truefalse-false'));
    fireEvent.press(getByText(/prüfen|check/i));

    await waitFor(() => expect(getByText(/erneut|retry/i)).toBeTruthy());
    expect(mockedSubmit).toHaveBeenCalledWith('q3', { answerId: 'tf-false' });
    expect(onCorrect).not.toHaveBeenCalled();
  });
});
