/** F14: Datums-Helfer (lokale Gerätetage als ISO yyyy-MM-dd, kein UTC-Versatz). */

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return toIsoDate(date);
}

/** Erster/letzter Tag des Monats von `year-month` (1-basiert). */
export function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  return { from, to: `${year}-${pad(month)}-${pad(lastDay)}` };
}

export function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}
