# DevEdu

Schulungs-Applikation für Entwickler: Autoren erstellen Kurse (Kurs → Kapitel → Thema →
Beispiele), Lerner arbeiten sie durch und beantworten Fragen. Siehe [PRD.md](PRD.md) für die
vollständige Spezifikation und [docs/API_CONTRACT.md](docs/API_CONTRACT.md) für die API.

Dieser Stand umfasst **Iteration 1 (MVP, Features F1–F5)**: Auth & Rollen, Inhalts-Datenmodell,
Autoren-CRUD, Lernansicht und Quiz (Single/Multiple Choice, Wahr/Falsch).

## Stack

| Schicht | Technologie |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind, ausgeliefert via nginx |
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

Nach dem Deploy ist die App unter **http://devedu.localhost:8080** erreichbar.

> **Hinweis:** Auf Windows leitet die WSL2-Podman-VM Ports nicht automatisch
> an `localhost` weiter. `kubectl port-forward` ist der zuverlässige Weg:
>
> ```powershell
> kubectl -n devedu port-forward svc/frontend 8080:80
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

## Seed-Logins

| Rolle | E-Mail | Passwort |
|---|---|---|
| Autor | `author@devedu.local` | `Passw0rd!` |
| Lerner | `learner@devedu.local` | `Passw0rd!` |

Beim ersten Start legt das Backend diese Nutzer und einen veröffentlichten Demo-Kurs
„C# Grundlagen" an (1 Kapitel/Thema/Beispiel + 3 Fragen).

## Projektstruktur

```
backend/         .NET 10 Web-API (DevEdu.Api) + Dockerfile
frontend/        React/Vite/Tailwind SPA + nginx + Dockerfile
k8s/             Namespace, Mongo, Backend, Frontend, Ingress
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
kubectl -n devedu logs deploy/frontend
kubectl -n devedu logs deploy/mongo
.\deploy-kind.ps1 -NoBuild          # Manifeste neu anwenden, kein Build
.\deploy-kind.ps1 -DeleteCluster    # Cluster + Registry entfernen
```

```bash
# Linux
sudo k3s kubectl -n devedu get pods
sudo k3s kubectl -n devedu logs deploy/backend
sudo k3s kubectl -n devedu logs deploy/frontend
```
