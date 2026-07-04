import type { ParticipantListItem } from '../api/types';
import ParticipantCard from './ParticipantCard';

interface Props {
  title: string;
  color: string;
  participants: ParticipantListItem[];
}

export default function BoardColumn({ title, color, participants }: Props) {
  return (
    <section className="board-column">
      <header className="board-column-header" style={{ borderTopColor: color }}>
        <h2>{title}</h2>
        <span className="count">{participants.length}</span>
      </header>
      <div className="board-column-body">
        {participants.map((p) => (
          <ParticipantCard key={p.id} participant={p} />
        ))}
        {participants.length === 0 && <p className="muted empty">Keine Teilnehmer</p>}
      </div>
    </section>
  );
}
