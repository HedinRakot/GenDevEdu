import type { StatusHistoryEntry } from '../api/types';
import { formatDateTime } from '../domain/phases';
import PhaseBadge from './PhaseBadge';

export default function HistoryTimeline({ history }: { history: StatusHistoryEntry[] }) {
  const newestFirst = [...history].reverse();
  return (
    <ol className="timeline">
      {newestFirst.map((entry, i) => (
        <li key={`${entry.changedAt}-${i}`} className="timeline-entry">
          <PhaseBadge phase={entry.phase} />
          <span className="muted">{formatDateTime(entry.changedAt)}</span>
          {entry.note && <span className="timeline-note">{entry.note}</span>}
        </li>
      ))}
    </ol>
  );
}
