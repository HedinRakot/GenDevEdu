# next.md — Offene Punkte & geplante Ausbaustufen

Konsolidierte Liste aller offenen Aufgaben aus dem früheren `README.md`-TODO-Abschnitt
und `PRD.md` (beide zusammengeführt in `README.md`) sowie der zurückgestellten Punkte aus
der TODO-Roadmap. Stand: 2026-07-09.

## Bekannte Bugs

- **Code-Aufgaben zeigen Fehler trotz erfolgreichem Request** *(Roadmap #1, offen)* —
  `POST /api/code-submissions` → `202` und Polling `GET /api/code-submissions/{id}` sind
  beide erfolgreich, aber der asynchrone Sandbox-Worker setzt `Status = Error`
  (`CodeExecutionWorker` fängt jede Exception vom `PodmanSandboxRunner` und schreibt
  „Execution failed."). Ursache ist die Sandbox-Umgebung: der Podman-Sidecar braucht
  Socket + Runner-Image im Cluster (nach Reboot Images neu pushen). Geplante Schritte:
  1. Polling-Response inspizieren (`outcome: InternalError` ⇒ Umgebungsproblem im Cluster
     beheben: Image-Push, Sidecar-Readiness).
  2. **Robustheit unabhängig davon:** in `LessonScreen` (CodeQuestionCard) `errorMessage`/
     `outcome` differenziert anzeigen statt generischem „Fehler"; Worker-Exception besser
     loggen.
  3. Optional: Stub-`ISandboxRunner` für lokale Dev-Umgebung ohne Podman.

## Auth & Rollen

- **Login: Nicht-`complete`-Status behandeln** — `LoginScreen` wertet nur
  `signIn.status === 'complete'` aus; jeder andere Status fällt in den generischen
  „Anmeldung fehlgeschlagen"-Zweig. Auf einem **neuen nativen Gerät** liefert Clerk bei
  aktivem **Device Trust** den Status `needs_client_trust` → Login schlägt trotz korrekter
  Credentials fehl. Workaround: Device Trust auf der **Dev**-Instanz deaktiviert. Vor
  Produktion ausimplementieren (Verifizierungs-Code senden → Code-Eingabe → `finalize()`);
  betrifft ebenso `needs_second_factor` und `needs_new_password`.

## Backend / API

- **Kapitel/Inhalte sortieren — Drag & Drop** *(Roadmap #5 Ausbaustufe)* — aktuell per
  ▲/▼-Buttons gelöst (nutzen die Reorder-Endpoints). Echtes Drag & Drop auf Web als
  Ausbaustufe (Library-Web-Tauglichkeit prüfen, z. B. `react-native-draggable-flatlist`).
- **Tags/Level nachträglich editieren** (F11) — bräuchte `PUT /api/courses/{id}`
  (Metadaten). Mongo-Textindex erst bei großem Katalog.
- **Öffentliche Zertifikat-Verifikation** (F10) — `GET /api/certificates/{code}`;
  `VerificationCode` ist bereits vorhanden, additiv nachrüstbar.
- **Verwaiste Attempts** — Quiz-Bearbeitung erzeugt neue Frage-IDs und verwaist alte
  Attempts. Das Teilnehmer-Dashboard (#7) behandelt sie bereits tolerant
  (`QuestionText: null`); ein sauberes Migrations-/Cleanup-Konzept steht aus.

## Offline-Modus (F/#9 Ausbaustufe)

- **Offline-Mutations-Queue** — aktuell werden Queries persistiert und offline pausiert;
  Mutations verhalten sich offline sauber (Fehler statt Hänger), aber ein Queue-and-Sync
  bei Rückkehr der Verbindung ist noch nicht gebaut.

## Sicherheit / Sandbox (F7)

- **Prod-Härtung der Code-Sandbox** — Container-Isolation ist dev-only. Dokumentierter
  Prod-Pfad (nicht gebaut): Jobs-Runner hinter `ISandboxRunner` + **gVisor**/Kata,
  getaintetes Sandbox-Node-Pool, NetworkPolicy deny-all. Rootless ohne cgroup-v2-Delegation
  setzt `--memory` ggf. nicht auf verschachtelte Container durch.
- **End-to-End-Submit über die Expo-App** (Clerk-Login) für F7 noch nicht verifiziert.

## Content / i18n

- **Glossar Russisch** *(Roadmap #8 Ausbaustufe)* — die 57 C#/.NET-Einträge liegen in
  DE/EN/RU vor; RU-Texte bei Bedarf fachlich gegenlesen/erweitern.

## CRM

- **E-Mail-Versand** — aktuell nur Vorschau; echter Versand steht aus.

## Tests / CI

- **CI-Pipeline** — GitHub Actions für `dotnet test` + `npm test` (+ optional E2E).
- **E2E erweitern** — Specs für F7/F8/F9/F10 (testIDs sind vorhanden).

## Backlog (F13)

- Kommentare/Diskussionen, Lernpfade, Empfehlungen.

## Produktverständnis / Design-Entscheidungen (offen)

- Berechtigungsmodell-Details (private Lerner-Notizen?).
- Draft/Published-Granularität (ganzer Kurs vs. einzelne Elemente).
