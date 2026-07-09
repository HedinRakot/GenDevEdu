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

/**
 * Semantische Pipeline-Stufen-Farben (Board). Auf die „Akademie"-Palette abgestimmt,
 * aber bewusst gegenseitig unterscheidbar gehalten (NICHT in die Marken-Rampe gefaltet –
 * ein einfarbiges Board wäre unlesbar). Gespiegelt aus design/tokens.json (phaseColors.light).
 */
export const PHASE_COLORS: Record<PipelinePhase, string> = {
  erstgespraech: '#6d5ac6',
  eignungstest: '#3b82b8',
  gutscheinBeantragt: '#c08a2e',
  gutscheinGenehmigt: '#4e9c6b',
  ausbildungGestartet: '#3f8f53',
  abgebrochen: '#83718e',
  abgelehnt: '#c0453c',
};

/** Farbe der Sammel-Spalte „Beendet" (Terminalzustände). */
export const TERMINAL_COLOR = '#83718e';

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
