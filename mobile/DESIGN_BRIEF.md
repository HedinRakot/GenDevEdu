# EduCode — Design-Brief

> Kompakter Design-Brief für die Weiterentwicklung des App-Designs (Stand: aus dem Code abgeleitet).
> Quelle der Tokens: `src/config/theme.ts` · Navigation: `src/navigation/*` · Screens: `src/screens/*`.

## 1. Was es ist
**EduCode** – mobile Lern-App für **Softwareentwicklung** („Softwareentwicklung lernen"). Kurse mit Kapiteln, Lektionen (Markdown + Code), Quizzen, KI-Tutor und Fortschritts-Tracking. Kontext: geförderte Weiterbildung/Umschulung (AZAV-konformer Anwesenheitsnachweis integriert) → Zielgruppe sind **Lernende in Weiterbildung** plus **Dozenten/Admins**. Ton aktuell: modern, freundlich, aufgeräumt, **dark-first**, Indigo/Violett.

## 2. Plattformen & Technik (Design-Constraints)
- **React Native 0.81 + Expo 54**, New Architecture. Läuft auf **Android (nativ), iOS und Web** (`react-native-web`) → Design muss von schmalem Phone bis breitem Browser skalieren (aktuell durchgehend **mobile-first, einspaltig**).
- **Icons = Emoji** (🏠 📚 🤖 📌 ⚙️ 🎓 🔥 ⚡) — kein Icon-Set. Plattform-inkonsistent → **Kandidat für einheitliches Icon-System**.
- **Schrift = System-Default** (SF/Roboto), kein Custom-Font geladen → **Branding-Chance**.
- **i18n: DE (primär), EN, RU** → Textlängen variieren stark (DE lang, RU kyrillisch); Layouts müssen Textexpansion vertragen.
- Markdown-Inhalte via `react-native-markdown-display` (Lektionen + Code-Blöcke), Cross-Platform-Shadows (`elevation`).

## 3. Rollen (steuern, was sichtbar ist)
- **Learner** (Standard): Bottom-Tabs Dashboard / Kurse / KI-Chat / Snippets / Einstellungen.
- **Author/Instructor**: zusätzlich Autoren-Bereich (Kurse anlegen/bearbeiten) + Anwesenheit — **nicht** in der Tab-Bar, sondern über Einstellungen erreichbar.
- **Admin**: zusätzlich Nutzer-/Rollenverwaltung + Anwesenheits-Zeiträume/Export.

## 4. Wichtigste Screens
**Auth:** Login, Registrieren, Passwort vergessen. *(Zentriertes Logo 🎓, Card mit Inputs, großer Primär-Button.)*

**Learner (Kern):**
- **Dashboard** 🏠 — Begrüßung, **Daily-Challenge-Card** (⚡ + „5 min"-Badge), **Lern-Streak** (🔥 aktuell/Rekord), **Gesamtfortschritt**, **Statistik** (Laufende/Abgeschlossen/Quiz-Trefferquote).
- **Kurse** 📚 — Liste → **Kursdetail** (Kapitel) → **Lektion** (Markdown + Code-Blöcke + Inline-Fragen) → **Kapitel-Quiz**; **Glossar**.
- **KI-Chat** 🤖 — kursbewusster Tutor (Gemini/RAG), **User-/AI-Chat-Bubbles**, Markdown-Antworten.
- **Snippets** 📌 — gespeicherte Code-Schnipsel.
- **Einstellungen** ⚙️ — Sprache, **Theme (Light/Dark/Auto)**, Streak-Reminder, Logout, Rollen-Bereiche.

**Author:** Autoren-Kursliste → Kurs erstellen/Editor → Kapitel/Inhalt/Fragen hinzufügen, Abschlussquiz-Editor. *(Fragetypen: OneChoice, MultipleChoice, Wahr/Falsch; Reveal-Antworten nur für Autor/Admin.)*

**Anwesenheit (AZAV, F14):** Übersicht → Lernenden-Detail; (Admin) Ausbildungszeiträume, **CSV/PDF-Export**.

**Zertifikate:** bei Kursabschluss.

## 5. Aktuelles Design-System (Tokens)
**Farben** – Tailwind-nahe Palette, dynamisch Light/Dark via `useTheme()`:

| Rolle | Light | Dark |
|---|---|---|
| Primär | `#6366F1` | `#818CF8` |
| Primär-Surface | `#EEF2FF` | `#1E1B4B` |
| Accent (Amber) | `#F59E0B` | `#FBBF24` |
| Success | `#10B981` | `#34D399` |
| Error | `#EF4444` | `#F87171` |
| Warning | `#F97316` | `#FB923C` |
| Background | `#F8FAFC` | `#0B1220` |
| Surface | `#FFFFFF` | `#0F172A` |
| Surface Elevated | `#F1F5F9` | `#1E293B` |
| Border | `#E2E8F0` | `#1F2A3D` |
| Text primär | `#0F172A` | `#F8FAFC` |
| Text sekundär | `#475569` | `#CBD5E1` |
| Text tertiär | `#94A3B8` | `#64748B` |
| Code-BG | `#0F172A` | `#020617` |

Eigene Tokens zusätzlich für **Chat-Bubbles** (user/ai), **Tab-Bar** (active/inactive/bg) und **Code-Blöcke**.

**Typografie:** Size 11 / 13 / 15 / 17 / 20 / 24 / 30 / 36 · Weight 400–800 (regular→extrabold) · LineHeight 1.2 / 1.5 / 1.75
**Spacing:** 8-pt-Grid — 4 / 8 / 16 / 24 / 32 / 48 / 64
**Radius:** 4 / 8 / 12 / 16 / 24 / 32 / `full` (Cards meist `xl` = 24)
**Shadow:** sm / md / lg (Cards nutzen `md`)
**Animation:** 150 / 250 / 400 ms

## 6. Signature-Patterns (Wiedererkennung)
- **Cards** mit `md`-Shadow, großen Radien, viel Weißraum
- **Bottom-Tab-Bar**: Emoji + Label, aktiver Tab als **Pill** (Primär-Surface-Hintergrund)
- **Primär-Button**: vollflächig Indigo, `md`-Radius, fetter Text
- **ProgressBar**, **Streak-/Statistik-Kacheln**, **Quiz-Prompt** mit Auswertungs-Feedback
- **Code-Blöcke** dunkel, monospace

## 7. Design-Entscheidungen (festgelegt)
Diese Richtung ist bewusst gewählt und soll das Redesign leiten:

- **Eigenständige Markenidentität** — weg vom „Tailwind-Default". Eigene, unverwechselbare **Farbpalette** und ein eigener **Typeface** (Custom-Font) werden entwickelt. Indigo/Slate ist **nicht** gesetzt; freie Wahl einer markentragenden Palette.
- **Keine Emojis mehr** — die Emoji-Icons (Tabs, Dashboard, Logo) werden durch ein **professionelles, konsistentes Icon-Set** ersetzt (kohärente Line-/Solid-Icons statt plattformabhängiger Emoji). Das betrifft auch Streak 🔥, Daily Challenge ⚡ und Logo 🎓 → in gestaltete Icons/Illustrationen überführen.
- **Ton: seriös-akademisch** — professionell, ruhig, dem Weiterbildungskontext angemessen. Gamification (Streak, Challenges, Trefferquote) bleibt inhaltlich erhalten, wird aber **zurückhaltend und wertig** gestaltet statt verspielt.
- **Web-Layout: responsive Sidebar** — am Desktop/Web wird die Bottom-Tab-Navigation durch eine **seitliche Sidebar-Navigation** ersetzt (mit mehr Platz für Rollen-Bereiche wie Autor/Anwesenheit/Admin). Auf dem Phone bleibt die Bottom-Tab-Bar. Breakpoint-basiertes, responsives Layout.
- **Dark Mode bleibt First-Class** — weiterhin voll gepflegter Light- **und** Dark-Modus (Auto-Umschaltung). Beide Paletten müssen in der neuen Markenidentität gleichwertig funktionieren.
- **Accessibility** (weiterhin Anforderung) — WCAG-Kontraste und ausreichende Touch-Targets, besonders im Dark-Mode und bei der neuen Palette.

> Kurzfazit für die Gestaltung: **eigenständig, professionell, seriös-akademisch; eigene Palette + eigener Font; echtes Icon-Set statt Emojis; responsive mit Sidebar am Desktop; Dark-Mode gleichwertig.**

## 8. Referenz-Dateien im Repo
- Design-Tokens: `mobile/src/config/theme.ts`
- Theme-Hook: `mobile/src/context/ThemeContext.tsx`
- Navigation: `mobile/src/navigation/` (`AppTabs`, `CoursesStack`, `AuthorStack`, `AttendanceStack`, `RootNavigator`)
- Screens: `mobile/src/screens/` (+ `author/`, `admin/`, `auth/`)
- Wiederverwendbare Komponenten: `mobile/src/components/` (`common/Card`, `common/ProgressBar`, `common/MarkdownRenderer`, `common/QuestionPrompt`, `widgets/DailyChallengeCard`)
