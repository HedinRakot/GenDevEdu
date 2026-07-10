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
| Plattform | Web-App + React Native (Mobile, Lerner-Flow) |
| Frontend | React + Tailwind CSS |
| Backend | .NET 10 (ASP.NET Core Web API) |
| Datenbank | MongoDB |
| Nutzerrollen | Lerner + Autoren, mit Login & Fortschrittsverfolgung |
| Fragetypen | Single/Multiple Choice, Wahr/Falsch, Code-Aufgaben |
| Code-Auswertung | Automatisch via Tests in isolierter Sandbox |

## Feature-Übersicht

| # | Feature | Priorität | Status | Abhängig von |
|---|---|---|---|---|
| F1 | Authentifizierung & Rollen | P0 | ✅ Fertig | – |
| F2 | Inhalts-Domänenmodell & Speicherung | P0 | ✅ Fertig | – |
| F3 | Autoren-Bereich (Inhalts-CRUD/CMS) | P0 | ✅ Fertig | F1, F2 |
| F4 | Lernansicht (Kurs durcharbeiten) | P0 | ✅ Fertig | F2 |
| F5 | Quiz: Choice & Wahr/Falsch | P0 | ✅ Fertig | F2, F4 |
| F6 | Fortschrittsverfolgung | P1 | ✅ Fertig | F4, F5 |
| F7 | Code-Aufgaben & Sandbox-Auswertung | P1 | Geplant | F5 |
| F8 | Kapitel-Abschlussquiz & Bewertung | P1 | ✅ Fertig | F5, F6 |
| F9 | Lerner-Dashboard & Statistiken | P2 | Geplant | F6 |
| F10 | Zertifikate / Abzeichen | P2 | Geplant | F8 |
| F11 | Katalog: Suche, Filter, Tags | P2 | Geplant | F2 |
| F12 | Mobile-App (React Native) | P2 | ⚠️ Teilweise | F1–F8 |
| F13 | Erweiterungen (i18n, Diskussionen, Lernpfade) | P2 | Backlog | – |

---

## F1 – Authentifizierung & Rollen `P0` ✅ Fertig

**Ziel:** Nutzer registrieren/anmelden; rollenbasierter Zugriff.

- Rollen: **Lerner**, **Autor**, **Admin** (RBAC; ein Nutzer kann mehrere Rollen haben).
- JWT-basiert (Access + Refresh Token), Passwort-Hashing (ASP.NET Core PasswordHasher).
- Endpunkte: `POST /api/auth/register | /login | /refresh`.

**Akzeptanzkriterien**
- Registrierung/Login funktionieren; geschützte Endpunkte verlangen gültiges Token.
- Autoren-Endpunkte sind für Lerner gesperrt (403).

**Implementiert:** BCrypt-Passwort-Hashing, JWT Access Token (60 min) + Refresh Token mit Rotation (14 Tage, in MongoDB gespeichert), RBAC-Policy `AuthorOrAdmin`. Seed-Nutzer: `author@devedu.local` / `learner@devedu.local` (Passwort `Passw0rd!`). Frontend: Login- und Registrierungsseite mit Weiterleitung.

---

## F2 – Inhalts-Domänenmodell & Speicherung `P0` ✅ Fertig

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

**Implementiert:** Hierarchie als eingebettete MongoDB-Dokumente (Chapters/Topics/Examples im Course-Dokument), Questions als eigene Collection mit `topicId`/`chapterId`-Referenzen. Lerner-Daten (Enrollment, Progress mit ChapterQuizResults, Attempt, RefreshToken) als separate Collections. Seeder legt Demo-Kurs „C# Grundlagen" an.

---

## F3 – Autoren-Bereich (Inhalts-CRUD / CMS) `P0` ✅ Fertig

**Ziel:** Autoren erstellen & pflegen Inhalte.

- CRUD für Kurs/Kapitel/Thema/Beispiel/Frage; Reihenfolge (`order`) editierbar.
- Draft → Published Workflow (Status auf Course-Ebene, ggf. je Element).
- Endpunkte: `POST /api/courses`, `PUT /api/courses/{id}`,
  `POST /api/courses/{id}/chapters`, `POST /api/chapters/{id}/topics`,
  `POST /api/topics/{id}/examples`, `POST /api/{topics|chapters}/{id}/questions`.
- Frontend: Editor mit Vorschau, Markdown/Code-Blöcke.

**Akzeptanzkriterien**
- Autor kann einen kompletten Kurs anlegen und veröffentlichen; Lerner sehen nur Published.

**Implementiert:** Alle Backend-Endpunkte vollständig (Kurs anlegen/aktualisieren, publizieren, Kapitel/Thema/Beispiel/Fragen hinzufügen, Eigentümerprüfung). Frontend: `/courses/:id/edit` – vollständiger Kurs-Editor mit Kursbaum-Ansicht; Kapitel, Themen, Beispiele (Markdown + Code-Blöcke) und Fragen (TrueFalse/Single/MultipleChoice inkl. Kapitelquiz-Fragen) per Inline-Formular hinzufügbar. Nach Kurserstellung automatische Weiterleitung zum Editor. „Bearbeiten"-Button auf jeder Kurskarte.

---

## F4 – Lernansicht (Kurs durcharbeiten) `P0` ✅ Fertig

**Ziel:** Lerner navigieren und konsumieren Inhalte.

- Navigation Kurs → Kapitel → Thema; Beispiele als Markdown/Code (Syntax-Highlighting).
- Endpunkte: `GET /api/courses`, `GET /api/courses/{id}` (mit Kapiteln/Themen).
- Einschreibung: `POST /api/enrollments`.

**Akzeptanzkriterien**
- Lerner kann sich einschreiben und alle Themen/Beispiele eines Kurses lesen.

**Implementiert:** Kursliste mit Rollensichtbarkeit (Lerner sehen nur Published), Kursdetailseite mit Sidebar-Navigation (Kapitel → Themen → Kapitelquiz), Beispiele als Markdown-/Code-Blöcke, Einschreiben-Button (idempotent).

---

## F5 – Quiz: Choice & Wahr/Falsch `P0` ✅ Fertig

**Ziel:** Auswählbare Fragen mit sofortiger, serverseitiger Auswertung.

Gemeinsame Frage-Felder: `id, scope (Topic/Chapter), refId, prompt (Markdown), explanation, points, difficulty`

- **SingleChoice:** `options[] {id, text}`, `correctOptionId`
- **MultipleChoice:** `options[] {id, text}`, `correctOptionIds[]`
- **TrueFalse:** `correctAnswer (bool)`
- Auswertung serverseitig; `POST /api/questions/{id}/attempts` → sofortiges Feedback + `explanation`.

**Akzeptanzkriterien**
- Antwort wird korrekt als richtig/falsch bewertet; Erklärung wird nach Beantwortung angezeigt.

**Implementiert:** Alle drei Fragetypen auf Backend und Frontend. Serverseitige Auswertung speichert Attempt-Dokument. Korrekte Antworten werden Lernern nie ausgespielt (DTO-Projektion). Frontend: QuestionItem-Komponente mit Radio-/Checkbox-Eingaben und Feedback-Anzeige.

---

## F6 – Fortschrittsverfolgung `P1` ✅ Fertig

**Ziel:** Pro Lerner festhalten, was abgeschlossen ist.

- **Progress:** `userId, courseId, completedTopicIds[], completedChapterIds[], lastVisited`.
- **Enrollment:** `userId, courseId, status, startedAt, completedAt`.
- Endpunkt: `GET /api/me/progress`.

**Akzeptanzkriterien**
- Abgeschlossene Themen/Kapitel werden gespeichert und in der Navigation markiert.

**Implementiert:** `POST /api/topics/{id}/complete` markiert Thema als erledigt; Kapitel wird automatisch abgeschlossen wenn alle Themen fertig sind. `GET /api/me/progress` gibt CompletedTopicIds, CompletedChapterIds und ChapterQuizResults zurück. Frontend lädt Fortschritt beim Seitenaufruf und zeigt ✓-Markierungen persistent.

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

## F8 – Kapitel-Abschlussquiz & Bewertung `P1` ✅ Fertig

**Ziel:** Quiz am Kapitelende mit Score und Bestehensgrenze.

- Mehrere Fragen (scope=Chapter), Punkte aggregiert, Bestehensgrenze konfigurierbar.
- Wiederholbarkeit von Versuchen konfigurierbar.

**Akzeptanzkriterien**
- Lerner erhält Gesamt-Score; „bestanden/nicht bestanden" wird ermittelt.

**Implementiert:** `POST /api/chapters/{id}/quiz/submit` bewertet alle Antworten in einem Schritt, speichert Ergebnis in Progress (überschreibt bei Wiederholung). Bestehensgrenze 70 % (fest). Frontend: ChapterQuizView-Komponente zeigt alle Fragen auf einmal, nach Einreichung Score + Bestanden/Nicht-bestanden-Badge + Feedback pro Frage. Sidebar-Eintrag „Kapitelquiz" nur für Kapitel mit chapter-scoped Fragen sichtbar; zeigt ✓ bei Bestehen.

---

## F9 – Lerner-Dashboard & Statistiken `P2`

- Übersicht: laufende/abgeschlossene Kurse, Quiz-Ergebnisse, Fortschritt in %.

## F10 – Zertifikate / Abzeichen `P2`

- Badge/Zertifikat bei Kursabschluss (abhängig von F8-Bestehensgrenze).

## F11 – Katalog: Suche, Filter, Tags `P2`

- Kursliste mit Filter (Tags, Level), Volltextsuche.

## F12 – Mobile-App (React Native) `P2` ⚠️ Teilweise

- Wiederverwendung des API-/Logik-Layers (Hooks) aus dem Web-Frontend.

**Implementiert:** Expo-Projekt in `rn-app/` mit vollständigem Lerner-Flow.

Geteilte Logik (keine Änderungen nötig):
- `src/types.ts` — identisch zur Web-Version
- `src/api.ts` — identisch zur Web-Version (nach `configureApi`-Abstraktion); `BASE_URL` auf Backend zeigen
- `src/hooks/useCourseList.ts` + `useCourseDetail.ts` — 1:1 übernommen

RN-spezifische Anpassungen:
- `src/auth.ts` — In-Memory-Cache + AsyncStorage; `getToken`/`clearAuth` bleiben synchron, damit `api.ts` portierbar bleibt
- `App.tsx` — `loadAuth()` beim Start, `configureApi({ onUnauthorized })`, `NavigationContainer` mit konditionellem Auth-Stack

Screens:
| Screen | Inhalt |
|---|---|
| `LoginScreen` | E-Mail/Passwort-Formular, `api.login()` + `storeAuth()` |
| `CoursesScreen` | `FlatList` der Kurskarten, Pull-to-Refresh via `useCourseList` |
| `CourseDetailScreen` | `SectionList` (Kapitel → Themen), Einschreiben-Button, ✓-Markierungen |
| `TopicScreen` | Markdown + Code-Blöcke (react-native-markdown-display), Fragen mit vollem Interaktionsflow (TrueFalse/Single/Multi), „Als erledigt markieren" |

Web-Anpassungen (ermöglichen die Portierbarkeit):
- `api.ts` — `window.location.href` ersetzt durch `configureApi({ onUnauthorized })` — kein Web-spezifischer Code mehr
- `App.tsx` — ruft `configureApi` beim Mount mit React Router `navigate` auf

**Noch offen (RN):**
- Kapitelquiz-Screen (ChapterQuizView-Äquivalent für Mobile)
- Registrierungs-Screen
- Autoren-Editor (bewusst web-only; Mobile ist Lerner-fokussiert)

## F13 – Erweiterungen (Backlog) `P2`

- Mehrsprachigkeit (i18n), Kommentare/Diskussionen, Lernpfade, Empfehlungen.

---

## Architektur (für alle Features)

**Backend (.NET 10):** ASP.NET Core Web API; Schichtung `Api → Application → Domain → Infrastructure`;
MongoDB.Driver mit Repository-Pattern; FluentValidation; Hintergrundjobs (Channel-Queue/Worker) für F7.

**Frontend (React + Tailwind):** Vite, React Router, react-markdown. Extrahierte Hooks: `useCourseList` (Kursliste + anlegen), `useCourseDetail` (Kursdetail + Fortschritt + Einschreiben + Quiz). `api.ts` plattformagnostisch via `configureApi({ onUnauthorized })`.

**Mobile (React Native / Expo):** `rn-app/` — eigenständiges Expo-Projekt. `types.ts`, `api.ts`, `hooks/` aus Web übernommen ohne Änderungen. `auth.ts` nutzt In-Memory-Cache + AsyncStorage. Navigation via `@react-navigation/native-stack`. Markdown-Rendering via `react-native-markdown-display`.

## Offene Punkte

- F7-Sandbox: eigene Docker-Lösung vs. Judge0 (Judge0 empfohlen für schnelleres MVP).
- F8-Bestehensgrenze aktuell fest auf 70 % — konfigurierbar machen?
- F3: Inhalte bearbeiten/löschen und Reihenfolge per Drag-and-drop noch nicht implementiert.
- F12 (RN): Kapitelquiz-Screen, Registrierungs-Screen noch offen.

## Empfohlene Reihenfolge

**Iteration 1 (MVP):** F1 → F2 → F3 → F4 → F5 — ✅ abgeschlossen
**Iteration 2:** F6 → F8 → F3-UI → F7 — F6 + F8 + F3 ✅ fertig; F7 offen
**Iteration 3:** F9 → F11 → F10 → F7 → F12-Rest (Quiz + Registrierung) → F13
