import { expect, type Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

/**
 * Meldet einen bestehenden Clerk-Testnutzer über die echte App-Login-UI an.
 *
 * Die Expo-Web-App nutzt KEIN URL-Routing (kein react-navigation `linking`),
 * daher wird ausschließlich über `/` geladen und per UI navigiert — Assertions
 * laufen über testIDs/sichtbaren Text, nicht über die URL.
 */
export async function login(page: Page, email: string, password: string) {
  await setupClerkTestingToken({ page });
  await page.goto('/');

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('oidc-login-button').click();

  // Nach erfolgreicher Anmeldung rendert RootNavigator die AppTabs; die
  // Kursliste lädt vom Backend.
  await expect(page.getByTestId('course-card').first()).toBeVisible();
}

export const LEARNER = {
  email: process.env.E2E_LEARNER_EMAIL ?? 'learner@devedu.test',
  password: process.env.E2E_LEARNER_PASSWORD ?? '',
};

export const AUTHOR = {
  email: process.env.E2E_AUTHOR_EMAIL ?? 'author@devedu.test',
  password: process.env.E2E_AUTHOR_PASSWORD ?? '',
};
