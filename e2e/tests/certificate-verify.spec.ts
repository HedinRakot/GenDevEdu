import { test, expect, request } from '@playwright/test';

// F10: öffentliche Zertifikat-Verifikation (GET /api/certificates/{code}) — ohne Auth.
// Läuft rein auf API-Ebene gegen das Backend (kein Clerk/UI nötig).
//
// Backend-Basis-URL: API_BASE_URL, sonst der lokale Dev-Default (localhost:8080).

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

test.describe('Zertifikat-Verifikation (F10)', () => {
  test('unbekannter Code liefert 404 (öffentlich, ohne Auth)', async () => {
    const ctx = await request.newContext({ baseURL: API_BASE_URL });
    const res = await ctx.get('/api/certificates/DOESNOTEXIST');
    expect(res.status()).toBe(404);
    await ctx.dispose();
  });

  test('gültiger Code (via API_BASE_URL + E2E_CERT_CODE) liefert die Zertifikatsdaten', async () => {
    const code = process.env.E2E_CERT_CODE;
    test.skip(!code, 'E2E_CERT_CODE nicht gesetzt — überspringe Positiv-Fall.');

    const ctx = await request.newContext({ baseURL: API_BASE_URL });
    const res = await ctx.get(`/api/certificates/${code}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.courseName).toBeTruthy();
    expect(body.learnerName).toBeTruthy();
    await ctx.dispose();
  });
});
