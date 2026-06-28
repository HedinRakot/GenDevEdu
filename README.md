# DevEdu

Schulungs-Applikation für Entwickler: Autoren erstellen Kurse (Kurs → Kapitel → Thema →
Beispiele), Lerner arbeiten sie durch und beantworten Fragen. Siehe [PRD.md](PRD.md) für die
vollständige Spezifikation und [docs/API_CONTRACT.md](docs/API_CONTRACT.md) für die API.

Dieser Stand umfasst **Iteration 1–3 (Features F1–F11)**: Auth & Rollen (Clerk), Inhalts-Datenmodell,
Autoren-CRUD, Lernansicht, Quiz (Single/Multiple Choice, Wahr/Falsch), Fortschrittsverfolgung,
Code-Aufgaben mit automatischer Sandbox-Auswertung (F7), Kapitel-Abschlussquizze mit
Bestehensgrenze/Versuchslimit (F8), ein Lerner-Dashboard mit Statistiken (F9),
Zertifikate bei Kursabschluss (F10) und einen Katalog mit Suche/Filter/Tags (F11).

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | React Native + Expo (iOS / Android / Web via react-native-web) |
| Backend | .NET 10 (ASP.NET Core Minimal API) |
| Datenbank | MongoDB |
| Deployment | Kubernetes (Kind oder k3s), nginx-Ingress |
| E2E-Tests | Playwright (im Docker-Image) |

## Voraussetzungen

### Windows (Podman + Kind)

- [Podman Desktop](https://podman-desktop.io)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

### Linux (Docker + k3s)

- Docker
- k3s (lokaler Cluster)
- `sudo`-Rechte

> Es wird **kein** lokales .NET-SDK oder Node benötigt — alle Builds laufen in Containern.

## Schnellstart — Windows (Podman + Kind)

```powershell
# Bauen, Registry + Kind-Cluster anlegen, deployen
.\deploy-kind.ps1

# App im Browser öffnen (Port-Forward starten + Fenster öffnen)
.\deploy-kind.ps1 -NoBuild -Forward
```

Nach dem Deploy ist die **Backend-API** unter **http://devedu.localhost:8080/api** erreichbar.
Die Expo-Web-App läuft lokal via `npx expo start --web` (zeigt auf denselben Port).

> **Hinweis:** Auf Windows leitet die WSL2-Podman-VM Ports nicht automatisch
> an `localhost` weiter. `kubectl port-forward` ist der zuverlässige Weg:
>
> ```powershell
> kubectl -n devedu port-forward svc/backend 8080:8080
> ```

Falls der Hostname `devedu.localhost` nicht auflöst, als Administrator in
`C:\Windows\System32\drivers\etc\hosts` ergänzen:

```
127.0.0.1   devedu.localhost
```

## Schnellstart — Linux (Docker + k3s)

```bash
# 1) Einmalig: lokales Registry + k3s-Konfiguration
./setup-registry.sh

# 2) Bauen, pushen, deployen
./deploy.sh

# 3) End-to-End-Tests
./test-e2e.sh
```

Nach dem Deploy ist die App unter **http://devedu.localhost** erreichbar.

## Mobile App (React Native / Expo)

Die App liegt unter `mobile/` und läuft auf iOS, Android und im Browser.
Sie baut auf Expo 54, React Native 0.81 und React 19 auf.

### Voraussetzungen

- Node 18+ und npm
- Expo Go-App auf dem Gerät **oder** ein Simulator (Android Studio / Xcode)

### Schnellstart

```bash
cd mobile
npm install

# Expo-Entwicklungsserver starten (QR-Code für Expo Go)
npx expo start

# Direkt im Browser
npx expo start --web

# Android / iOS
npx expo start --android
npx expo start --ios
```

### Tests

```bash
cd mobile
npm test              # einmalig
npm run test:watch    # watch-Modus
```

> **Hinweis Auth:** Auth läuft über **Clerk**. Vor dem ersten Start in
> `mobile/src/config/env.ts` den Clerk Publishable Key eintragen und im Backend
> `Clerk:Authority` setzen. Ohne Clerk-Key startet die App im Offline-Demo-Modus.

---

## Auth & Rollen (Clerk)

Authentifizierung läuft über **Clerk**. Nutzer registrieren sich direkt in der App
(E-Mail + Passwort mit E-Mail-Code-Verifizierung).

**Rollen** sind die Single Source of Truth in Clerk unter `public_metadata.role`:

| `public_metadata.role` | App-Rolle | Rechte |
|---|---|---|
| *(nicht gesetzt)* | Learner | Kurse ansehen, lernen, Quiz lösen |
| `instructor` | Author | zusätzlich Autoren-Bereich: Kurse/Kapitel/Inhalte/Quiz anlegen & publizieren |
| `admin` | Admin | alle Kurse verwalten |

Die Rolle wird per **Session-Token-Customization** (`{"role":"{{user.public_metadata.role}}"}`)
als `role`-Claim ins JWT gelegt; das Backend mappt sie auf .NET-Rollen
(`instructor → Author`, `admin → Admin`, sonst `Learner`). Der Author-Tab erscheint
nur für `instructor`/`admin`; das Backend erzwingt die Rechte zusätzlich (403).

**Rolle vergeben** (aktuell manuell):
- Clerk-Dashboard → Users → User → Metadata → `public_metadata` = `{ "role": "instructor" }`, oder
- per CLI (unter Git Bash ggf. `MSYS_NO_PATHCONV=1` voranstellen):
  ```sh
  clerk api /users/<user_id>/metadata -X PATCH -d '{"public_metadata":{"role":"instructor"}}'
  ```

Nach einem Rollenwechsel in der App neu einloggen (Clerk cached Tokens ~60 s).

Beim ersten Start legt das Backend einen veröffentlichten Demo-Kurs „C# Grundlagen"
an (1 Kapitel/Thema/Beispiel + 3 Fragen).

### Clerk Webhook (lokal verbinden)

`POST /api/webhooks/clerk` hält die Mongo-`users`-Collection in Sync: bei
`user.created`/`user.updated` wird der Nutzer samt Rolle (`User.Roles`) angelegt
bzw. aktualisiert, bei `user.deleted` entfernt. Der Endpunkt ist anonym; seine
Echtheit wird über die **Svix-Signatur** (`svix-id`/`svix-timestamp`/`svix-signature`)
gegen `Clerk:WebhookSecret` geprüft (HMAC-SHA256, 5-Minuten-Replay-Fenster).

> **Hinweis:** Solange `Clerk:WebhookSecret` leer ist, wird die Signatur **nicht**
> geprüft (nur Dev) — das Backend loggt eine Warnung. Für jeden echten Einsatz muss
> das Secret gesetzt sein.

Clerk erreicht `localhost` nicht direkt — lokal braucht es einen Tunnel:

```powershell
# 1) Backend erreichbar machen (eigenes Fenster offen lassen)
kubectl -n devedu port-forward svc/backend 8080:8080

# 2) Tunnel auf denselben Port (eigenes Fenster); öffentliche https-URL notieren
ngrok http 8080          # oder: cloudflared tunnel --url http://localhost:8080
```

3. **Clerk Dashboard → Webhooks → Add Endpoint**
   - Endpoint-URL: `https://<dein-tunnel>/api/webhooks/clerk`
   - Events abonnieren: `user.created`, `user.updated`, `user.deleted`
4. **Signing Secret** (`whsec_…`) des Endpunkts kopieren, als
   `Clerk__WebhookSecret` in `k8s/20-backend.yaml` (Secret `backend-secrets`)
   eintragen und neu ausrollen:
   ```powershell
   .\deploy-kind.ps1 -NoBuild     # Manifeste neu anwenden + Backend-Rollout
   ```
5. **Testen:** im Clerk-Dashboard „Send test event" auslösen oder einen Nutzer
   registrieren, dann den Sync prüfen:
   ```powershell
   kubectl -n devedu logs deploy/backend | Select-String "Clerk webhook"
   ```

## Projektstruktur

```
backend/         .NET 10 Web-API (DevEdu.Api) + Dockerfile
mobile/          React Native / Expo App (iOS, Android, Web via react-native-web)
k8s/             Namespace, Mongo, Backend, Ingress
e2e/             Playwright-Tests (playwright.config.ts, tests/)
docs/            API_CONTRACT.md (verbindliche Schnittstelle)
deploy-kind.ps1  Windows-Deployment: Podman + Kind
deploy.sh        Linux-Deployment: Docker + k3s
```

## Scripts

| Script | Plattform | Zweck |
|---|---|---|
| `deploy-kind.ps1` | Windows | Images bauen → Registry → Kind-Cluster anlegen → Manifeste anwenden. Flags: `-NoBuild`, `-BuildOnly`, `-DeleteCluster`, `-Forward` |
| `deploy.sh` | Linux | Images bauen → Registry pushen → k8s/ anwenden → Rollout abwarten. Flags: `--no-build`, `--build-only` |
| `setup-registry.sh` | Linux | Einmalig: Registry-Container `localhost:5000` + k3s `registries.yaml` |
| `test-e2e.sh` | Linux | Playwright im Docker-Image gegen das Deployment. Override: `BASE_URL=…` |

## Nützliche Befehle

```powershell
# Windows
kubectl -n devedu get pods
kubectl -n devedu logs deploy/backend
kubectl -n devedu logs deploy/mongo
.\deploy-kind.ps1 -NoBuild          # Manifeste neu anwenden, kein Build
.\deploy-kind.ps1 -DeleteCluster    # Cluster + Registry entfernen
```

```bash
# Linux
sudo k3s kubectl -n devedu get pods
sudo k3s kubectl -n devedu logs deploy/backend
```

## Offene Punkte / TODO

Bekannte offene Aufgaben und bewusst zurückgestellte Themen. Beim Abschließen bitte
abhaken und ggf. die Feature-Übersicht in `PRD.md` aktualisieren.

### Auth & Rollen
- [x] **Passwort-Reset-Flow** — `ForgotPasswordScreen` (Route in `AuthStack`, Link „Passwort vergessen?" im `LoginScreen`) über die Clerk Future-API: `signIn.create({ identifier })` → `resetPasswordEmailCode.sendCode()` → `verifyCode({ code })` → `submitPassword({ password })` → `finalize()` (auto-Login). Zweistufige UI (E-Mail → Code + neues Passwort), i18n in de/en/ru, Tests in `__tests__/ForgotPasswordScreen.test.tsx`.
- [x] **In-App Admin-UI für Rollenvergabe** — Admin-Tab (`AdminUsersScreen`, nur `role==='admin'`) listet alle Clerk-Nutzer und setzt Rollen über `GET`/`PATCH /api/admin/users[/{id}/role]`. Backend ruft die Clerk Backend API mit `Clerk:SecretKey` (k8s-Secret `backend-secrets`). ⚠️ Secret ist dev-only — vor Produktion externalisieren/rotieren.
- [x] **Clerk-Webhook lokal verbinden** — `POST /api/webhooks/clerk` synct `user.created/updated/deleted` nach Mongo (`User.Roles`). Svix-Signatur wird gegen `Clerk:WebhookSecret` geprüft (HMAC-SHA256 + 5-Min-Replay-Fenster, konstantzeitiger Vergleich); leeres Secret ⇒ Prüfung übersprungen (nur Dev, mit Warn-Log). Secret ist als `Clerk__WebhookSecret` im k8s-Secret `backend-secrets` verdrahtet. Lokale Tunnel-/Dashboard-Anleitung siehe README → „Clerk Webhook (lokal verbinden)". ⚠️ Secret dev-only — vor Produktion externalisieren/rotieren.

### Code-Qualität / Bugs
- [x] **`RouteProp`-Import** — in 6 Screens von `@react-navigation/native-stack` nach `@react-navigation/native` verschoben (inline `type`-Import). Behebt alle zugehörigen `tsc`-Fehler.
- [x] **ChatScreen Gemini-Key-Check** — `GEMINI_API_KEY` ist jetzt env-getrieben (`EXPO_PUBLIC_GEMINI_API_KEY`, Default `''`), Guard vereinfacht. Behebt den letzten `tsc`-Fehler; Key in `.env.local` setzen aktiviert den Chat.
- [x] **Quiz-Antworten härten** — `GET /api/questionlists/{id}` liefert für Learner jetzt weder `isCorrect`, `comment` (je Antwort) noch `answerValue` (Referenz-Antwort der Frage) aus; alles wird in `Mappers.ToQuestionDto/ToAnswerDto` nur bei `revealAnswers` (Admin/Autor) durchgereicht. Die Auswertung inkl. Erklär-Kommentar kommt für Learner ausschließlich aus `POST /api/questions/{id}/attempt`.

### Backend / API
- [x] **DELETE-Endpoints** — Autoren/Admins können löschen über `DELETE /api/courses/{id}`, `DELETE /api/chapters/{id}` und `DELETE /api/content/{id}` (Eigentümer-/Admin-Check, je `204`; Kurs-Delete kaskadiert QuestionLists/Attempts/Progress/Enrollments, Kapitel-/Inhalt-Delete räumt zugehörige QuestionLists ab). UI: Löschen-Button je Kurs (`AuthorCoursesScreen`), je Kapitel (`CourseEditorScreen`) und je Inhalt (`AddChapterContentScreen`), jeweils mit Bestätigungsdialog.
- [x] **„Wahr/Falsch"-Fragetyp** — eigener Typ `TrueFalse` (Enum `3`) in Backend (`MobileQuestionType`) und Mobile (`QuestionType`). Serverseitig wie `OneChoice` über genau zwei Antworten (Wahr/Falsch, eine korrekt) ausgewertet — gesamte Attempt-/Reveal-Pipeline wiederverwendet. Dedizierte UI: Lerner sehen zwei nebeneinanderliegende Buttons (`LessonScreen`), Autoren wählen im `AddQuestionListScreen` per „Wahr/Falsch"-Chip nur die korrekte Seite (feste, zweisprachige Labels). Demo-Kurs hat jetzt eine 3. Frage dieses Typs. Tests in `__tests__/LessonScreen.test.tsx`.

### Tests / E2E (zurückgestellt — niedrige Priorität)
- [ ] **Automatisierte End-to-End-Tests mit `@clerk/testing` + Playwright** gegen die Expo-Web-App aufsetzen (Skill `clerk-testing` als Startpunkt). Soll den auth-pflichtigen Durchlauf headless abdecken, der aktuell nur manuell im Browser testbar ist: Clerk-Login (Lerner/Autor via Testing-Tokens) → F7 Code-Aufgabe einreichen, F8 Kapitelquiz anlegen/bestehen, F9 Dashboard-Statistiken, F10 Zertifikat-Ausstellung (inkl. Idempotenz). Voraussetzung: Backend per Port-Forward + Expo-Web erreichbar; Clerk-Testing-Keys in CI hinterlegen.
- [ ] **Tote `e2e/`-Playwright-Suite entfernen**, sobald obiges steht — sie zielt noch auf das gelöschte Vite-Frontend (`devedu.localhost`, Manifest `k8s/30-frontend.yaml` bereits entfernt) und prüft nichts Funktionsfähiges mehr. Auch `test-e2e.sh` entsprechend anpassen/ersetzen.

> **Hinweis:** Dieses Test-Paket ist bewusst **nach hinten priorisiert** — erst nach den restlichen Feature-Arbeiten (F11 ff.).

### Geplante Features (PRD)

Detailplanung der noch offenen PRD-Features. Reihenfolge gemäß PRD: **F7 → F8 → F9 → F11 → F10**
(F10 hängt an F8, F9/F11 hängen nur an F2/F6). Jeder Punkt ist eine eigenständig umsetzbare
Aufgabe; Backend- und Mobile-Anteile sind getrennt aufgeführt.

#### F7 – Code-Aufgaben & Sandbox-Auswertung `P1` ✅ Implementiert

Programmieraufgaben werden automatisch gegen Testfälle in einer isolierten Sandbox geprüft.
Asynchroner Flow: einreichen → Queue → Worker führt aus → Polling. MVP-Sprache: **C#**.

- [x] **Fragetyp `Code = 4`** in `MobileQuestionType` (Backend) und `QuestionType` (Mobile); `Question.Code` (eingebettet, `backend/Models/CodeQuestion.cs`) mit `Language`, `StarterCode`, `SolutionCode` (autor-intern), `TestCases[] { Input, ExpectedOutput, Hidden }`, `TimeLimitMs`, `MemoryLimitMb`.
- [x] **`CodeSubmission`-Modell + Collection** (`codesubmissions`) mit Status (`Queued/Running/Completed/Error`), `Outcome`, per-Testfall-Ergebnissen, `PassedCount/TotalCount`, `DurationMs`.
- [x] **Mapper-Hiding** (`Mappers.ToCodeQuestionDto`/`ToCodeSubmissionDto`): `SolutionCode` und I/O versteckter Testfälle werden Lernern nie ausgeliefert (nur Autor/Admin via reveal). Abgesichert durch `tests/DevEdu.Api.Tests` (xUnit).
- [x] **Async-Pipeline**: `Channel<string>`-Queue (`CodeSubmissionQueue`) + `CodeExecutionWorker` (`BackgroundService`, seriell, frischer DI-Scope je Item). `POST /api/code-submissions` → `202` + Location; `GET /api/code-submissions/{id}` zum Pollen.
- [x] **Eigene Sandbox via rootless Podman-Sidecar** (`ISandboxRunner` → `PodmanSandboxRunner` über den Docker-kompatiblen Socket): pro Run `--network none --memory/--memory-swap --cpus 0.5 --pids-limit 20 --read-only --user 1000 --cap-drop ALL --security-opt no-new-privileges`. Compile-once → je Testfall stdin→stdout-Vergleich; Timeout-/OOM-Erkennung. Runner-Image `sandbox/csharp-runner`, Sidecar `sandbox/podman-sidecar` (lädt das Runner-Image aus mitgeliefertem Tarball).
- [x] **F6-Integration**: bei Abschluss schreibt der Worker einen `Attempt` (`IsCorrect` = alle Tests bestanden, `Score` = bestandene Tests) → zählt zum Fortschritt.
- [x] **Mobile**: Code-Editor + Submit/Poll in `LessonScreen` (TanStack Query `refetchInterval` bis terminal; Ergebnis mit bestanden/gesamt, Laufzeit, Compile-/Fehlerausgabe, sichtbare Testfälle mit Soll/Ist, versteckte nur als ✓/✗); Autor-Editor (Sprache, Starter-/Lösungs-Code, Testfälle mit Hidden-Flag) in `AddQuestionListScreen`; i18n de/en/ru; Tests in `__tests__/LessonScreenCode.test.tsx`.
- [x] **Deploy**: Podman-Sidecar + geteilte Volumes in `k8s/20-backend.yaml`; Runner-/Sidecar-Image-Build in `deploy-kind.ps1` und `deploy.sh`. Demo-Code-Frage im `Seeder`.
- [x] **Im Kind/Podman-Cluster verifiziert** (2026-06-27): Sandbox kompiliert + führt C# offline aus (`stdin 21 → stdout 42`), `--network none` blockt Netz, alle Härtungs-Flags greifen; Backend-Container erreicht den Sidecar-Socket. Scratch-Cleanup über Wegwerf-Container (`TryContainerCleanupAsync`), da rootless-userns dem Backend das Löschen der Artefakte verwehrt.
- [x] **Startup gehärtet**: Podman-Store auf PVC (`podman-store`) ⇒ Runner-Image überlebt Restarts (Erststart ~41 s mit Load, Folge-Restart ~7 s ohne); Sidecar-`readinessProbe` auf den Socket ⇒ Pod erst Ready, wenn die Sandbox nutzbar ist.

> ⚠️ **Sicherheit (dev-only):** Container-Isolation ist die einzige Grenze gegen feindlichen Code
> und gilt nicht als ausreichend für Produktion. Prod-Pfad (dokumentiert, nicht gebaut): Jobs-Runner
> hinter `ISandboxRunner` + **gVisor**/Kata, getaintetes Sandbox-Node-Pool, NetworkPolicy deny-all.
> Rootless ohne cgroup-v2-Delegation setzt `--memory` ggf. nicht auf verschachtelte Container durch
> (dann deckelt nur das Sidecar-Pod-Limit); bei Problemen Sidecar auf `privileged: true` umstellen.
> Noch offen: der auth-pflichtige End-to-End-Submit über die Expo-App (Clerk-Login).

#### F8 – Kapitel-Abschlussquiz & Bewertung `P1` ✅ Implementiert

Dediziertes Quiz je Kapitel mit aggregiertem Score, konfigurierbarer Bestehensgrenze und
Versuchslimit. Getrennt von den Lektions-/Content-Quizzen; nur auto-bewertbare Fragetypen.

- [x] **Datenmodell**: `Chapter.ChapterQuizId` + `PassThresholdPercent` + `MaxAttempts`; `QuestionList.ChapterId`; neue Collection `ChapterQuizAttempt` (je Versuch ein Datensatz); `Progress.PassedChapterQuizIds`.
- [x] **Geteilte Bewertung**: Pro-Frage-Korrektheit in `Grading.IsCorrect` extrahiert (von Einzel-Attempt **und** Kapitelquiz genutzt); `Grading.Percent` für die Aggregation.
- [x] **Service/Endpoints** (`ChapterQuizService`): `GET /api/chapters/{id}/quiz` (Lerner ohne Antworten + Versuchsstatus, Autor mit), `POST /api/chapters/{id}/quiz/attempt` (gebündelt → Score/%/bestanden, MaxAttempts-Prüfung), `PUT`/`DELETE /api/chapters/{id}/quiz` (Autor: anlegen/ersetzen/löschen, nur auto-bewertbare Typen). Ersetzen verwirft alte Versuche + Pass-Status.
- [x] **Kapitel-Abschluss**: `GetChaptersAsync` markiert ein Kapitel erst als `completed`, wenn alle Inhalte fertig **und** (falls vorhanden) das Abschlussquiz bestanden ist; `quizPassed` im Chapter-DTO.
- [x] **Autoren-UI**: `ChapterQuizEditorScreen` (Bestehensgrenze %, max. Versuche, Fragen über die geteilte `QuestionEditor`-Komponente, lädt bestehendes Quiz zum Ersetzen, Löschen); Einstieg je Kapitel im `CourseEditorScreen` („📝 Quiz").
- [x] **Lerner-UI**: `ChapterQuizScreen` (alle Fragen, gebündelte Abgabe, Score + bestanden/nicht bestanden, je Frage richtig/falsch + Erklärung, „Erneut versuchen"/gesperrt); Einstieg im `CourseDetailScreen`, bestandene Quizze markiert.
- [x] **Tests**: Backend xUnit (Grading, %-Rundung, Reveal-Hiding, Typ-Restriktion, AttemptsExhausted); Mobile Jest (`ChapterQuizScreen`: bestanden/nicht bestanden/gesperrt). i18n de/en/ru.

> Bewusste Vereinfachung (abgestimmt): kein In-Place-Edit einzelner Fragen — Quizze werden als
> Ganzes **angelegt + ersetzt**. DB-abhängige Pfade (MaxAttempts, Replace-Cleanup, Completion) sind
> durch Unit-Tests der reinen Logik + den geplanten Cluster-E2E abgedeckt.

#### F9 – Lerner-Dashboard & Statistiken `P2` ✅ Implementiert

Tiefere Auswertung als der bisherige Fortschritts-Überblick — als Statistik-Bereich im Dashboard.

- [x] **Backend**: `GET /api/me/stats` → `StatsService` lädt Enrollments/Progress/Attempts/ChapterQuizAttempts/CodeSubmissions + die eingeschriebenen Kurse; reiner `StatsCalculator` aggregiert (kein DB-Zugriff ⇒ unit-testbar, nutzt `Grading.Percent`). `LearnerStatsDto`/`CourseStatDto`: aktive/abgeschlossene Kurse, Gesamt- + Pro-Kurs-Fortschritt %, Quiz-Trefferquote (richtig/gesamt), Kapitel-Quizze bestanden/gesamt, gelöste/eingereichte Code-Aufgaben (distinct).
- [x] **Mobile**: `useStats`-Hook + `getStats`-API; `DashboardScreen` zeigt Kennzahl-Kacheln (`Card`) + Fortschritt je Kurs (`ProgressBar` + Status), Leerzustand; i18n `dashboard.stats.*` de/en/ru.
- [x] **Tests**: 7 xUnit für `StatsCalculator` (Schnittmengen gegen Altlasten, Rollup, Trefferquote, distinct-Zählung, leere Eingabe); Mobile-Jest `DashboardStats` (Kacheln/Kursfortschritt/Leerzustand). Streak bleibt clientseitig.

#### F11 – Katalog: Suche, Filter, Tags `P2` ✅ Implementiert

Kursliste mit Volltextsuche + Filter nach Tags und Level. Server-seitige Filterung.

- [x] **Datenmodell**: `Course.Tags[]` + `Course.Level` (`CourseLevel`-Const: Beginner/Intermediate/Advanced); `CourseDto`/`CreateCourseRequest` + `Mappers` erweitert.
- [x] **Filterlogik**: reiner `CourseCatalog.Filter` (Level exact, Tags ODER-Match, Suche über Name/Titel/Tags, case-insensitiv) — in-memory in `ListAsync` nach dem Published/Rollen-Filter (kein Mongo-Textindex bei dieser Datenmenge).
- [x] **API**: `GET /api/courses?search=&tags=&level=` (tags komma-separiert) + `GET /api/courses/tags` (distinkte Tags der Published-Kurse für die Chips). `Seeder` taggt den Demo-Kurs (`csharp`, `grundlagen`, Level Beginner).
- [x] **Mobile**: `useCourses(params)` (param-spezifischer Query-Key) + `useCourseTags`; `CoursesScreen` mit Suchfeld (300 ms debounced) + Level-/Tag-Chips + Level-Badge/Tags je Karte + Leerzustand; `CreateCourseScreen` mit Tags-Feld + Level-Chips; i18n `courses.*` de/en/ru.
- [x] **Tests**: 5 xUnit `CourseCatalog` (Suche/Level/Tags/kombiniert/leer); Mobile-Jest `CoursesScreenFilter` (Level-Filter verengt Liste, noResults) + aktualisierter `CoursesScreen`-Test.

> Bewusst zurückgestellt: Tags/Level nachträglich editieren (bräuchte `PUT /api/courses/{id}`); Mongo-Textindex (erst bei großem Katalog).

#### F10 – Zertifikate / Abzeichen `P2` ✅ Implementiert

Bei Kursabschluss wird automatisch ein Zertifikat ausgestellt — Abschluss = alle Inhalte fertig
**und** alle Kapitel-Quizze bestanden (geteilte Logik mit F8/F9).

- [x] **Geteilte `CourseCompletion`** (rein, statisch): `IsChapterComplete`/`IsCourseComplete` — vereinheitlicht die zuvor doppelte Abschluss-Logik in `GetChaptersAsync` und `StatsCalculator`.
- [x] **Modell + Idempotenz**: `Certificate` (Snapshots `CourseName`/`LearnerName` + `VerificationCode`), eigene Collection mit **Unique-Index `(UserId,CourseId)`**; `CertificateService.CheckAndIssueAsync` stellt einmalig aus + setzt `Enrollment.CompletedAt` (Race → DuplicateKey ignoriert).
- [x] **Trigger**: aus `EnrollmentService.CompleteChapterContentAsync` **und** `ChapterQuizService.SubmitAsync` (bei bestandenem Quiz) — der erste Event, der den Kurs vervollständigt, löst die Ausstellung aus.
- [x] **API**: `GET /api/me/certificates` (`CertificateDto`, neueste zuerst). Öffentliche Verifikation (`/api/certificates/{code}`) bewusst zurückgestellt — `VerificationCode` ist vorhanden, additiv nachrüstbar.
- [x] **Mobile**: `useCertificates`-Hook + `getCertificates`-API; `CertificatesSection` (Badges 🏅 + Kursname + Datum + Code) im `DashboardScreen`, Leerzustand; Invalidierung von `['certificates']`/`['stats']` bei Inhalt-Abschluss + Quiz-Abgabe; i18n `dashboard.certificates.*` de/en/ru.
- [x] **Tests**: 5 xUnit `CourseCompletion` (+ unveränderte `StatsCalculator`-Tests grün); Mobile-Jest `DashboardCertificates` (Badges + Leerzustand).
