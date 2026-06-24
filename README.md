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
| Deployment | Kubernetes (k3s), Traefik-Ingress |
| E2E-Tests | Playwright (im Docker-Image) |

## Voraussetzungen

- Docker
- k3s (lokaler Cluster)
- `sudo`-Rechte (Cluster-Zugriff und k3s-Konfiguration laufen als root)

> Es wird **kein** lokales .NET-SDK oder Node benötigt — alle Builds und auch Playwright
> laufen in Containern.

## Schnellstart

```bash
# 1) Einmalig: lokales Registry + k3s-Konfiguration (fragt nach sudo-Passwort)
./setup-registry.sh

# 2) Bauen, pushen, auf den Cluster deployen
./deploy.sh

# 3) End-to-End-Tests gegen das Deployment
./test-e2e.sh
```

Nach dem Deploy ist die App unter **http://devedu.localhost** erreichbar.
Falls der Hostname nicht auflöst, in `/etc/hosts` ergänzen:

```
127.0.0.1   devedu.localhost
```

### Seed-Logins

| Rolle | E-Mail | Passwort |
|---|---|---|
| Autor | `author@devedu.local` | `Passw0rd!` |
| Lerner | `learner@devedu.local` | `Passw0rd!` |

Beim ersten Start legt das Backend diese Nutzer und einen veröffentlichten Demo-Kurs
„C# Grundlagen" an (1 Kapitel/Thema/Beispiel + 3 Fragen).

## Projektstruktur

```
backend/    .NET 10 Web-API (DevEdu.Api) + Dockerfile
frontend/   React/Vite/Tailwind SPA + nginx + Dockerfile
k8s/        Namespace, Mongo, Backend, Frontend, Traefik-Ingress
e2e/        Playwright-Tests (playwright.config.ts, tests/)
docs/       API_CONTRACT.md (verbindliche Schnittstelle)
```

## Scripts

| Script | Zweck |
|---|---|
| `setup-registry.sh` | Einmalig: Registry-Container `localhost:5000` + k3s `registries.yaml` + k3s-Restart |
| `deploy.sh` | Images bauen → ins Registry pushen → `k8s/` anwenden → Rollout abwarten. Flags: `--no-build`, `--build-only` |
| `test-e2e.sh` | Playwright im offiziellen Docker-Image gegen das Deployment ausführen. Override: `BASE_URL=…` |

## Nützliche Cluster-Befehle

```bash
sudo k3s kubectl -n devedu get pods
sudo k3s kubectl -n devedu logs deploy/backend
sudo k3s kubectl -n devedu logs deploy/frontend
```
