import { test, expect } from '@playwright/test';
import { login, LEARNER } from './helpers';

// F7: Code-Aufgabe end-to-end. Lerner öffnet einen Kurs, navigiert in eine Lektion
// mit einer Code-Frage, reicht Code ein und erhält ein Ergebnis.
//
// Voraussetzung: ein geseedeter Kurs mit Code-Frage sowie eine funktionierende
// Sandbox. Lokal reicht Sandbox:UseStub=true (Backend), im Cluster der Podman-Sidecar.
// Ist in der geöffneten Lektion keine Code-Karte vorhanden, wird der Test übersprungen.

test.describe('Code-Aufgabe (F7)', () => {
  test('reicht Code ein und erhält ein Ergebnis', async ({ page }) => {
    await login(page, LEARNER.email, LEARNER.password);

    await page.getByTestId('course-card').first().click();
    const chapter = page.getByTestId('chapter-row').first();
    await expect(chapter).toBeVisible();
    await chapter.click();

    const codeInput = page.getByTestId('code-input').first();
    const hasCodeQuestion = await codeInput.isVisible().catch(() => false);
    test.skip(!hasCodeQuestion, 'Keine Code-Frage in dieser Lektion — Seed ohne Code-Aufgabe.');

    await codeInput.fill('Console.WriteLine("42");');
    await page.getByTestId('code-submit').first().click();

    // Nach dem asynchronen Sandbox-Lauf erscheint das Ergebnis (bestanden/fehlgeschlagen).
    await expect(page.getByTestId('code-result').first()).toBeVisible({ timeout: 30_000 });
  });
});
