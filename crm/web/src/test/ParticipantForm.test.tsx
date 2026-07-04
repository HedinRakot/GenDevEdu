import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ParticipantFormPage from '../pages/ParticipantFormPage';

const createMutate = vi.fn();

vi.mock('../api/hooks', () => ({
  useParticipant: () => ({ data: undefined, isLoading: false }),
  useCreateParticipant: () => ({
    mutate: createMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateParticipant: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

function renderNewForm() {
  return render(
    <MemoryRouter initialEntries={['/teilnehmer/neu']}>
      <Routes>
        <Route path="/teilnehmer/neu" element={<ParticipantFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ParticipantFormPage', () => {
  beforeEach(() => createMutate.mockClear());

  it('zeigt Validierungsfehler ohne Namen und ruft die Mutation nicht auf', async () => {
    renderNewForm();

    await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));

    expect(screen.getByText('Vorname und Nachname sind erforderlich.')).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('sendet den Payload mit Stammdaten und Agentur-Info', async () => {
    renderNewForm();

    await userEvent.type(screen.getByLabelText('Vorname *'), 'Anna');
    await userEvent.type(screen.getByLabelText('Nachname *'), 'Schmidt');
    await userEvent.type(screen.getByLabelText('Kundennummer'), 'K-42');
    await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));

    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Anna',
        lastName: 'Schmidt',
        agentur: expect.objectContaining({ kundennummer: 'K-42' }),
      }),
      expect.anything(),
    );
  });
});
