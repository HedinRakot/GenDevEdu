# Design-Tokens (kanonisch)

`tokens.json` ist die **einzige Quelle der Wahrheit** für die Marken-Palette, Typografie und
Spacing-/Radius-Skalen von EduCode („Akademie"-Richtung).

Es gibt **keinen Build-Schritt**. Die zwei Konsumenten werden von Hand daraus reflektiert:

| Fläche | Datei | Form |
|---|---|---|
| Mobile (React Native/Expo) | `mobile/src/config/theme.ts` | TS-Objekte (`lightColors`/`darkColors`, `Spacing`, …) |
| Web/CRM (Vite) | `crm/web/src/styles.css` | CSS Custom Properties in `:root` (+ `:root[data-theme="dark"]`) |
| Phase-Farben (nur CRM) | `crm/web/src/domain/phases.ts` | `PHASE_COLORS` |

**Regel:** Farb-/Skalenwerte immer **zuerst hier** ändern, dann in die beiden Dateien übertragen.

## Warum kein Style Dictionary / npm-Package?
Das Repo hat kein JS-Workspace; Mobile und crm/web sind eigenständige npm-Projekte. Für zwei
Flächen mit unterschiedlichen Zielformaten (RN-`StyleSheet` px vs. CSS-Variablen) ist eine
handgepflegte JSON pragmatischer. Sie ist bereits SD-förmig – ein späterer Umstieg auf Style
Dictionary (Targets `.ts` + `.css`) wäre nicht-brechend.

## Drift-Check (optional, CI)
Primär-/Accent-Hex sollten in beiden Flächen mit `tokens.json` übereinstimmen:
`primary(light) = #4A2B57`, `accent = #C98B62`, `primary(dark) = #C98B62`.
