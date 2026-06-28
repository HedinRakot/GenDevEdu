import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/i18n';

jest.mock('@/api/courses', () => ({ getCertificates: jest.fn() }));

import { ThemeProvider } from '@/context/ThemeContext';
import { CertificatesSection } from '@/screens/DashboardScreen';
import type { Certificate } from '@/types/learner';
import { getCertificates } from '@/api/courses';

const mockedCerts = getCertificates as jest.Mock;

function cert(overrides: Partial<Certificate> = {}): Certificate {
  return {
    id: 'cert1',
    courseId: 'c1',
    courseName: 'C# Grundlagen',
    learnerName: 'Ada Lovelace',
    verificationCode: 'ABC123DEF456',
    issuedAt: '2026-06-27T10:00:00Z',
    ...overrides,
  };
}

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <CertificatesSection />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe('CertificatesSection', () => {
  it('renders earned certificate badges', async () => {
    mockedCerts.mockResolvedValue([cert(), cert({ id: 'cert2', courseName: 'Algorithmen', verificationCode: 'XYZ789' })]);
    const { findByText, getByText } = renderSection();

    expect(await findByText('C# Grundlagen')).toBeTruthy();
    expect(getByText('Algorithmen')).toBeTruthy();
    expect(getByText(/ABC123DEF456/)).toBeTruthy();   // Verifikations-Code
  });

  it('shows an empty hint when there are no certificates', async () => {
    mockedCerts.mockResolvedValue([]);
    const { findByText } = renderSection();

    await findByText(/noch keine zertifikate|no certificates yet|сертификатов пока нет/i);
  });
});
