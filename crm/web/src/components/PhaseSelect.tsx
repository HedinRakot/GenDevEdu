import { useState } from 'react';
import type { PipelinePhase } from '../api/types';
import { useChangePhase } from '../api/hooks';
import { ALL_PHASES, PHASE_LABELS } from '../domain/phases';

interface Props {
  participantId: string;
  currentPhase: PipelinePhase;
}

/** Phasenwechsel mit optionaler Notiz (kleiner Bestätigungs-Dialog). */
export default function PhaseSelect({ participantId, currentPhase }: Props) {
  const [target, setTarget] = useState<PipelinePhase | ''>('');
  const [note, setNote] = useState('');
  const changePhase = useChangePhase();

  const reset = () => {
    setTarget('');
    setNote('');
  };

  const confirm = () => {
    if (!target) return;
    changePhase.mutate(
      { id: participantId, phase: target, note: note.trim() || undefined },
      { onSuccess: reset },
    );
  };

  return (
    <div className="phase-select">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value as PipelinePhase | '')}
        aria-label="Phase ändern"
      >
        <option value="">Phase ändern …</option>
        {ALL_PHASES.filter((p) => p !== currentPhase).map((p) => (
          <option key={p} value={p}>
            {PHASE_LABELS[p]}
          </option>
        ))}
      </select>
      {target && (
        <div className="phase-dialog">
          <p>
            Wechsel zu <strong>{PHASE_LABELS[target]}</strong>
          </p>
          <textarea
            rows={2}
            placeholder="Notiz (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="dialog-actions">
            <button className="btn btn-primary" onClick={confirm} disabled={changePhase.isPending}>
              Übernehmen
            </button>
            <button className="btn" onClick={reset}>
              Abbrechen
            </button>
          </div>
          {changePhase.isError && <p className="error">{(changePhase.error as Error).message}</p>}
        </div>
      )}
    </div>
  );
}
