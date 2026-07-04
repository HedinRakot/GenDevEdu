import { describe, expect, it } from 'vitest';
import {
  ALL_PHASES,
  PHASE_COLORS,
  PHASE_LABELS,
  PIPELINE_PHASES,
  TERMINAL_PHASES,
} from '../domain/phases';

describe('phases', () => {
  it('enthält 7 eindeutige Phasen (5 Pipeline + 2 terminal)', () => {
    expect(PIPELINE_PHASES).toHaveLength(5);
    expect(TERMINAL_PHASES).toHaveLength(2);
    expect(new Set(ALL_PHASES).size).toBe(7);
  });

  it('beginnt mit Erstgespräch und endet mit Ausbildung gestartet', () => {
    expect(PIPELINE_PHASES[0]).toBe('erstgespraech');
    expect(PIPELINE_PHASES[PIPELINE_PHASES.length - 1]).toBe('ausbildungGestartet');
  });

  it('hat für jede Phase ein deutsches Label und eine Farbe', () => {
    for (const phase of ALL_PHASES) {
      expect(PHASE_LABELS[phase]).toBeTruthy();
      expect(PHASE_COLORS[phase]).toMatch(/^#/);
    }
  });
});
