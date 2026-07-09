# DevEdu

Schulungs-Applikation für Entwickler: **Autoren** erstellen Kurse
(Kurs → Kapitel → Inhalt → Beispiele/Fragen), **Lerner** arbeiten sie durch, lösen
Quiz- und Code-Aufgaben, und Lehrkräfte/Admins verfolgen Fortschritt und Anwesenheit.
Eine einzige Expo-Codebasis bedient Web, iOS und Android; ein .NET-10-Backend mit MongoDB
liefert die API.

Verbindliche Schnittstelle: [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).
Offene Aufgaben und geplante Ausbaustufen: [`next.md`](next.md).

> Dieses README ersetzt das frühere `PRD.md` (Feature-Spezifikation) — die
> Feature-Übersicht unten fasst den umgesetzten Stand zusammen.

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | React Native + Expo 54 / RN 0.81 / React 19 (iOS / Android / Web via react-native-web) |
| State/Data | TanStack Query (persistenter Cache), i18next (de/en/ru) |
| Backend | .NET 10 (ASP.NET Core Minimal API) |
| Datenbank | MongoDB (eingebettete Inhalts-Hierarchie, eigene Collections für Lerner-Daten) |
| Auth | Clerk (cloud, JWKS-gesichert; Rollen via `public_metadata.role`) |
| Code-Sandbox | rootless Podman-Sidecar hinter `ISandboxRunner` (F7) |
| Deployment | Kubernetes (Kind auf Windows / k3s auf Linux), nginx-Ingress |
| Tests | xUnit-Integration (EphemeralMongo), Jest (mobile), Playwright + Clerk (E2E, Expo-Web) |

## Feature-Überblick (F1–F14)

Alle Kern-Features (F1–F12, F14) sind implementiert; F13 ist Backlog.

| # | Feature | Status |
|---|---|---|
| F1 | Authentifizierung & Rollen (Clerk, `learner`/`instructor`→Author/`admin`) | ✅ |
| F2 | Inhalts-Domänenmodell (Kurs → Kapitel → Inhalt → Beispiele/Fragen) | ✅ |
| F3 | Autoren-Bereich (CRUD/CMS, Draft→Published, Löschen mit Kaskade) | ✅ |
| F4 | Lernansicht (Kurs durcharbeiten, Markdown/Code) | ✅ |
| F5 | Quiz: Single/Multiple Choice + Wahr/Falsch (serverseitig ausgewertet) | ✅ |
| F6 | Fortschrittsverfolgung (Progress/Enrollment, gewählte Antworten + Zeitstempel) | ✅ |
| F7 | Code-Aufgaben & Sandbox-Auswertung (async Queue/Worker, C#) | ✅ |
| F8 | Kapitel-Abschlussquiz (aggregierter Score, Bestehensgrenze, Versuchslimit) | ✅ |
| F9 | Lerner-Dashboard & Statistiken (`GET /api/me/stats`) | ✅ |
| F10 | Zertifikate bei Kursabschluss (idempotent, Verifizierungscode) | ✅ |
| F11 | Katalog: Suche, Filter, Tags/Level (serverseitig) | ✅ |
| F12 | Unified Expo App (Web + iOS + Android) | ✅ |
| F13 | Erweiterungen (Diskussionen, Lernpfade, Empfehlungen) | 🔜 Backlog |
| F14 | AZAV-Anwesenheits- & Aktivitätsnachweis | ✅ |

Kurzbeschreibungen der wichtigsten Features:

- **F7 – Code-Aufgaben:** Fragetyp `Code`; `POST /api/code-submissions` → `202` +
  `Channel`-Queue → `CodeExecutionWorker` (seriell, frischer DI-Scope) → Polling via
  `GET /api/code-submissions/{id}`. Ausführung in einem **rootless Podman-Sidecar**
  (`--network none`, Memory/CPU/PIDs-Limits, read-only FS, non-root). Bestandene Aufgabe
  schreibt einen `Attempt` (F6). ⚠️ Container-Isolation ist **dev-only**; Prod-Härtung
  (gVisor/Kata, Jobs-Runner, NetworkPolicy) ist dokumentiert, nicht gebaut — siehe `next.md`.
- **F9/F10:** Geteilte, reine Logik (`StatsCalculator`, `CourseCompletion`,
  `Grading`) → unit-testbar, ohne DB-Zugriff. Zertifikat mit Unique-Index
  `(UserId,CourseId)`, ausgestellt beim ersten vervollständigenden Event.
- **F14 – AZAV:** Append-only Rohevents (`attendanceevents`, 60-s-Heartbeats +
  Login/Logout) als Beweismaterial; serverseitige Sessionisierung (Gap 5 min,
  Tail-Credit 60 s) → materialisierte Tagesaggregate (`dailyattendance`). Tagesstatus
  (anwesend/teilweise/fehlend/entschuldigt) wird beim Lesen abgeleitet. Lehrer-UI
  (Tagesübersicht, Entschuldigungen), Admin (Maßnahmezeiträume, CSV/PDF-Exporte via
  QuestPDF). Zeitzone Europe/Berlin (TimeZoneConverter wegen `InvariantGlobalization`).

## Verwaltungs-Bereiche (web-only)

Die Verwaltung (Autoren-CMS, Anwesenheit, Teilnehmer-Dashboard, Admin) ist per
Platform-Gating (`Platform.OS === 'web'`, `mobile/src/utils/platform.ts`) **nur in der
Web-Version** sichtbar. Auf Native sieht ein Autor/Admin einen Hinweis „Verwaltung im
Web". Das Backend erzwingt die Rechte zusätzlich per Policy (403).

- **Autoren-CMS** — Kurse/Kapitel/Inhalte/Quiz anlegen, publizieren, per ▲/▼-Buttons
  sortieren (`PUT /api/courses/{id}/chapters/order`, `PUT /api/chapters/{id}/contents/order`).
- **Daily Challenges** — server-verwaltet (`GET /api/daily-challenges/today`, CRUD unter
  `/api/admin/daily-challenges`); Autoren-UI im Author-Bereich. Done-State/Streak bleiben
  clientseitig (AsyncStorage).
- **Teilnehmer-Dashboard** — `GET /api/admin/learners` (Übersicht: aktiv/inaktiv,
  Lernzeit, Fortschritt, Quiz-Accuracy) und `/{userId}/stats` (Detail: Kurs-/Kapitel-Zeiten
  aus Heartbeats, Engagement-Abgleich „nur abgehakt?", Falsch-Antwort-Historie, Code-Abgaben).
- **Anwesenheit (F14)** und **Rollen-Admin** (`AdminUsersScreen`, nur Admin).

## Verwandte Teilprojekte

- **`crm/`** — eigenständige Teilnehmerverwaltung (.NET-API auf `:5210` + Vite-Web auf
  `:5173`, `DevEdu.Crm.slnx`). Nutzt dieselbe Mongo (DB `devedu_crm`) über
  Kind-Port-Forward. E-Mail-Versand aktuell nur als Vorschau. Details: `crm/README.md`.
- **`sandbox/`** — Runner-Image (`csharp-runner`) + Podman-Sidecar für F7.
- **`docs/API_CONTRACT.md`** — verbindliche API-Schnittstelle.

## Voraussetzungen

### Windows (Podman + Kind)
- [Podman Desktop](https://podman-desktop.io)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

### Linux (Docker + k3s)
- Docker, k3s (lokaler Cluster), `sudo`-Rechte

> Es wird **kein** lokales .NET-SDK oder Node für das Cluster-Deployment benötigt — alle
> Builds laufen in Containern. Für die lokale Mobile-Entwicklung und Tests braucht es
> Node 18+ bzw. das .NET-10-SDK.

## Schnellstart — Windows (Podman + Kind)

```powershell
# Bauen, Registry + Kind-Cluster anlegen, deployen
.\deploy-kind.ps1

# App im Browser öffnen (Port-Forward starten + Fenster öffnen)
.\deploy-kind.ps1 -NoBuild -Forward
```

Nach dem Deploy ist die **Backend-API** unter **http://devedu.localhost:8080/api**
erreichbar. Die Expo-Web-App läuft lokal via `npx expo start --web`.

> **Hinweis:** Auf Windows leitet die WSL2-Podman-VM Ports nicht automatisch an
> `localhost` weiter. `kubectl port-forward` ist der zuverlässige Weg:
>
> ```powershell
> kubectl -n devedu port-forward svc/backend 8080:8080
> ```

Falls `devedu.localhost` nicht auflöst, als Administrator in
`C:\Windows\System32\drivers\etc\hosts` ergänzen: `127.0.0.1   devedu.localhost`.

> **Nach einem Reboot:** Die lokale Registry ist flüchtig — Container starten **und**
> Images neu pushen, sonst `ErrImagePull`.

## Schnellstart — Linux (Docker + k3s)

```bash
./setup-registry.sh   # einmalig: Registry + k3s-Konfiguration
./deploy.sh           # bauen, pushen, deployen
./test-e2e.sh         # End-to-End-Tests
```

Nach dem Deploy ist die App unter **http://devedu.localhost** erreichbar.

## Mobile App (React Native / Expo)

Die App liegt unter `mobile/` und läuft auf iOS, Android und im Browser.

```bash
cd mobile
npm install

npx expo start           # Dev-Server (QR-Code für Expo Go)
npx expo start --web     # Browser
npx expo start --android # Android
npx expo start --ios     # iOS
```

### Tests

```bash
cd mobile
npm test                 # einmalig
npm run test:watch       # watch-Modus
npm run test:coverage    # mit Coverage-Report
```

> **Auth:** läuft über **Clerk**. Vor dem ersten Start in `mobile/src/config/env.ts`
> den Clerk Publishable Key eintragen und im Backend `Clerk:Authority` setzen. Ohne
> Clerk-Key startet die App im Offline-Demo-Modus.

### Offline-Betrieb

Der TanStack-Query-Cache wird per `PersistQueryClientProvider` +
`@tanstack/query-async-storage-persister` nach AsyncStorage persistiert (`maxAge` 24 h),
sodass Kurs- und Fortschrittsdaten einen App-Neustart überstehen. Die Konnektivität wird
über `@react-native-community/netinfo` an React Querys `onlineManager` verdrahtet:
offline werden Requests pausiert und bei Rückkehr automatisch neu geladen
(`mobile/src/context/QueryProvider.tsx`). Eine Offline-Mutations-Queue ist bewusst
zurückgestellt (siehe `next.md`).

## Auth & Rollen (Clerk)

Authentifizierung läuft über **Clerk**. Nutzer registrieren sich in der App
(E-Mail + Passwort mit E-Mail-Code). **Rollen** sind Single Source of Truth in Clerk
unter `public_metadata.role`:

| `public_metadata.role` | App-Rolle | Backend-Rolle | Rechte |
|---|---|---|---|
| *(nicht gesetzt)* | Learner | `Learner` | Kurse ansehen, lernen, Quiz lösen |
| `instructor` | Author | `Author` | zusätzlich Verwaltung: Kurse/Quiz/Challenges, Anwesenheit, Teilnehmer |
| `admin` | Admin | `Admin` | zusätzlich Rollen-Admin, Maßnahmezeiträume/Exporte |

Die Rolle wird per **Session-Token-Customization**
(`{"role":"{{user.public_metadata.role}}"}`) als `role`-Claim ins JWT gelegt; das Backend
mappt sie (`instructor → Author`, `admin → Admin`, sonst `Learner`). Nach einem
Rollenwechsel neu einloggen (Clerk cached Tokens ~60 s).

**Rolle vergeben:** Clerk-Dashboard → Users → Metadata → `public_metadata = { "role": "instructor" }`,
oder in der App über den Admin-Bereich (`AdminUsersScreen`, nur Admin), oder per CLI
(unter Git Bash ggf. `MSYS_NO_PATHCONV=1` voranstellen):

```sh
clerk api /users/<user_id>/metadata -X PATCH -d '{"public_metadata":{"role":"instructor"}}'
```

Beim ersten Start legt das Backend einen veröffentlichten Demo-Kurs „C# Grundlagen" an.

### Clerk Webhook (lokal verbinden)

`POST /api/webhooks/clerk` hält die Mongo-`users`-Collection in Sync
(`user.created/updated/deleted` → `User.Roles`). Der Endpunkt ist anonym; seine Echtheit
wird über die **Svix-Signatur** gegen `Clerk:WebhookSecret` geprüft (HMAC-SHA256,
5-Minuten-Replay-Fenster, konstantzeitiger Vergleich). Bei leerem Secret wird die Signatur
**nicht** geprüft (nur Dev, mit Warn-Log).

Clerk erreicht `localhost` nicht direkt — lokal braucht es einen Tunnel:

```powershell
kubectl -n devedu port-forward svc/backend 8080:8080   # Fenster offen lassen
ngrok http 8080                                        # oder: cloudflared tunnel --url http://localhost:8080
```

Dann im **Clerk Dashboard → Webhooks → Add Endpoint**: URL
`https://<tunnel>/api/webhooks/clerk`, Events `user.created/updated/deleted` abonnieren,
Signing Secret (`whsec_…`) als `Clerk__WebhookSecret` im k8s-Secret `backend-secrets`
(`k8s/20-backend.yaml`) eintragen und neu ausrollen (`.\deploy-kind.ps1 -NoBuild`).

> ⚠️ `Clerk:SecretKey`/`Clerk:WebhookSecret` sind dev-only im k8s-Secret verdrahtet — vor
> Produktion externalisieren/rotieren.

## Projektstruktur

```
backend/         .NET 10 Web-API (DevEdu.Api) + Dockerfile
mobile/          React Native / Expo App (iOS, Android, Web)
crm/             Eigenständige Teilnehmerverwaltung (API :5210 + Vite :5173)
sandbox/         F7 Code-Runner-Image + Podman-Sidecar
k8s/             Namespace, Mongo, Backend, Ingress
e2e/             Playwright + Clerk (gegen Expo-Web)
docs/            API_CONTRACT.md (verbindliche Schnittstelle)
tests/           DevEdu.Api.Tests (xUnit Unit + Integration)
course-content/  Repo-verwaltete Kursinhalte + Übersetzungen (Overlay)
deploy-kind.ps1  Windows-Deployment: Podman + Kind
deploy.sh        Linux-Deployment: Docker + k3s
```

## Scripts

| Script | Plattform | Zweck |
|---|---|---|
| `deploy-kind.ps1` | Windows | Images bauen → Registry → Kind-Cluster → Manifeste. Flags: `-NoBuild`, `-BuildOnly`, `-DeleteCluster`, `-Forward` |
| `deploy.sh` | Linux | Images bauen → Registry → `k8s/` anwenden → Rollout. Flags: `--no-build`, `--build-only` |
| `setup-registry.sh` | Linux | Einmalig: Registry `localhost:5000` + k3s `registries.yaml` |
| `test-e2e.sh` | – | Playwright + Clerk gegen Expo-Web. Setup: `e2e/README.md`. Override: `BASE_URL=…` |
| `apply-course-content.ps1` | Windows | Repo-verwaltete DE/EN-Übersetzungen + Zusatzkapitel (idempotent, lokal) |
| `import-course.ps1` / `inspect-source.ps1` | Windows | ETL des ".NET"-Kurses aus Prod in die lokale Mongo |
| `backup-local.ps1` / `restore-local.ps1` | Windows | Lokale Mongo sichern/wiederherstellen |

## Tests

```bash
# Backend (Unit + Integration gegen EphemeralMongo — kein Cluster nötig)
dotnet test tests/DevEdu.Api.Tests

# Mobile
cd mobile && npm test
```

Backend-Integrationstests fahren die echte Minimal-API über
`WebApplicationFactory<Program>` gegen ein wegwerfbares **EphemeralMongo** hoch; Auth wird
durch ein Header-Test-Scheme ersetzt, die Podman-Sandbox durch ein deterministisches Fake.

## Nützliche Befehle

```powershell
# Windows
kubectl -n devedu get pods
kubectl -n devedu logs deploy/backend
.\deploy-kind.ps1 -NoBuild          # Manifeste neu anwenden, kein Build
.\deploy-kind.ps1 -DeleteCluster    # Cluster + Registry entfernen
```

```bash
# Linux
sudo k3s kubectl -n devedu get pods
sudo k3s kubectl -n devedu logs deploy/backend
```
