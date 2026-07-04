import { test, expect } from '@playwright/test';
import { login, LEARNER } from './helpers';

// Auth-pflichtiger Durchlauf, der bisher nur manuell im Browser testbar war:
// Clerk-Login → Kurs öffnen (Auto-Enroll) → Lektion → Frage beantworten.
//
// Voraussetzungen (siehe e2e/README.md):
//   - Backend per Port-Forward erreichbar, Expo-Web läuft (BASE_URL).
//   - Clerk-Testing-Keys (CLERK_PUBLISHABLE_KEY/SECRET_KEY) + ein Lerner-Testnutzer
//     (E2E_LEARNER_EMAIL/PASSWORD). Der geseedete Demo-Kurs "C# Grundlagen" ist Ziel.

test.describe('Lerner-Durchlauf', () => {
  test('meldet sich an und sieht den Kurskatalog', async ({ page }) => {
    await login(page, LEARNER.email, LEARNER.password);
    await expect(page.getByTestId('course-card').first()).toBeVisible();
  });

  test('öffnet einen Kurs, sieht Kapitel und beantwortet eine Frage', async ({ page }) => {
    await login(page, LEARNER.email, LEARNER.password);

    // Ersten Kurs öffnen (Auto-Enroll passiert beim Öffnen).
    await page.getByTestId('course-card').first().click();

    // Kapitelübersicht → erstes Kapitel öffnen.
    const chapter = page.getByTestId('chapter-row').first();
    await expect(chapter).toBeVisible();
    await chapter.click();

    // In der Lektion eine Choice-Frage beantworten und Feedback abwarten.
    const submit = page.getByTestId('submit-answer').first();
    await expect(submit).toBeVisible();
    await submit.click();

    await expect(page.getByTestId('answer-feedback').first()).toBeVisible();
  });
});
