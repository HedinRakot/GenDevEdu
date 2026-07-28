# next.md — Offene Punkte, Bugfixing-Plan & Ausbaustufen

Konsolidierte Liste aller offenen Aufgaben. Stand: **2026-07-28** (Branch `feature/react-native`).

Legende: ✅ erledigt · 🟡 teilweise · ⬜ offen · ⛔ blockiert.
Datei-Angaben sind `Pfad:Zeile` zum Zeitpunkt der Diagnose (vor Umsetzung ggf. neu suchen).

---

## 1. Bekannte Bugs — Status

| # | Bug | Status | Kurz |
|---|-----|--------|------|
| 1 | Abmelden funktioniert nicht | ✅ | web-sicherer `confirmDialog` (Alert.alert ist No-op im Web) |
| 2 | Scrollbar in Web-Variante fehlt | ✅ | `showScrollIndicator` (nur Web) statt `false` |
| 3 | Abschnitt abschließen + Fortschritt animieren | ⬜ | Backend liefert Completion nicht; ProgressBar statisch |
| 4 | Abmelden-Button im Menü | ✅ | Logout-Eintrag in `Sidebar.tsx` |
| 5 | Snippet-Button funktioniert nicht | ✅ | `useFocusEffect`-Refresh + web-sicherer Delete |
| 6 | Direkt zur letzten offenen Lektion springen | ⬜ | hängt an #3 (Completion-Daten) |
| 7 | Multiple-Choice als Checkboxen statt Radio | ⬜ | Marker verzweigt nur auf TrueFalse |
| 8 | Autoren: Fragen verschieben (▲/▼) | ⬜ | Muster von Inhalten kopieren |
| 9 | Neues Kapitel: Validierung + RU-Feld fehlen | ⬜ | nur DE/EN-Titel, kaum Validierung |
| 10 | Kapitel editieren/löschen | ⬜ | kein `PUT /chapters/{id}`; Delete matcht nur `Id` |
| 11 | Nach „Inhalt erstellen" auf Seite bleiben | ⬜ | `goBack()` → stattdessen Formular resetten |
| 12 | Quiz nach Fehler nicht editierbar / Validierung | ⬜ | Content wird vor gültiger Frage persistiert |
| 13 | Einheitliche Markierung selektierter Antworten | ⬜ | Abschlusstest vs. Fragenliste unterschiedlich |
| 14 | „Abschnitt abschließen" RU nicht übersetzt | ✅ | Key `quiz.markLessonComplete` in `ru.json` ergänzt |
| 15 | Gesamtfortschritt Kapitel fixen | ⬜ | zwei divergente, quizlose Formeln |
| 16 | Kapitel-Fortschritt in Liste + Quiz berücksichtigen | ⬜ | DTO trägt keine Progress-Daten |
| 17 | Web-Sidebar links, einklappbar | 🟡 | links ✅ vorhanden; „einklappbar" ⬜ offen |
| 18 | Kurse-Seite: leerer Bereich oben | ✅ | `edges={['top']}` + Padding reduziert (visuell bestätigen) |
| 19 | Login-Fehlermeldungen in richtiger Sprache | ✅ | Clerk `error.code` → `auth.errors.*` (de/en/ru) |
| 20 | Quiz in separater View, mehrere Quiz/Kapitel, Prüfung am Ende | ⬜ | großes Refactoring |
| — | Lernende/Teilnehmer werden nicht geladen (500) | ✅ | `Progress` `[BsonIgnoreExtraElements]`, Backend deployed |

Erledigte Änderungen: `tsc --noEmit` grün. **Noch nicht** end-to-end in laufender App/Web verifiziert (bei nächstem Go am Emulator + Web durchklicken).

Neue Hilfen (wiederverwendbar): `mobile/src/utils/confirm.ts` (plattformsicherer Dialog), `mobile/src/utils/clerkError.ts` (Clerk-Fehler → i18n), `showScrollIndicator` in `utils/platform.ts`.

---

## 2. Offene Bugs — Diagnose & Fix-Plan

### #17 — Web-Sidebar einklappbar
Links-Position ist erledigt (`AppTabs.tsx:86-94` rendert `Sidebar` bei `isWide`). Fehlt: Kollaps.
- Collapse-State in `Sidebar.tsx` (useState) + persistieren via `store/storage.ts` (`getJson`/`setJson`, neuer Key `SIDEBAR_COLLAPSED`).
- Toggle-Chevron in der Logo-Zeile (`chevron-left`/`chevron-right` existieren im Icon-Set).
- Breite `248 ↔ ~72`; bei collapsed: Sektions-Captions + Nutzertext + „EduCode"-Wortmarke ausblenden.
- `SidebarItem.tsx`: Prop `collapsed` → nur Icon, zentriert, `accessibilityLabel={label}`.
- **Unabhängig** von allen anderen Clustern → sofort parallelisierbar.

### #7 + #13 — Antwort-Marker (Checkboxen für Multiple-Choice, einheitlich)
Gemeinsame Ursache, gemeinsam fixen.
- `QuizOption.tsx`: Prop `marker: 'radio' | 'checkbox'` (bzw. `isMulti`) → quadratische Checkbox mit `check`-Icon bei `selected`/`correct` statt Buchstaben-Kreis.
- `LessonScreen.tsx` `ChoiceQuestionCard` (~168-179, Styles ~786-794): Marker auf `isMulti` verzweigen; idealerweise `QuizOption` wiederverwenden.
- `ChapterQuizScreen.tsx:195-201`: Fragetyp an `QuizOption` durchreichen.
- Ergebnis: OneChoice = Radio, MultipleChoice = Checkbox — in Lektion **und** Abschlusstest identisch.

### #3, #6, #15, #16 — Fortschritt (Backend + Frontend zusammenhängend)
Kernursachen: (a) Per-Content-Completion verlässt das Backend nie, (b) zwei divergente Progress-Formeln ohne Quiz-Gewichtung.
- **Backend:** `GetChapterContentAsync` (`CourseService.cs:77`) `Progress` laden; `Mappers.ToChapterContentDto` (`Mappers.cs:27`) `Completed = completedIds.Contains(elementId)`. → #3/#6.
- **Backend:** `ChapterResponseDto` (`CourseDtos.cs:20`) um `CompletedContent`/`TotalContent`/`ProgressPercent` erweitern; in `GetChaptersAsync` (`CourseService.cs:63-71`) je Kapitel `content + (quizPassed?1:0)` gewichtet berechnen. → #16.
- **Backend:** Progress-Formel vereinheitlichen: `StatsCalculator.cs:51` `Grading.Percent(completedContent + chaptersPassed, totalContent + totalChapters)`. → #15.
- **Frontend:** `LessonScreen.tsx:605` `completedIds` aus `model.chapterContent[].completed` seeden; erste unfertige Position via `findIndex(!completed)` scrollen (`initialScrollIndex`/`scrollTo`), Quiz als Fallback. → #6.
- **Frontend:** `ProgressBar.tsx:42-52` mit `Animated.Value` (timing auf `progress`). → #3-Animation.
- **Frontend:** `CourseDetailScreen.tsx:120-122` Kurs-% aus Backend statt binär `chapters.filter(completed)`; `ChapterRow` (`:67-78`) `ProgressBar` je Kapitel, 100% = grün. → #15/#16.
- Nebenbefund #3: `Questions`-Block mit `OwnAnswer`-Frage kann nie „complete" werden (`Grading.IsCorrect=false`) → nicht-autogradebare Fragen bei Submit als erledigt zählen.
- **Braucht Backend-Rebuild + Redeploy** (podman build backend → push → rollout, danach 8090-Port-Forward prüfen).

### #20 — Quiz in separater View, mehrere Quiz/Kapitel, Prüfung erst am Ende
Großes Refactoring.
- Inline-`Questions`-Blöcke aus `LessonScreen.tsx:571-587` herauslösen; je Quiz einen Link in `CourseDetailScreen` (analog vorhandenem `quizEntry` `:170-201`).
- Statt Boolean `chapter.hasQuiz` eine Quiz-Liste; `ChapterQuiz`-Route (`CoursesStack.tsx:16`) um Quiz-Id (`questionListId`/`elementId`) erweitern; durch `useChapterQuiz`/`useSubmitChapterQuiz` (`useCourses.ts:52,175,207`) + Query-Keys durchreichen.
- Prüfung deferred über `ChapterQuizScreen`-Modell (`:53-71`) statt Per-Frage-„Prüfen".
- Backend ggf. Endpoint/Discovery für mehrere Quiz je Kapitel.

### #8 — Autoren: Fragen verschieben
- ▲/▼ in `QuestionEditor.tsx` (analog `ChapterRow` `CourseEditorScreen.tsx:30-110`); lokaler Swap in `AddQuestionListScreen.tsx` + `ChapterQuizEditorScreen.tsx`. Reihenfolge = Array-Reihenfolge, wird beim vorhandenen PUT (`UpdateQuestionListAsync`) persistiert — **kein neuer Endpoint**.

### #9 — Neues Kapitel: Validierung + RU-Feld
- `AddChapterScreen.tsx`: `titelRu`-State + Input „Titel (Russisch)"; `{ text, language: 0 }` in `titelItems` (Enum: RU=0, DE=1, EN=2). `Mappers.BuildTexte` speichert es ohne Backend-Änderung.
- Validierungen: Titel-Pflicht, Maximallänge, ggf. Dublettencheck.

### #10 — Kapitel editieren/löschen
- **Editieren fehlt komplett:** `PUT /api/chapters/{id}` + `UpdateChapterAsync` (Name+Titel via `BuildTexte`, `Id/ElementId/SortOrder` erhalten) + Hook `useUpdateChapter` + Edit-Screen (`AddChapterScreen` mit optionalem `chapterId`).
- **Delete-Bug:** `DeleteChapterAsync` (`CourseService.cs:351,358`) matcht nur `ch.Id`, UI schickt `elementId` → Predicate auf `Id || ElementId` (wie Reorder). Für importierte Kapitel sonst NotFound.
- Backend-Rebuild nötig (mit Cluster #3 bündeln).

### #11 — Nach „Inhalt erstellen" bleiben
- `AddChapterContentScreen.tsx:160` non-Questions `onSuccess`: statt `navigation.goBack()` Formular resetten. Liste refetcht bereits (`useAddChapterContent` invalidiert `useChapterContent`, `useCourses.ts:251-254`). „Fertig/Zurück" bleibt als Button.

### #12 — Quiz nach Speicherfehler editierbar + Validierung
- Questions-`ChapterContent` erst persistieren, wenn ≥1 gültige Frage existiert (oder `push` statt `replace` `AddChapterContentScreen.tsx:155`, on-success `goBack` statt `navigate('AuthorCourses')` `AddQuestionListScreen.tsx:85`).
- `draftToCreateRequest` alle ungültigen Fragen melden statt beim ersten abzubrechen; Guard, dass Questions-Content auf nicht-leere, verknüpfte QuestionList auflöst.

---

## 3. Arbeitsplan (nacheinander / parallel)

Überschneidende Dateien müssen **serialisiert** werden. Kritische Sammelpunkte:
`LessonScreen.tsx` (#3,#6,#7,#13,#20), `CourseDetailScreen.tsx` (#15,#16,#20),
Backend `CourseService/Mappers/DTOs` (#3,#10,#15,#16).

**Welle 1 — sofort parallel (keine Überschneidung):**
- P1: #17 einklappbare Sidebar (`Sidebar.tsx`, `SidebarItem.tsx`, `storage.ts`)
- P2: Autoren-Frontend #8, #9, #11 (`QuestionEditor.tsx`, `AddQuestionListScreen.tsx`, `ChapterQuizEditorScreen.tsx`, `AddChapterScreen.tsx`, `AddChapterContentScreen.tsx`)

**Welle 2 — ein Backend-Batch, dann EIN Rebuild+Redeploy:**
- Backend-Teile von #3, #15, #16 (`CourseService`, `Mappers`, `CourseDtos`, `StatsCalculator`)
- Backend-Teile von #10 (`PUT /chapters/{id}`, Delete-Predicate)
- danach `podman build backend → push → rollout`, 8090-Forward prüfen

**Welle 3 — Frontend Fortschritt (nach Welle 2), serialisiert auf `LessonScreen`/`CourseDetailScreen`:**
- #3 (seed completedIds, ProgressBar-Animation), #6 (Scroll zur ersten offenen), #15/#16 (Kapitel-Progress-UI)

**Welle 4 — Quiz-UI (nach Welle 3, gleiche Dateien):**
- #7 + #13 (Marker vereinheitlichen) → dann #20 (separate View, mehrere Quiz, deferred)

**Welle 5 — Autoren-Rest:**
- #10 Edit-Screen/Hook (Frontend), #12 Quiz-Edit-Flow

Empfehlung: Wellen 1 parallel starten; jede Welle nach Umsetzung am **Emulator + Web** durchklicken (Metro :8081, Backend über adb-reverse 8080→8090) und die erledigten, noch nicht E2E-getesteten Bugs (#1,#2,#4,#5,#14,#18,#19) dabei mit verifizieren.

---

## Auth & Rollen

- **Login: Nicht-`complete`-Status behandeln** — `LoginScreen` wertet nur
  `signIn.status === 'complete'` aus; jeder andere Status fällt in den generischen
  Fehlerzweig. Auf **neuem nativem Gerät** liefert Clerk bei aktivem **Device Trust**
  `needs_client_trust` → Login schlägt trotz korrekter Credentials fehl. Workaround:
  Device Trust auf **Dev**-Instanz deaktiviert. Vor Produktion ausimplementieren
  (Code senden → Eingabe → `finalize()`); betrifft auch `needs_second_factor`/`needs_new_password`.
  (Fehler-Lokalisierung #19 ist bereits erledigt.)

## Backend / API

- **Code-Aufgaben zeigen Fehler trotz erfolgreichem Request** — `POST /api/code-submissions`
  → `202`, Polling `GET /api/code-submissions/{id}` ok, aber der Sandbox-Worker setzt
  `Status = Error`. Ursache: Sandbox-Umgebung (Podman-Sidecar + Runner-Image; nach Reboot
  Images neu pushen). Schritte: (1) Polling-Response prüfen (`outcome: InternalError` ⇒
  Cluster-Umgebung fixen), (2) in `LessonScreen`/CodeQuestionCard `errorMessage`/`outcome`
  differenziert anzeigen + Worker-Exception besser loggen, (3) optional Stub-`ISandboxRunner` für Dev.
- **Kapitel/Inhalte per Drag & Drop sortieren** — aktuell ▲/▼ (Reorder-Endpoints). Echtes
  D&D im Web als Ausbaustufe (`react-native-draggable-flatlist` web-tauglich prüfen).
- **Tags/Level nachträglich editieren** (F11) — `PUT /api/courses/{id}` (Metadaten).
- **Öffentliche Zertifikat-Verifikation** (F10) — `GET /api/certificates/{code}`; `VerificationCode` vorhanden.
- **Verwaiste Attempts** — Quiz-Bearbeitung erzeugt neue Frage-IDs, verwaist alte Attempts
  (Dashboard toleriert sie); sauberes Migrations-/Cleanup-Konzept steht aus.

## Offline-Modus (Ausbaustufe)

- **Offline-Mutations-Queue** — Queries werden persistiert/pausiert; Mutations verhalten sich
  offline sauber (Fehler statt Hänger), aber Queue-and-Sync bei Reconnect fehlt.

## Sicherheit / Sandbox (F7)

- **Prod-Härtung der Code-Sandbox** — Container-Isolation ist dev-only. Prod-Pfad (nicht gebaut):
  Jobs-Runner hinter `ISandboxRunner` + gVisor/Kata, getainteter Sandbox-Node-Pool, NetworkPolicy
  deny-all. Rootless ohne cgroup-v2-Delegation setzt `--memory` ggf. nicht durch.
- **End-to-End-Submit über die Expo-App** (Clerk-Login) für F7 noch nicht verifiziert.

## Content / i18n

- **Glossar Russisch** — 57 C#/.NET-Einträge liegen DE/EN/RU vor; RU bei Bedarf fachlich gegenlesen.
- **i18n-Vollständigkeit** — `ru.json` fiel bei #14 durch fehlenden Key auf; ein Key-Parity-Check
  (de/en/ru gleiche Keys) als kleines Skript/Test wäre sinnvoll.

## CRM

- **E-Mail-Versand** — aktuell nur Vorschau (`NoOpEmailSender`); echter SMTP-Versand via DI + Config steht aus.

## Tests / CI

- **CI-Pipeline** — GitHub Actions für `dotnet test` + `npm test` (+ optional E2E).
- **E2E erweitern** — Specs für F7/F8/F9/F10 (testIDs vorhanden).

## Backlog (F13)

- Kommentare/Diskussionen, Lernpfade, Empfehlungen.

## Produktverständnis / Design-Entscheidungen (offen)

- Berechtigungsmodell-Details (private Lerner-Notizen?).
- Draft/Published-Granularität (ganzer Kurs vs. einzelne Elemente).
