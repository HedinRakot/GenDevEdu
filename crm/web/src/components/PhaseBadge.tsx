import type { PipelinePhase } from '../api/types';
import { PHASE_COLORS, PHASE_LABELS } from '../domain/phases';

export default function PhaseBadge({ phase }: { phase: PipelinePhase }) {
  return (
    <span className="phase-badge" style={{ backgroundColor: PHASE_COLORS[phase] }}>
      {PHASE_LABELS[phase]}
    </span>
  );
}
