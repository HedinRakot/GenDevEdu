import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PipelinePhase } from '../api/types';
import { useParticipants } from '../api/hooks';
import { ALL_PHASES, formatDate, PHASE_LABELS } from '../domain/phases';
import PhaseBadge from '../components/PhaseBadge';

export default function ParticipantListPage() {
  const [search, setSearch] = useState('');
  const [phase, setPhase] = useState<PipelinePhase | ''>('');
  const { data: participants, isLoading, error } = useParticipants({ phase, search });

  return (
    <div>
      <div className="page-head">
        <h1>Teilnehmer</h1>
        <div className="filters">
          <input
            type="search"
            placeholder="Suche (Name, Kundennummer) …"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Teilnehmer suchen"
          />
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as PipelinePhase | '')}
            aria-label="Nach Phase filtern"
          >
            <option value="">Alle Phasen</option>
            {ALL_PHASES.map((p) => (
              <option key={p} value={p}>
                {PHASE_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="muted">Lade Teilnehmer …</p>}
      {error && <p className="error">{(error as Error).message}</p>}

      {participants && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phase</th>
              <th>Kd-Nr.</th>
              <th>E-Mail</th>
              <th>Kursstart</th>
              <th>Geändert</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/teilnehmer/${p.id}`}>
                    {p.firstName} {p.lastName}
                  </Link>
                </td>
                <td>
                  <PhaseBadge phase={p.phase} />
                </td>
                <td>{p.kundennummer || '–'}</td>
                <td>{p.email || '–'}</td>
                <td>{formatDate(p.courseStart)}</td>
                <td>{formatDate(p.updatedAt)}</td>
              </tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Keine Teilnehmer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
