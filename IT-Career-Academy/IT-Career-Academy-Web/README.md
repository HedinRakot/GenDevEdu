# IT Career Academy – Landingpage

React + TypeScript + Vite, umgesetzt nach dem Wireframe.

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver auf http://localhost:5173
npm run build    # Produktions-Build in dist/
```

## Struktur

```
src/
  App.tsx                 Seitenaufbau
  styles.css              Farben (CSS-Variablen), Layout, Responsive
  data/content.ts         Texte: Navigation, Erfolgsgeschichten, Vorteile
  components/
    Header.tsx            Logo, Navigation, mobiles Menü
    Hero.tsx              Hauptbereich mit CTA
    Testimonials.tsx      Erfolgsgeschichten-Slider
    Training.tsx          "So läuft das Training"
    Benefits.tsx          "Was du erwarten kannst"
    CallToAction.tsx      Abschluss-CTA
    Footer.tsx
    Icons.tsx             SVG-Icons
  assets/                 Platzhalterbilder (aus dem Wireframe ausgeschnitten)
```

## Nächste Schritte

- Bilder in `src/assets/` durch echte Fotos in hoher Auflösung ersetzen (gleiche Dateinamen).
- Links `#beratung` / `#probestunde` mit Buchungstool (z. B. Calendly) verbinden.
- Impressum- und Datenschutzseite ergänzen (Pflicht in Deutschland).
