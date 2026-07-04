import { test, expect } from '@playwright/test';
import { login, AUTHOR } from './helpers';

// Autoren-Durchlauf: Anmeldung als Instructor → Autorenbereich (über die
// Einstellungen erreichbar, kein eigener Bottom-Tab) → neuen Kurs anlegen.
//
// Voraussetzungen wie bei learner.spec.ts, zusätzlich ein Autor-Testnutzer mit
// public_metadata.role = "instructor" (E2E_AUTHOR_EMAIL/PASSWORD).

test.describe('Autoren-Durchlauf', () => {
  test('legt einen neuen Kurs an', async ({ page }) => {
    await login(page, AUTHOR.email, AUTHOR.password);

    // Einstellungen → „Autorenbereich" (Author-Stack hat keinen eigenen Tab).
    await page.getByTestId('tab-settings').click();
    await page.getByText('Autorenbereich').click();

    // Im Autorenbereich einen neuen Kurs anlegen.
    await page.getByTestId('author-new-course').click();

    const name = `e2e-${Date.now()}`;
    await page.getByTestId('create-course-name').fill(name);
    await page.getByTestId('create-course-submit').click();

    // Nach erfolgreicher Anlage wird zum Kurs-Editor weitergeleitet (replace),
    // das Anlege-Formular ist nicht mehr vorhanden.
    await expect(page.getByTestId('create-course-submit')).toHaveCount(0);
  });
});
