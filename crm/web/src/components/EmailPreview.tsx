import { useState } from 'react';
import { useRenderedEmail } from '../api/hooks';

export default function EmailPreview({ participantId }: { participantId: string }) {
  const { data: email, isLoading, error } = useRenderedEmail(participantId);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <p className="muted">Lade E-Mail-Vorschau …</p>;
  if (error) return <p className="error">{(error as Error).message}</p>;
  if (!email) return null;

  const copy = () => {
    void navigator.clipboard
      .writeText(`Betreff: ${email.subject}\n\n${email.body}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="email-preview">
      {email.unresolvedPlaceholders.length > 0 && (
        <p className="warning">
          Nicht ersetzte Platzhalter: {email.unresolvedPlaceholders.map((p) => `{{${p}}}`).join(', ')}
        </p>
      )}
      <dl className="email-head">
        <dt>An</dt>
        <dd>{email.to || <span className="muted">keine E-Mail-Adresse hinterlegt</span>}</dd>
        <dt>Betreff</dt>
        <dd>{email.subject}</dd>
      </dl>
      <pre className="email-body">{email.body}</pre>
      <div className="email-actions">
        <button className="btn" onClick={copy}>
          {copied ? 'Kopiert ✓' : 'In Zwischenablage kopieren'}
        </button>
        <a className="btn" href={email.mailtoUri}>
          In E-Mail-Programm öffnen
        </a>
      </div>
    </div>
  );
}
