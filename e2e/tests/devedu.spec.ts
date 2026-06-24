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

  // Mark the topic complete.
  await page.getByTestId('mark-complete').click();
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
