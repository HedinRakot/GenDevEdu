import type { Texte } from './course';
import type { TextItemDto } from './author';

/** Server-verwaltete Daily Challenge (GET /api/daily-challenges/today, Admin-CRUD). */
export interface ApiDailyChallenge {
  id: string;
  title: Texte;
  description: Texte;
  exampleSnippet: string | null;
  snippetLang: string;
  estimatedMinutes: number;
  difficulty: string;
  category: string;
  active: boolean;
}

/** Request-Body für POST/PUT /api/admin/daily-challenges. */
export interface SaveDailyChallengeRequest {
  /** Nur beim Anlegen: sprechender Slug; leer = generierte Id. */
  id?: string;
  titleItems: TextItemDto[];
  descriptionItems: TextItemDto[];
  exampleSnippet?: string;
  snippetLang?: string;
  estimatedMinutes: number;
  difficulty: string;
  category: string;
  active: boolean;
}
