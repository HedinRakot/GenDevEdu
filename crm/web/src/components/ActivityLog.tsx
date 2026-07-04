import { useState } from 'react';
import type { ActivityKind } from '../api/types';
import { useActivities, useAddActivity, useDeleteActivity } from '../api/hooks';
import { formatDateTime, KIND_LABELS } from '../domain/phases';

export default function ActivityLog({ participantId }: { participantId: string }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<ActivityKind>('note');
  const { data: activities, isLoading } = useActivities(participantId);
  const addActivity = useAddActivity(participantId);
  const deleteActivity = useDeleteActivity(participantId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addActivity.mutate(
      { text: text.trim(), kind },
      {
        onSuccess: () => {
          setText('');
          setKind('note');
        },
      },
    );
  };

  return (
    <div className="activity-log">
      <form onSubmit={submit} className="activity-form">
        <textarea
          rows={2}
          placeholder="Neue Aktivität (z. B. Telefonnotiz) …"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="activity-form-row">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ActivityKind)}
            aria-label="Art der Aktivität"
          >
            <option value="note">Notiz</option>
            <option value="call">Anruf</option>
            <option value="email">E-Mail</option>
          </select>
          <button className="btn btn-primary" type="submit" disabled={addActivity.isPending || !text.trim()}>
            Hinzufügen
          </button>
        </div>
        {addActivity.isError && <p className="error">{(addActivity.error as Error).message}</p>}
      </form>

      {isLoading && <p className="muted">Lade Aktivitäten …</p>}
      <ul className="activity-list">
        {activities?.map((a) => (
          <li key={a.id} className="activity-entry">
            <div className="activity-meta">
              <span className="activity-kind">{KIND_LABELS[a.kind] ?? a.kind}</span>
              <span className="muted">{formatDateTime(a.createdAt)}</span>
              <button
                className="btn btn-ghost btn-small"
                onClick={() => deleteActivity.mutate(a.id)}
                aria-label="Aktivität löschen"
              >
                ✕
              </button>
            </div>
            <p>{a.text}</p>
          </li>
        ))}
        {activities?.length === 0 && <li className="muted">Noch keine Aktivitäten.</li>}
      </ul>
    </div>
  );
}
