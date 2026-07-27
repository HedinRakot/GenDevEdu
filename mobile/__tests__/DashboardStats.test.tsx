import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

jest.mock('@/api/courses', () => ({ getStats: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import { ThemeProvider } from '@/context/ThemeContext';
import { StatsSection, ContinueLearningSection } from '@/screens/DashboardScreen';
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
        totalChapters: 4,
        completed: false,
      },
    ],
    ...overrides,
  };
}

function renderSection(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>{node}</ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('StatsSection', () => {
  it('renders the summary metrics', async () => {
    mockedStats.mockResolvedValue(stats());
    const { findByText, getByText } = renderSection(<StatsSection />);

    expect(await findByText('60%')).toBeTruthy(); // Quiz-Trefferquote
    expect(getByText('50%')).toBeTruthy(); // Gesamtfortschritt
    expect(getByText('1')).toBeTruthy(); // Laufende Kurse
    expect(getByText('2')).toBeTruthy(); // Abgeschlossen
  });
});

describe('ContinueLearningSection', () => {
  it('lists in-progress courses with their progress', async () => {
    mockedStats.mockResolvedValue(stats());
    const { findByText, getByText } = renderSection(<ContinueLearningSection />);

    expect(await findByText('C# Grundlagen')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
  });

  it('hides completed courses and shows an empty hint', async () => {
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
    const { findByText } = renderSection(<ContinueLearningSection />);

    await findByText(/hier weiterzumachen|continue here|продолжить здесь/i);
  });
});
