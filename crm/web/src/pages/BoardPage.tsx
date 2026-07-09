import { useDashboard, useParticipants } from '../api/hooks';
import {
  PHASE_COLORS,
  PHASE_LABELS,
  PIPELINE_PHASES,
  TERMINAL_COLOR,
  TERMINAL_PHASES,
} from '../domain/phases';
import BoardColumn from '../components/BoardColumn';

export default function BoardPage() {
  const { data: participants, isLoading, error } = useParticipants();
  const { data: dashboard } = useDashboard();

  if (isLoading) return <p className="muted">Lade Teilnehmer …</p>;
  if (error) return <p className="error">{(error as Error).message}</p>;

  const all = participants ?? [];
  const finished = all.filter((p) => TERMINAL_PHASES.includes(p.phase));

  return (
    <div>
      {dashboard && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{dashboard.total}</span>
            <span className="stat-label">Teilnehmer gesamt</span>
          </div>
          {PIPELINE_PHASES.map((phase) => {
            const count = dashboard.phases.find((p) => p.phase === phase)?.count ?? 0;
            return (
              <div className="stat" key={phase}>
                <span className="stat-value" style={{ color: PHASE_COLORS[phase] }}>
                  {count}
                </span>
                <span className="stat-label">{PHASE_LABELS[phase]}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="board">
        {PIPELINE_PHASES.map((phase) => (
          <BoardColumn
            key={phase}
            title={PHASE_LABELS[phase]}
            color={PHASE_COLORS[phase]}
            participants={all.filter((p) => p.phase === phase)}
          />
        ))}
        <BoardColumn title="Beendet" color={TERMINAL_COLOR} participants={finished} />
      </div>
    </div>
  );
}
