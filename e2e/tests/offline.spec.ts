import { test, expect } from '@playwright/test';
import { login, LEARNER } from './helpers';

// F9: Offline-Modus. Nach dem Login ist der Kurskatalog geladen und wird per
// React-Query in AsyncStorage (auf Web = localStorage) persistiert. Geht das Gerät
// offline und die App wird neu geladen, muss der Katalog aus dem Cache erscheinen.

test.describe('Offline-Modus (F9)', () => {
  test('zeigt den zuvor geladenen Kurskatalog auch offline nach Reload', async ({ page, context }) => {
    await login(page, LEARNER.email, LEARNER.password);
    await expect(page.getByTestId('course-card').first()).toBeVisible();

    // Verbindung kappen und neu laden → Rehydrierung aus dem persistierten Cache.
    await context.setOffline(true);
    await page.reload();

    await expect(page.getByTestId('course-card').first()).toBeVisible();

    await context.setOffline(false);
  });
});
