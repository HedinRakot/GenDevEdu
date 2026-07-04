// TypeScript-Spiegel der Backend-DTOs (crm/api/Dtos/*).
// Die Phase-Strings entsprechen exakt der JSON-Serialisierung des Backends
// (JsonStringEnumConverter mit CamelCase-Policy) — nicht umbenennen!

export type PipelinePhase =
  | 'erstgespraech'
  | 'eignungstest'
  | 'gutscheinBeantragt'
  | 'gutscheinGenehmigt'
  | 'ausbildungGestartet'
  | 'abgebrochen'
  | 'abgelehnt';

export type ActivityKind = 'note' | 'call' | 'email';

export interface AgenturInfo {
  kundennummer: string;
  vermittlerName: string;
  vermittlerEmail: string;
  vermittlerPhone: string;
  dienststelle: string;
}

export interface GutscheinInfo {
  nummer: string;
  gueltigBis?: string | null;
}

export interface StatusHistoryEntry {
  phase: PipelinePhase;
  note?: string | null;
  changedAt: string;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  street: string;
  postalCode: string;
  city: string;
  agentur: AgenturInfo;
  gutschein: GutscheinInfo;
  phase: PipelinePhase;
  statusHistory: StatusHistoryEntry[];
  courseStart?: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phase: PipelinePhase;
  kundennummer: string;
  courseStart?: string | null;
  updatedAt: string;
}

/** Payload für Anlegen/Bearbeiten (Phase nur beim Anlegen relevant). */
export interface ParticipantInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string | null;
  street?: string;
  postalCode?: string;
  city?: string;
  agentur?: AgenturInfo;
  gutschein?: GutscheinInfo;
  phase?: PipelinePhase;
  courseStart?: string | null;
  notes?: string;
}

export interface Activity {
  id: string;
  participantId: string;
  text: string;
  kind: ActivityKind;
  createdAt: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  updatedAt: string;
  availablePlaceholders: string[];
}

export interface RenderedEmail {
  to: string;
  subject: string;
  body: string;
  mailtoUri: string;
  unresolvedPlaceholders: string[];
}

export interface PhaseCount {
  phase: PipelinePhase;
  count: number;
}

export interface Dashboard {
  total: number;
  phases: PhaseCount[];
}
