import { clerkSetup } from '@clerk/testing/playwright';
import * as dotenv from 'dotenv';

// .env (lokal, nicht eingecheckt) mit CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY laden.
dotenv.config();

/**
 * Globales Playwright-Setup: holt von Clerk ein Testing-Token, das die
 * Bot-Erkennung im Test umgeht. Erwartet CLERK_PUBLISHABLE_KEY und
 * CLERK_SECRET_KEY in der Umgebung (Testing-Instanz, nicht Produktion).
 */
export default async function globalSetup() {
  await clerkSetup();
}
