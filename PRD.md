
# PRD – DevEdu (Schulungs-Applikation)

## Kontext

`DevEdu` ist eine Web-Applikation, mit der **Autoren** Schulungsinhalte strukturiert
erstellen und **Lerner** diese durcharbeiten. Inhalte sind hierarchisch aufgebaut
(Kurse → Kapitel → Themen → Beispiele), nach Kapiteln/Themen folgen **Fragen** zur
Wissensüberprüfung. Fokus: Entwickler-Schulungen, daher sind **Code-Aufgaben** mit
automatischer Auswertung ein Kernfeature.

Dieses PRD ist nach **Features** gegliedert. Die Features sind unabhängig genug, um
**schrittweise** umgesetzt zu werden — es muss nicht alles auf einmal gebaut werden.
Jedes Feature hat eine **Priorität** (P0 = MVP-Kern, P1 = wichtig, P2 = später) und
einen **Status**.

## Eckdaten

| Bereich | Entscheidung |
|---|---|
| Plattform | Unified Expo App – Web-Browser, iOS, Android aus einer Codebasis |
| Frontend | React Native + Expo (react-native-web übersetzt RN-Primitives für den Browser) |
| Backend | .NET 10 (ASP.NET Core Web API) |
| Datenbank | MongoDB |
| Auth | Clerk (cloud, JWKS-gesichert) – ersetzt eigenes JWT + Duende Identity Server |
| Nutzerrollen | Lerner + Autoren + Admin, Rollenverwaltung via Clerk `publicMetadata` |
| Fragetypen | Single/Multiple Choice, Wahr/Falsch, Code-Aufgaben |
| Code-Auswertung | Automatisch via Tests in isolierter Sandbox |

## Feature-Übersicht

| # | Feature | Priorität | Status | Abhängig von |
|---|---|---|---|---|
| F1 | Authentifizierung & Rollen | P0 | Implementiert | – |
| F2 | Inhalts-Domänenmodell & Speicherung | P0 | Implementiert | – |
| F3 | Autoren-Bereich (Inhalts-CRUD/CMS) | P0 | Implementiert | F1, F2 |
| F4 | Lernansicht (Kurs durcharbeiten) | P0 | Implementiert | F2 |
| F5 | Quiz: Choice & Wahr/Falsch | P0 | Implementiert | F2, F4 |
| F6 | Fortschrittsverfolgung | P1 | Implementiert | F4, F5 |
| F7 | Code-Aufgaben & Sandbox-Auswertung | P1 | Implementiert | F5 |
| F8 | Kapitel-Abschlussquiz & Bewertung | P1 | Implementiert | F5, F6 |
| F9 | Lerner-Dashboard & Statistiken | P2 | Implementiert | F6 |
| F10 | Zertifikate / Abzeichen | P2 | Implementiert | F8 |
| F11 | Katalog: Suche, Filter, Tags | P2 | Implementiert | F2 |
| F12 | Unified Expo App (Web + iOS + Android) | P1 | Implementiert | F1–F5 |
| F13 | Erweiterungen (i18n, Diskussionen, Lernpfade) | P2 | Backlog | – |

> **Audit-Stand (2026-06-26):**
> - **F1** Rollen jetzt end-to-end funktionsfähig: Session-Token trägt `role` aus Clerk `public_metadata.role`, Backend mappt auf .NET-Rollen, UI-Gating für den Author-Tab greift. Rollenvergabe aktuell manuell (Clerk-Dashboard/CLI), In-App Admin-UI offen.
> - **F5** Quiz wird serverseitig ausgewertet (`POST /api/questions/{id}/attempt`) inkl. Score, Erklärung und Attempt-Speicherung; „Wahr/Falsch" ist ein eigener Fragetyp (`TrueFalse`) mit dedizierter Autor- und Lern-UI, serverseitig wie OneChoice über zwei Antworten (Wahr/Falsch) ausgewertet.
> - **F6** Dashboard zeigt echten Fortschritt aus `GET /api/me/progress` (abgeschlossene Inhalte + Kurse) statt Platzhalter.
> - **F7** Code-Aufgaben implementiert: Fragetyp `Code`, async `POST /api/code-submissions` → Queue → `CodeExecutionWorker` → Polling via `GET /api/code-submissions/{id}`. Eigene Sandbox über einen **rootless Podman-Sidecar** (hinter `ISandboxRunner`, gehärtet via `--network none`/Memory/CPU/PIDs-Limits, read-only FS, non-root). MVP-Sprache C#; bestandene Aufgabe schreibt einen `Attempt` (F6). Container-Isolation ist dev-only — Prod-Härtung (gVisor/Jobs) dokumentiert.
> - **F8** Kapitel-Abschlussquiz implementiert: dediziertes Quiz je Kapitel (`Chapter.ChapterQuizId`), gebündelte Abgabe via `POST /api/chapters/{id}/quiz/attempt` mit aggregiertem Score, Bestehensgrenze (`PassThresholdPercent`) und Versuchslimit (`MaxAttempts`, je Versuch ein `ChapterQuizAttempt`). Autoren legen/ersetzen Quizze im Author-Bereich an (`PUT/DELETE /api/chapters/{id}/quiz`, nur auto-bewertbare Fragetypen). Bestandenes Quiz fließt in den Kapitel-Abschluss (`Progress.PassedChapterQuizIds`, Basis für F10).
> - **F9** Lerner-Dashboard vertieft: `GET /api/me/stats` aggregiert (reiner `StatsCalculator`) Kurse aktiv/abgeschlossen, Fortschritt je Kurs (%), Quiz-Trefferquote, Kapitel-Quizze bestanden und gelöste Code-Aufgaben; das `DashboardScreen` zeigt Kennzahl-Kacheln + Kurs-Fortschrittsbalken.
> - **F10** Zertifikate implementiert: bei Kursabschluss (geteilte `CourseCompletion`-Logik: alle Inhalte + alle Kapitel-Quizze) wird idempotent ein `Certificate` ausgestellt (Namens-Snapshots, `Enrollment.CompletedAt` gesetzt) — getriggert aus Inhalt-Abschluss + Kapitel-Quiz-Abgabe. `GET /api/me/certificates`; Badges im Dashboard. Öffentliche Verifikation bewusst zurückgestellt (`VerificationCode` vorhanden).
> - **F11** Katalog implementiert: `Course` trägt jetzt `Tags[]` + `Level`; `GET /api/courses?search=&tags=&level=` filtert server-seitig (reiner `CourseCatalog`, in-memory) plus `GET /api/courses/tags` für die Filter-Chips. `CoursesScreen` hat Suchfeld (debounced) + Level-/Tag-Chips + Level-Badge/Tags je Karte; Autoren setzen Tags/Level beim Anlegen (`CreateCourseScreen`). Tags/Level nachträglich editierbar = offen.
> - **F12** Unified Expo App: Author-CMS (Kurs anlegen/bearbeiten/**publizieren** via `CreateCourseScreen`/`CourseEditorScreen`), Einschreibung (Auto-Enroll in `CourseDetailScreen`) und Quiz-Abgabe (`useSubmitAttempt`/`useSubmitChapterQuiz`/`useSubmitCode`) sind umgesetzt — die zuvor als „fehlend" gelisteten Screens existieren vollständig. Native iOS/Android sowie der k8s-Austausch des Vite-Builds laufen weiterhin über Expo.
> - **Offen:** native iOS/Android-Politur; Prod-Härtung der Sandbox (gVisor/Jobs). F1–F12 implementiert, F13 Backlog. **Test-Suiten überarbeitet:** Backend-Integrationstests (WebApplicationFactory + ephemeres Mongo), Mobile-Jest aufgeräumt/erweitert (+Coverage), tote Vite-E2E ersetzt durch Clerk+Playwright gegen Expo-Web.

---

## F1 – Authentifizierung & Rollen `P0`

**Ziel:** Nutzer registrieren/anmelden; rollenbasierter Zugriff — plattformübergreifend (Web, iOS, Android).

**Auth-Strategie: Clerk**
- Registrierung, Login, Session-Management und Token-Refresh werden vollständig von **Clerk** übernommen.
- SDKs: `@clerk/clerk-expo` für React Native/Expo Web (identische `useAuth()` / `useUser()`-Hooks auf allen Plattformen).
- Das Backend validiert eingehende JWTs ausschließlich über Clerks **JWKS-Endpunkt** — es erzeugt keine eigenen Tokens mehr.
- Kein eigener `/auth/register` oder `/auth/login`-Endpunkt; das Backend stellt nur noch `POST /api/users/sync` bereit (Clerk-Webhook, legt bei Neuregistrierung einen Nutzer-Datensatz in MongoDB an).

**Rollen** werden über `publicMetadata.role` in Clerk gesetzt:
| Clerk-Rolle | App-Rolle |
|---|---|
| `learner` | Lerner |
| `instructor` | Autor |
| `admin` | Admin |

**Backend-JWT-Validierung:**
- Issuer: Clerk Frontend API URL des Projekts
- Signatur: JWKS (`https://[clerk-domain]/.well-known/jwks.json`)
- Rolle wird aus dem `metadata.role`-Claim extrahiert

**Akzeptanzkriterien**
- Registrierung/Login über Clerk-UI funktionieren auf Web und mobil.
- Geschützte Backend-Endpunkte verlangen gültiges Clerk-JWT (401 sonst).
- Autoren-Endpunkte sind für Lerner gesperrt (403).

---

## F2 – Inhalts-Domänenmodell & Speicherung `P0`

**Ziel:** Die Hierarchie Kurs → Kapitel → Thema → Beispiel + Fragen als Datenmodell.

```
Kurs (Course)
 └─ Kapitel (Chapter)        [geordnet]
     └─ Thema (Topic)        [geordnet]
         ├─ Beispiele (Example)   [Lerninhalt: Text/Code/Bild]
         └─ Fragen (Question)     [Themen-Ebene]
     └─ Fragen (Question)         [Kapitel-Ebene, z. B. Abschlussquiz]
```

**Kern-Entitäten**
- **Course:** `id, title, slug, description, tags[], level, authorId, status (Draft/Published/Archived), createdAt, updatedAt`
- **Chapter:** `id, courseId, title, order, description`
- **Topic:** `id, chapterId, title, order`
- **Example:** `id, topicId, title, contentBlocks[] (Markdown/Code/Bild), language, order`
- **Question:** siehe F5/F7
- **User:** `id, email, displayName, passwordHash, roles[], createdAt`
- **Enrollment / Progress / Attempt:** siehe F6/F5/F7

**MongoDB-Modellierung**
- Inhalts-Hierarchie referenziert über `*Id`-Felder; Kapitel/Themen als eigene
  Collections (bei großen Kursen) oder eingebettet (für einfaches Laden).
- **Fragen** als eigene Collection (`questions`), referenziert über `chapterId`/`topicId`.
- **Lerner-Daten** (Enrollment, Progress, Attempt) immer eigene Collections.

**Akzeptanzkriterien**
- Ein Kurs mit Kapiteln/Themen/Beispielen lässt sich speichern und vollständig laden.

---

## F3 – Autoren-Bereich (Inhalts-CRUD / CMS) `P0`

**Ziel:** Autoren erstellen & pflegen Inhalte.

- CRUD für Kurs/Kapitel/Thema/Beispiel/Frage; Reihenfolge (`order`) editierbar.
- Draft → Published Workflow (Status auf Course-Ebene, ggf. je Element).
- Endpunkte: `POST /api/courses`, `PUT /api/courses/{id}`,
  `POST /api/courses/{id}/chapters`, `POST /api/chapters/{id}/topics`,
  `POST /api/topics/{id}/examples`, `POST /api/{topics|chapters}/{id}/questions`.
- Löschen (Autor/Admin): `DELETE /api/courses/{id}`, `DELETE /api/chapters/{id}`,
  `DELETE /api/content/{id}` — kaskadiert abhängige QuestionLists/Attempts/Progress/Enrollments.
- Frontend: Editor mit Vorschau, Markdown/Code-Blöcke.

**Akzeptanzkriterien**
- Autor kann einen kompletten Kurs anlegen und veröffentlichen; Lerner sehen nur Published.

---

## F4 – Lernansicht (Kurs durcharbeiten) `P0`

**Ziel:** Lerner navigieren und konsumieren Inhalte.

- Navigation Kurs → Kapitel → Thema; Beispiele als Markdown/Code (Syntax-Highlighting).
- Endpunkte: `GET /api/courses`, `GET /api/courses/{id}` (mit Kapiteln/Themen).
- Einschreibung: `POST /api/enrollments`.

**Akzeptanzkriterien**
- Lerner kann sich einschreiben und alle Themen/Beispiele eines Kurses lesen.

---

## F5 – Quiz: Choice & Wahr/Falsch `P0`

**Ziel:** Auswählbare Fragen mit sofortiger, serverseitiger Auswertung.

Gemeinsame Frage-Felder: `id, scope (Topic/Chapter), refId, prompt (Markdown), explanation, points, difficulty`

- **SingleChoice:** `options[] {id, text}`, `correctOptionId`
- **MultipleChoice:** `options[] {id, text}`, `correctOptionIds[]`
- **TrueFalse:** `correctAnswer (bool)`
- Auswertung serverseitig; `POST /api/questions/{id}/attempts` → sofortiges Feedback + `explanation`.

**Akzeptanzkriterien**
- Antwort wird korrekt als richtig/falsch bewertet; Erklärung wird nach Beantwortung angezeigt.

---

## F6 – Fortschrittsverfolgung `P1`

**Ziel:** Pro Lerner festhalten, was abgeschlossen ist.

- **Progress:** `userId, courseId, completedTopicIds[], completedChapterIds[], lastVisited`.
- **Enrollment:** `userId, courseId, status, startedAt, completedAt`.
- Endpunkt: `GET /api/me/progress`.

**Akzeptanzkriterien**
- Abgeschlossene Themen/Kapitel werden gespeichert und in der Navigation markiert.

---

## F7 – Code-Aufgaben & Sandbox-Auswertung `P1`

**Ziel:** Programmieraufgaben automatisch gegen Testfälle prüfen.

- **Code-Frage:** `language, starterCode, solutionCode (autor-intern), testCases[] {input, expectedOutput, hidden}, timeLimitMs, memoryLimitMb`.
- **Sandbox (sicherheitskritisch):** isolierte Docker-Container pro Sprache;
  Ressourcenlimits (CPU/Memory/Time), kein Netzwerk, nicht-privilegierter User,
  read-only FS + temporäres Scratch-Volume.
- **Async-Flow:** API nimmt Einreichung → Queue → Worker führt aus → Ergebnis
  (Polling oder SignalR). `GET /api/attempts/{id}` für Ergebnis.
- MVP-Sprache: zunächst eine (z. B. C#), dann erweitern.
- **Alternative für schnelleres MVP:** self-hosted **Judge0** statt eigener Sandbox.

**Akzeptanzkriterien**
- Eingereichter Code wird isoliert ausgeführt; Ergebnis = bestandene Tests/Gesamt + Laufzeit/Fehlerausgabe.

---

## F8 – Kapitel-Abschlussquiz & Bewertung `P1`

**Ziel:** Quiz am Kapitelende mit Score und Bestehensgrenze.

- Mehrere Fragen (scope=Chapter), Punkte aggregiert, Bestehensgrenze konfigurierbar.
- Wiederholbarkeit von Versuchen konfigurierbar.

**Akzeptanzkriterien**
- Lerner erhält Gesamt-Score; „bestanden/nicht bestanden" wird ermittelt.

---

## F9 – Lerner-Dashboard & Statistiken `P2`

- Übersicht: laufende/abgeschlossene Kurse, Quiz-Ergebnisse, Fortschritt in %.

## F10 – Zertifikate / Abzeichen `P2`

- Badge/Zertifikat bei Kursabschluss (abhängig von F8-Bestehensgrenze).

## F11 – Katalog: Suche, Filter, Tags `P2`

- Kursliste mit Filter (Tags, Level), Volltextsuche.

## F12 – Unified Expo App (Web + iOS + Android) `P1`

**Ziel:** Eine einzige React Native / Expo-Codebasis liefert gleichzeitig die Web-App (im Browser via `react-native-web`) und die nativen Apps (iOS/Android).

- Das bisherige Vite/Tailwind-Frontend (`frontend/`) wird durch die Expo Web-Build aus `mobile/` abgelöst.
- Auf breiten Viewports (≥ 768 px) erscheint eine Sidebar-Navigation statt Bottom Tabs.
- **Author CMS** (Kurs erstellen/bearbeiten, Kapitel/Themen-CRUD) wird als neue Screens in `mobile/src/screens/author/` implementiert — Feature-Parität zum abgelösten Vite-Frontend.
- Bereits vorhandene Screens: Kursliste, Kursdetail, Lektion, Glossar, KI-Chat, Snippets, Einstellungen, Dashboard.

**Screens — Status:**
| Screen | Priorität | Status |
|---|---|---|
| Author CMS: Kurs erstellen/publizieren | P0 | ✅ `CreateCourseScreen` + `CourseEditorScreen` (Publish) |
| Enrollment | P0 | ✅ Auto-Enroll in `CourseDetailScreen` (`useEnrollment`) |
| Quiz-Antworten absenden | P1 | ✅ `useSubmitAttempt` / `useSubmitChapterQuiz` / `useSubmitCode` |

**Akzeptanzkriterien**
- `npx expo start --web` liefert dieselbe Funktionalität wie das bisherige Vite-Frontend.
- Expo Go auf iOS/Android: Login, Kursnavigation, Lektionen, Quiz funktionieren.
- Der Vite-Frontend-Build wird im k8s-Deployment durch den Expo-Web-Build ersetzt.

## F13 – Erweiterungen (Backlog) `P2`

- Mehrsprachigkeit (i18n), Kommentare/Diskussionen, Lernpfade, Empfehlungen.

---

## Architektur (für alle Features)

**Backend (.NET 10):** ASP.NET Core Web API; Schichtung `Api → Application → Domain → Infrastructure`;
MongoDB.Driver mit Repository-Pattern; FluentValidation; Hintergrundjobs (Channel-Queue/Worker) für F7.

**Frontend (React Native + Expo):** Expo 54, React Native 0.81, react-native-web (Browser), TanStack Query, i18next, react-native-markdown-display. Logik vollständig in Hooks/API-Layer — plattformübergreifend nutzbar. Responsive Layouts via `useWindowDimensions()` (Sidebar ab 768 px).

## Offene Punkte

- Berechtigungsmodell-Details (private Lerner-Notizen?).
- Draft/Published-Granularität (ganzer Kurs vs. einzelne Elemente).
- ~~F7-Sandbox: eigene Docker-Lösung vs. Judge0.~~ → Erledigt: eigene Lösung über rootless **Podman**-Sidecar (hinter `ISandboxRunner`, austauschbar). Prod-Härtung (gVisor/k8s-Jobs) offen.
- ~~F8-Bewertung: Punkte, Bestehensgrenze, Wiederholbarkeit.~~ → Erledigt: aggregierter %-Score, konfigurierbare `PassThresholdPercent` + `MaxAttempts` je Kapitel; in-place Frage-Edit bewusst weggelassen (Anlegen + Ersetzen).
- ~~Typ-Alignment: Mobile-Typen (`Texte`, `ChapterContent`, Mehrsprachigkeit per Enum) vs. Web-Typen (`ContentBlock`, flache Strings) — müssen auf Backend-API-Response-Shape vereinheitlicht werden.~~ → Erledigt.
- Clerk-Setup: Publishable Key + JWKS-URL nach Projekt-Erstellung in `mobile/.env` und Backend-Config eintragen.

## Empfohlene Reihenfolge

**Iteration 1 (MVP):** F1 → F2 → F3 → F4 → F5
**Iteration 2:** F6 → F7 → F8
**Iteration 3:** F9 → F11 → F10 → F12 → F13
