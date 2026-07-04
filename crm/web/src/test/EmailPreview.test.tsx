import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailPreview from '../components/EmailPreview';

const rendered = {
  to: 'anna@example.org',
  subject: 'Willkommen, Anna!',
  body: 'Hallo Anna, dein Start: 01.09.2026. {{unbekannt}}',
  mailtoUri: 'mailto:anna%40example.org?subject=Willkommen',
  unresolvedPlaceholders: ['unbekannt'],
};

vi.mock('../api/hooks', () => ({
  useRenderedEmail: () => ({ data: rendered, isLoading: false, error: null }),
}));

const writeText = vi.fn().mockResolvedValue(undefined);

describe('EmailPreview', () => {
  beforeEach(() => {
    writeText.mockClear();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it('zeigt Empfänger, Betreff und Text an', () => {
    render(<EmailPreview participantId="p1" />);

    expect(screen.getByText('anna@example.org')).toBeInTheDocument();
    expect(screen.getByText('Willkommen, Anna!')).toBeInTheDocument();
    expect(screen.getByText(/Hallo Anna, dein Start/)).toBeInTheDocument();
  });

  it('warnt vor nicht ersetzten Platzhaltern', () => {
    render(<EmailPreview participantId="p1" />);

    expect(screen.getByText(/Nicht ersetzte Platzhalter/)).toHaveTextContent('{{unbekannt}}');
  });

  it('kopiert Betreff und Text in die Zwischenablage', async () => {
    render(<EmailPreview participantId="p1" />);

    await userEvent.click(screen.getByRole('button', { name: 'In Zwischenablage kopieren' }));

    expect(writeText).toHaveBeenCalledWith(
      'Betreff: Willkommen, Anna!\n\nHallo Anna, dein Start: 01.09.2026. {{unbekannt}}',
    );
  });

  it('verlinkt das E-Mail-Programm über die Mailto-URI', () => {
    render(<EmailPreview participantId="p1" />);

    expect(screen.getByRole('link', { name: 'In E-Mail-Programm öffnen' })).toHaveAttribute(
      'href',
      rendered.mailtoUri,
    );
  });
});
