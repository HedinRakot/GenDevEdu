# E2E-Tests (Playwright + Clerk)

End-to-End-Tests gegen die **Expo-Web-App** (react-native-web) mit echtem
Clerk-Login. Sie decken den auth-pflichtigen Durchlauf ab, der sonst nur manuell
im Browser testbar ist.

> Hinweis: Die App nutzt **kein URL-Routing** (kein react-navigation `linking`).
> Die Tests navigieren daher ausschließlich per UI-Klick und prüfen über
> `testID`s / sichtbaren Text — nicht über die URL.

## Voraussetzungen

1. **Backend erreichbar** (eigenes Terminal):
   ```bash
   kubectl -n devedu port-forward svc/backend 8080:8080
   ```
2. **Expo-Web läuft** (eigenes Terminal) und zeigt auf das Backend:
   ```bash
   cd mobile && npx expo start --web      # Default: http://localhost:8081
   ```
3. **Clerk-Testing-Keys + Testnutzer** als Umgebungsvariablen (oder in `e2e/.env`):
   ```
   CLERK_PUBLISHABLE_KEY=pk_test_…
   CLERK_SECRET_KEY=sk_test_…
   E2E_LEARNER_EMAIL=learner@…        E2E_LEARNER_PASSWORD=…
   E2E_AUTHOR_EMAIL=author@…          E2E_AUTHOR_PASSWORD=…   # public_metadata.role = instructor
   ```
   Die Testnutzer müssen in der Clerk-**Testing**-Instanz existieren. `clerkSetup()`
   (globales Setup) holt das Testing-Token, das Bot-Schutz im Test umgeht.

## Ausführen

```bash
# bequem über das Wrapper-Skript (installiert Deps + Browser):
./test-e2e.sh

# oder direkt:
cd e2e
npm install
npx playwright install chromium
BASE_URL=http://localhost:8081 npx playwright test
```

HTML-Report: `e2e/playwright-report/index.html`.

## Abdeckung

- `tests/learner.spec.ts` — Login → Kurskatalog → Kurs öffnen (Auto-Enroll) →
  Kapitel → Frage beantworten (Feedback).
- `tests/author.spec.ts` — Login als Autor → Autorenbereich → neuen Kurs anlegen.

Erweiterbar um F7 (Code-Aufgabe), F8 (Kapitelquiz bestehen), F9 (Dashboard-Statistiken)
und F10 (Zertifikat) — die zugehörigen `testID`s sind in den Screens vorhanden.
