# Teilnehmerverwaltung (CRM-Cockpit)

Eigenständiges CRM zur Verwaltung von Ausbildungs-Teilnehmern, die über die
Agentur für Arbeit (Bildungsgutschein) kommen. Komplett unabhängig von der
DevEdu-App — dieser Ordner kann unverändert in ein eigenes Repository
verschoben werden.

## Aufbau

```
crm/
├── DevEdu.Crm.slnx     # Solution (API + Tests)
├── api/                # ASP.NET Core Minimal API (.NET 10, MongoDB)
├── tests/              # xUnit-Tests (Integration via EphemeralMongo)
├── web/                # React + Vite + TypeScript (deutsche UI)
└── dev.ps1             # startet API + Web parallel
```

## Fachliches Modell

Teilnehmer durchlaufen eine Pipeline:

1. **Erstgespräch**
2. **Eignungstest**
3. **Bildungsgutschein beantragt**
4. **Bildungsgutschein genehmigt**
5. **Ausbildung gestartet**

plus Terminalzustände **Abgebrochen** / **Abgelehnt**. Jeder Phasenwechsel wird
mit Zeitstempel und optionaler Notiz in der Status-Historie festgehalten.
Pro Teilnehmer gibt es ein Aktivitäten-Log (Notiz/Anruf/E-Mail) und eine
Willkommens-E-Mail-Vorschau auf Basis einer bearbeitbaren Vorlage mit
`{{platzhalter}}`-Syntax.

**E-Mail-Versand:** In v1 nur Vorschau (Zwischenablage / mailto-Link). Die
`IEmailSender`-Abstraktion (`api/Services/Email/`) erlaubt später einen echten
SMTP-Sender per DI-Registrierung, ohne Endpoints oder Frontend anzufassen.

**Auth:** keine (internes Tool, v1).

## Entwicklung

Voraussetzungen: .NET 10 SDK, Node ≥ 20.19, MongoDB auf `localhost:27017`
(eigene Datenbank `devedu_crm` — kollidiert nicht mit `devedu`).

```powershell
# beides parallel starten:
.\dev.ps1

# oder einzeln:
dotnet run --project api        # API → http://localhost:5210
cd web; npm install; npm run dev  # Web → http://localhost:5173 (proxied /api → :5210)
```

## Tests

```powershell
dotnet test DevEdu.Crm.slnx     # Backend (34 Tests, EphemeralMongo — lädt beim
                                # ersten Lauf mongod-Binaries herunter)
cd web; npm test                # Frontend (Vitest + React Testing Library)
```

## API-Überblick

| Methode | Route | Zweck |
|---|---|---|
| GET | `/api/participants?phase=&search=` | Liste (Filter/Suche) |
| POST/GET/PUT/DELETE | `/api/participants[/{id}]` | CRUD |
| POST | `/api/participants/{id}/phase` | Phasenwechsel (+ Historie) |
| GET/POST/DELETE | `/api/participants/{id}/activities[/{activityId}]` | Aktivitäten-Log |
| GET/PUT | `/api/email-templates/welcome` | Vorlage lesen/ändern |
| GET | `/api/participants/{id}/welcome-email` | gerenderte Vorschau |
| POST | `/api/participants/{id}/welcome-email/send` | v1: Vorschau-Modus (`sent=false`) |
| GET | `/api/dashboard` | Zähler pro Phase |
