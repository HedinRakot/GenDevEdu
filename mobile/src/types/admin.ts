// Rollen-Werte wie in Clerk public_metadata.role gespeichert.
// 'instructor' = Author (Backend mappt instructor → Author).
export type AppRole = 'learner' | 'instructor' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  role: AppRole;
}
