import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

jest.mock('@/api/courses', () => ({ getStats: jest.fn() }));

import { ThemeProvider } from '@/context/ThemeContext';
import { StatsSection } from '@/screens/DashboardScreen';
import type { LearnerStats } from '@/types/learner';
import { getStats } from '@/api/courses';

const mockedStats = getStats as jest.Mock;

function stats(overrides: Partial<LearnerStats> = {}): LearnerStats {
  return {
    activeCourses: 1,
    completedCourses: 2,
    overallProgressPercent: 50,
    correctAnswered: 6,
    totalAnswered: 10,
    quizAccuracyPercent: 60,
    chapterQuizzesPassed: 1,
    chapterQuizzesTaken: 2,
    codeTasksSolved: 1,
    codeTasksAttempted: 3,
    courses: [
      {
        courseId: 'c1',
        courseName: 'C# Grundlagen',
        progressPercent: 50,
        completedContent: 1,
        totalContent: 2,
        chaptersPassed: 0,
        totalChapters: 1,
        completed: false,
      },
    ],
    ...overrides,
  };
}

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <StatsSection />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('StatsSection', () => {
  it('renders the metric tiles and per-course progress', async () => {
    mockedStats.mockResolvedValue(stats());
    const { getByText, findByText } = renderSection();

    expect(await findByText('60%')).toBeTruthy();        // Quiz-Trefferquote
    expect(getByText('1/2')).toBeTruthy();               // Kapitel-Quizze passed/taken
    expect(getByText('1/3')).toBeTruthy();               // Code solved/attempted
    expect(getByText('C# Grundlagen')).toBeTruthy();     // Kurs-Fortschritt
  });

  it('marks a completed course as done', async () => {
    mockedStats.mockResolvedValue(
      stats({
        courses: [
          {
            courseId: 'c1',
            courseName: 'Algorithmen',
            progressPercent: 100,
            completedContent: 2,
            totalContent: 2,
            chaptersPassed: 1,
            totalChapters: 1,
            completed: true,
          },
        ],
      }),
    );
    const { findByText, getByText } = renderSection();

    await findByText('Algorithmen');
    // Status-Badge des abgeschlossenen Kurses (Kursname kollidiert nun nicht mit dem Regex).
    expect(getByText(/fertig|done|готово/i)).toBeTruthy();
  });

  it('shows an empty hint when there are no courses', async () => {
    mockedStats.mockResolvedValue(stats({ courses: [] }));
    const { findByText } = renderSection();

    await findByText(/noch keine aktivität|no activity yet|пока нет активности/i);
  });
});
