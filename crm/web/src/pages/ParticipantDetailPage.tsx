import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteParticipant, useParticipant } from '../api/hooks';
import { formatDate } from '../domain/phases';
import PhaseBadge from '../components/PhaseBadge';
import PhaseSelect from '../components/PhaseSelect';
import HistoryTimeline from '../components/HistoryTimeline';
import ActivityLog from '../components/ActivityLog';
import EmailPreview from '../components/EmailPreview';

export default function ParticipantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: participant, isLoading, error } = useParticipant(id);
  const deleteParticipant = useDeleteParticipant();

  if (isLoading) return <p className="muted">Lade Teilnehmer …</p>;
  if (error) return <p className="error">{(error as Error).message}</p>;
  if (!participant || !id) return null;

  const remove = () => {
    if (!window.confirm(`${participant.firstName} ${participant.lastName} wirklich löschen?`)) return;
    deleteParticipant.mutate(id, { onSuccess: () => navigate('/') });
  };

  return (
    <div>
      <div className="page-head">
        <h1>
          {participant.firstName} {participant.lastName} <PhaseBadge phase={participant.phase} />
        </h1>
        <div className="page-actions">
          <Link className="btn" to={`/teilnehmer/${id}/bearbeiten`}>
            Bearbeiten
          </Link>
          <button className="btn btn-danger" onClick={remove} disabled={deleteParticipant.isPending}>
            Löschen
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card">
          <h2>Stammdaten</h2>
          <dl className="detail-list">
            <dt>E-Mail</dt>
            <dd>{participant.email || '–'}</dd>
            <dt>Telefon</dt>
            <dd>{participant.phone || '–'}</dd>
            <dt>Geburtsdatum</dt>
            <dd>{formatDate(participant.birthDate)}</dd>
            <dt>Adresse</dt>
            <dd>
              {[participant.street, `${participant.postalCode} ${participant.city}`.trim()]
                .filter(Boolean)
                .join(', ') || '–'}
            </dd>
            <dt>Geplanter Kursstart</dt>
            <dd>{formatDate(participant.courseStart)}</dd>
            <dt>Notizen</dt>
            <dd className="preline">{participant.notes || '–'}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Agentur für Arbeit</h2>
          <dl className="detail-list">
            <dt>Kundennummer</dt>
            <dd>{participant.agentur.kundennummer || '–'}</dd>
            <dt>Vermittler/in</dt>
            <dd>{participant.agentur.vermittlerName || '–'}</dd>
            <dt>E-Mail</dt>
            <dd>{participant.agentur.vermittlerEmail || '–'}</dd>
            <dt>Telefon</dt>
            <dd>{participant.agentur.vermittlerPhone || '–'}</dd>
            <dt>Dienststelle</dt>
            <dd>{participant.agentur.dienststelle || '–'}</dd>
          </dl>
          <h2>Bildungsgutschein</h2>
          <dl className="detail-list">
            <dt>Nummer</dt>
            <dd>{participant.gutschein.nummer || '–'}</dd>
            <dt>Gültig bis</dt>
            <dd>{formatDate(participant.gutschein.gueltigBis)}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Phase</h2>
          <PhaseSelect participantId={id} currentPhase={participant.phase} />
          <h2>Verlauf</h2>
          <HistoryTimeline history={participant.statusHistory} />
        </section>

        <section className="card">
          <h2>Aktivitäten</h2>
          <ActivityLog participantId={id} />
        </section>

        <section className="card card-wide">
          <h2>Willkommens-E-Mail</h2>
          <EmailPreview participantId={id} />
        </section>
      </div>
    </div>
  );
}
