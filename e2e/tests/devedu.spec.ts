import { test, expect, Page } from '@playwright/test';

const LEARNER = { email: 'learner@devedu.local', password: 'Passw0rd!' };
const AUTHOR = { email: 'author@devedu.local', password: 'Passw0rd!' };
const DEMO_COURSE = 'C# Grundlagen';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/courses$/);
}

async function openDemoCourse(page: Page) {
  const card = page
    .getByTestId('course-card')
    .filter({ has: page.getByTestId('course-card-title').filter({ hasText: DEMO_COURSE }) })
    .first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/courses\/[^/]+$/);
}

test('Learner kann sich anmelden und sieht den Demo-Kurs', async ({ page }) => {
  await login(page, LEARNER.email, LEARNER.password);
  await expect(page.getByTestId('user-displayname')).toBeVisible();
  await expect(
    page.getByTestId('course-card-title').filter({ hasText: DEMO_COURSE }).first(),
  ).toBeVisible();
});

test('Learner kann einen Kurs öffnen, Beispiel sehen und Fragen beantworten', async ({ page }) => {
  await login(page, LEARNER.email, LEARNER.password);
  await openDemoCourse(page);

  // Enroll (idempotent on the backend side)
  const enroll = page.getByTestId('enroll-button');
  if (await enroll.count()) await enroll.first().click();

  // Select the first topic and verify learning content shows.
  await page.getByTestId('topic-nav-item').first().click();
  await expect(page.getByTestId('example-content').first()).toBeVisible();

  // Answer every question on the topic; assert the grading round-trip returns feedback.
  const questions = page.getByTestId('question-item');
  const count = await questions.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const q = questions.nth(i);
    const trueBtn = q.getByTestId('truefalse-true');
    if (await trueBtn.count()) {
      // TrueFalse question
      await trueBtn.first().check().catch(async () => trueBtn.first().click());
    } else {
      // Single/Multiple choice — pick the first option
      await q.getByTestId('option-input').first().check();
    }
    await q.getByTestId('submit-answer').click();
    await expect(q.getByTestId('answer-feedback')).toBeVisible();
  }

  // Mark the topic complete (idempotent: button is disabled if progress already persisted from a prior run).
  const markBtn = page.getByTestId('mark-complete');
  if (await markBtn.isEnabled()) {
    await markBtn.click();
  }
  await expect(page.getByTestId('topic-completed')).toBeVisible();
});

test('Neuer Learner kann sich registrieren', async ({ page }) => {
  const unique = `e2e_${Date.now()}@devedu.local`;
  await page.goto('/register');
  await page.getByTestId('register-email').fill(unique);
  await page.getByTestId('register-name').fill('E2E Tester');
  await page.getByTestId('register-password').fill('Passw0rd!');
  await page.getByTestId('register-role').selectOption('Learner');
  await page.getByTestId('register-submit').click();

  await expect(page).toHaveURL(/\/courses$/);
  await expect(page.getByTestId('user-displayname')).toBeVisible();
});

test('Learner kann das Kapitelquiz absolvieren und erhält ein Ergebnis', async ({ page }) => {
  await login(page, LEARNER.email, LEARNER.password);
  await openDemoCourse(page);

  // Navigate to the chapter quiz via the sidebar nav item.
  const quizNav = page.getByTestId('chapter-quiz-nav-item').first();
  await expect(quizNav).toBeVisible();
  await quizNav.click();

  // A TrueFalse question is in the seeded chapter quiz.
  const trueBtn = page.locator('input[type="radio"]').filter({ hasText: '' }).first();
  // Pick "Wahr" (first radio in the form)
  await page.locator('form').locator('input[type="radio"]').first().check();

  // Submit the quiz.
  await page.getByRole('button', { name: /Quiz einreichen/ }).click();

  // Score summary must appear.
  await expect(page.locator('text=/\\d+ \\/ \\d+ Punkte/')).toBeVisible();
  // Pass or fail badge must appear.
  await expect(
    page.locator('[class*="bg-emerald"],[class*="bg-red"]').filter({ hasText: /Bestanden|Nicht bestanden/ }).first()
  ).toBeVisible();
});

test('Autor kann einen Kurs anlegen und er erscheint in der Liste', async ({ page }) => {
  await login(page, AUTHOR.email, AUTHOR.password);

  const title = `E2E Kurs ${Date.now()}`;
  await page.getByTestId('create-course-title').fill(title);
  const desc = page.getByTestId('create-course-description');
  if (await desc.count()) await desc.fill('Von Playwright erstellt.');
  await page.getByTestId('create-course-submit').click();

  await expect(
    page.getByTestId('course-card-title').filter({ hasText: title }).first(),
  ).toBeVisible();
});
