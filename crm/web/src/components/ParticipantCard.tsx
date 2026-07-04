import { Link } from 'react-router-dom';
import type { ParticipantListItem } from '../api/types';
import { formatDate } from '../domain/phases';
import PhaseSelect from './PhaseSelect';

export default function ParticipantCard({ participant }: { participant: ParticipantListItem }) {
  return (
    <article className="card participant-card">
      <Link to={`/teilnehmer/${participant.id}`} className="card-title">
        {participant.firstName} {participant.lastName}
      </Link>
      {participant.kundennummer && <div className="muted">Kd-Nr. {participant.kundennummer}</div>}
      {participant.courseStart && (
        <div className="muted">Kursstart: {formatDate(participant.courseStart)}</div>
      )}
      <PhaseSelect participantId={participant.id} currentPhase={participant.phase} />
    </article>
  );
}
