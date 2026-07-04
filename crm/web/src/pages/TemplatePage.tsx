import { useEffect, useState } from 'react';
import { useUpdateTemplate, useWelcomeTemplate } from '../api/hooks';

export default function TemplatePage() {
  const { data: template, isLoading, error } = useWelcomeTemplate();
  const updateTemplate = useUpdateTemplate();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!template) return;
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  if (isLoading) return <p className="muted">Lade Vorlage …</p>;
  if (error) return <p className="error">{(error as Error).message}</p>;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateTemplate.mutate(
      { subject: subject.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  return (
    <div className="form-page">
      <h1>Willkommens-E-Mail-Vorlage</h1>
      <p className="muted">
        Verfügbare Platzhalter — werden pro Teilnehmer ersetzt (Vorschau auf der Detailseite):
      </p>
      <div className="placeholder-legend">
        {template?.availablePlaceholders.map((p) => (
          <code key={p} className="chip">{`{{${p}}}`}</code>
        ))}
      </div>

      <form onSubmit={save}>
        <label>
          Betreff
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label>
          Text
          <textarea rows={16} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>

        {updateTemplate.isError && <p className="error">{(updateTemplate.error as Error).message}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={updateTemplate.isPending}>
            {saved ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
