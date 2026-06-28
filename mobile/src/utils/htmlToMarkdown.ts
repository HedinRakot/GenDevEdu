/**
 * Wandelt das HTML des Legacy-Rich-Text-Editors (Quelle: WebSitesDesignerTool) in
 * Markdown um, damit es vom {@link MarkdownRenderer} (react-native-markdown-display)
 * formatiert dargestellt wird statt die rohen Tags (`<ul>`, `<li>`, …) anzuzeigen.
 *
 * Reihenfolge ist wichtig: Erst werden echte Tags konvertiert/entfernt, ZULETZT
 * werden HTML-Entities dekodiert. So werden entity-escapte Code-Beispiele (`&lt;`,
 * `&gt;` — im .NET-Kurs sehr häufig, z. B. `List&lt;int&gt;`) nicht versehentlich
 * als HTML-Tags interpretiert, sondern bleiben als Text `<`/`>` erhalten.
 *
 * Für reinen Markdown-/Klartext (kein `<` und kein `&`) ist die Funktion ein No-Op.
 */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ldquo: '“', // “
  rdquo: '”', // ”
  lsquo: '‘', // ‘
  rsquo: '’', // ’
  ndash: '–', // –
  mdash: '—', // —
  hellip: '…', // …
  laquo: '«', // «
  raquo: '»', // »
  middot: '·', // ·
  deg: '°', // °
  copy: '©', // ©
  reg: '®', // ®
  trade: '™', // ™
  euro: '€', // €
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => {
      const value = NAMED_ENTITIES[String(name).toLowerCase()];
      return value !== undefined ? value : match;
    });
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

export function htmlToMarkdown(input: string | null | undefined): string {
  if (!input) return '';

  // Kein HTML/keine Entities → bereits Klartext oder Markdown, unverändert lassen.
  if (!/[<&]/.test(input)) return input;

  let s = input.replace(/\r\n?/g, '\n');

  // Zeilenumbrüche
  s = s.replace(/<br\s*\/?>/gi, '\n');

  // Überschriften
  s = s.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, lvl, inner) => `\n\n${'#'.repeat(Number(lvl))} ${inner.trim()}\n\n`,
  );

  // Inline-Formatierung
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `**${inner.trim()}**`);
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `*${inner.trim()}*`);
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner) => `\`${inner.trim()}\``);
  s = s.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner) => `\n\n\`\`\`\n${inner.trim()}\n\`\`\`\n\n`);

  // Links
  s = s.replace(
    /<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, inner) => `[${inner.trim()}](${href})`,
  );

  // Bilder (Attribut-Reihenfolge ist beliebig → src/alt einzeln extrahieren)
  s = s.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (tag.match(/src=["']([^"']*)["']/i) || [])[1] || '';
    const alt = (tag.match(/alt=["']([^"']*)["']/i) || [])[1] || '';
    return src ? `![${alt}](${src})` : '';
  });

  // Reine Style-Container entfernen, Inhalt behalten
  s = s.replace(/<\/?span\b[^>]*>/gi, '');

  // Listen
  s = s.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
    let i = 0;
    const items = inner.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_mm: string, li: string) => {
      i += 1;
      return `\n${i}. ${li.trim()}`;
    });
    return `\n${items}\n`;
  });
  s = s.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) => {
    const items = inner.replace(
      /<li\b[^>]*>([\s\S]*?)<\/li>/gi,
      (_mm: string, li: string) => `\n- ${li.trim()}`,
    );
    return `\n${items}\n`;
  });

  // Block-Container → Absätze
  s = s.replace(/<\/(p|div)>/gi, '\n\n');
  s = s.replace(/<(p|div)\b[^>]*>/gi, '');

  // Restliche Tags entfernen
  s = s.replace(/<[^>]+>/g, '');

  // ZULETZT: Entities dekodieren (erst jetzt entstehen evtl. `<`/`>` aus Code-Beispielen)
  s = decodeEntities(s);

  // Whitespace aufräumen
  s = s.replace(/[ \t]+\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}
