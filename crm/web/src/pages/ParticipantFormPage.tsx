import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ParticipantInput } from '../api/types';
import { useCreateParticipant, useParticipant, useUpdateParticipant } from '../api/hooks';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  street: string;
  postalCode: string;
  city: string;
  kundennummer: string;
  vermittlerName: string;
  vermittlerEmail: string;
  vermittlerPhone: string;
  dienststelle: string;
  gutscheinNummer: string;
  gutscheinGueltigBis: string;
  courseStart: string;
  notes: string;
}

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  street: '',
  postalCode: '',
  city: '',
  kundennummer: '',
  vermittlerName: '',
  vermittlerEmail: '',
  vermittlerPhone: '',
  dienststelle: '',
  gutscheinNummer: '',
  gutscheinGueltigBis: '',
  courseStart: '',
  notes: '',
};

export default function ParticipantFormPage() {
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { data: existing } = useParticipant(id);
  const create = useCreateParticipant();
  const update = useUpdateParticipant(id ?? '');
  const mutation = editing ? update : create;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!existing) return;
    setForm({
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      phone: existing.phone,
      birthDate: existing.birthDate?.slice(0, 10) ?? '',
      street: existing.street,
      postalCode: existing.postalCode,
      city: existing.city,
      kundennummer: existing.agentur.kundennummer,
      vermittlerName: existing.agentur.vermittlerName,
      vermittlerEmail: existing.agentur.vermittlerEmail,
      vermittlerPhone: existing.agentur.vermittlerPhone,
      dienststelle: existing.agentur.dienststelle,
      gutscheinNummer: existing.gutschein.nummer,
      gutscheinGueltigBis: existing.gutschein.gueltigBis?.slice(0, 10) ?? '',
      courseStart: existing.courseStart?.slice(0, 10) ?? '',
      notes: existing.notes,
    });
  }, [existing]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setValidationError('Vorname und Nachname sind erforderlich.');
      return;
    }
    setValidationError('');

    const input: ParticipantInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      birthDate: form.birthDate || null,
      street: form.street.trim(),
      postalCode: form.postalCode.trim(),
      city: form.city.trim(),
      agentur: {
        kundennummer: form.kundennummer.trim(),
        vermittlerName: form.vermittlerName.trim(),
        vermittlerEmail: form.vermittlerEmail.trim(),
        vermittlerPhone: form.vermittlerPhone.trim(),
        dienststelle: form.dienststelle.trim(),
      },
      gutschein: {
        nummer: form.gutscheinNummer.trim(),
        gueltigBis: form.gutscheinGueltigBis || null,
      },
      courseStart: form.courseStart || null,
      notes: form.notes,
    };

    mutation.mutate(input, {
      onSuccess: (participant) => navigate(`/teilnehmer/${participant.id}`),
    });
  };

  return (
    <div className="form-page">
      <h1>{editing ? 'Teilnehmer bearbeiten' : 'Neuer Teilnehmer'}</h1>
      <form onSubmit={submit} noValidate>
        <fieldset>
          <legend>Person</legend>
          <div className="form-grid">
            <label>
              Vorname *
              <input value={form.firstName} onChange={set('firstName')} required />
            </label>
            <label>
              Nachname *
              <input value={form.lastName} onChange={set('lastName')} required />
            </label>
            <label>
              E-Mail
              <input type="email" value={form.email} onChange={set('email')} />
            </label>
            <label>
              Telefon
              <input value={form.phone} onChange={set('phone')} />
            </label>
            <label>
              Geburtsdatum
              <input type="date" value={form.birthDate} onChange={set('birthDate')} />
            </label>
            <label>
              Straße
              <input value={form.street} onChange={set('street')} />
            </label>
            <label>
              PLZ
              <input value={form.postalCode} onChange={set('postalCode')} />
            </label>
            <label>
              Ort
              <input value={form.city} onChange={set('city')} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Agentur für Arbeit</legend>
          <div className="form-grid">
            <label>
              Kundennummer
              <input value={form.kundennummer} onChange={set('kundennummer')} />
            </label>
            <label>
              Vermittler/in
              <input value={form.vermittlerName} onChange={set('vermittlerName')} />
            </label>
            <label>
              Vermittler-E-Mail
              <input type="email" value={form.vermittlerEmail} onChange={set('vermittlerEmail')} />
            </label>
            <label>
              Vermittler-Telefon
              <input value={form.vermittlerPhone} onChange={set('vermittlerPhone')} />
            </label>
            <label>
              Dienststelle
              <input value={form.dienststelle} onChange={set('dienststelle')} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Bildungsgutschein &amp; Ausbildung</legend>
          <div className="form-grid">
            <label>
              Gutschein-Nummer
              <input value={form.gutscheinNummer} onChange={set('gutscheinNummer')} />
            </label>
            <label>
              Gültig bis
              <input type="date" value={form.gutscheinGueltigBis} onChange={set('gutscheinGueltigBis')} />
            </label>
            <label>
              Geplanter Kursstart
              <input type="date" value={form.courseStart} onChange={set('courseStart')} />
            </label>
          </div>
          <label>
            Notizen
            <textarea rows={4} value={form.notes} onChange={set('notes')} />
          </label>
        </fieldset>

        {validationError && <p className="error">{validationError}</p>}
        {mutation.isError && <p className="error">{(mutation.error as Error).message}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
            {editing ? 'Speichern' : 'Anlegen'}
          </button>
          <button className="btn" type="button" onClick={() => navigate(-1)}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
