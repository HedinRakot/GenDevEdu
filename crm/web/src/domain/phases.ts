import type { PipelinePhase } from '../api/types';

/** Pipeline-Phasen in fachlicher Reihenfolge (Board-Spalten). */
export const PIPELINE_PHASES: PipelinePhase[] = [
  'erstgespraech',
  'eignungstest',
  'gutscheinBeantragt',
  'gutscheinGenehmigt',
  'ausbildungGestartet',
];

/** Terminalzustände (Board-Spalte „Beendet"). */
export const TERMINAL_PHASES: PipelinePhase[] = ['abgebrochen', 'abgelehnt'];

export const ALL_PHASES: PipelinePhase[] = [...PIPELINE_PHASES, ...TERMINAL_PHASES];

export const PHASE_LABELS: Record<PipelinePhase, string> = {
  erstgespraech: 'Erstgespräch',
  eignungstest: 'Eignungstest',
  gutscheinBeantragt: 'Gutschein beantragt',
  gutscheinGenehmigt: 'Gutschein genehmigt',
  ausbildungGestartet: 'Ausbildung gestartet',
  abgebrochen: 'Abgebrochen',
  abgelehnt: 'Abgelehnt',
};

export const PHASE_COLORS: Record<PipelinePhase, string> = {
  erstgespraech: '#6366f1',
  eignungstest: '#0ea5e9',
  gutscheinBeantragt: '#f59e0b',
  gutscheinGenehmigt: '#10b981',
  ausbildungGestartet: '#22c55e',
  abgebrochen: '#9ca3af',
  abgelehnt: '#ef4444',
};

export const KIND_LABELS: Record<string, string> = {
  note: 'Notiz',
  call: 'Anruf',
  email: 'E-Mail',
};

export function formatDate(iso?: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
