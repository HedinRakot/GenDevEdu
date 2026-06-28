Stell dir vor, du speicherst den Wochentag als Zahl: `1` für Montag, `2` für Dienstag und so weiter. Das funktioniert – aber was bedeutet noch mal `5`? Und was passiert, wenn jemand aus Versehen `99` einträgt? Solche "magischen Zahlen" sind fehleranfällig und schwer zu lesen.

Genauso problematisch sind Texte wie `"montag"`. Ein Tippfehler (`"Montg"`) fällt erst zur Laufzeit auf, und es gibt keine feste Liste erlaubter Werte.

## Die Lösung: ein enum

Eine **Aufzählung** (englisch *enum*) ist ein eigener Datentyp mit einer **festen Menge benannter Werte**. Du legst einmal alle erlaubten Werte fest – und nur diese sind möglich.

```csharp
enum Wochentag
{
    Montag,
    Dienstag,
    Mittwoch,
    Donnerstag,
    Freitag,
    Samstag,
    Sonntag
}
```

Jetzt ist `Wochentag` ein Typ, genau wie `int` oder `string`. Die Werte haben sprechende Namen statt anonymer Zahlen.

```csharp
Console.WriteLine(Wochentag.Montag);     // Ausgabe: Montag
Console.WriteLine(Wochentag.Freitag);    // Ausgabe: Freitag
```

## Warum ist das besser?

- **Lesbar:** `Wochentag.Freitag` sagt sofort, was gemeint ist – im Gegensatz zu `5`.
- **Sicher:** Der Compiler erlaubt nur die definierten Werte. `Wochentag.Wuchtag` gibt es nicht und führt zu einem Fehler – schon beim Schreiben, nicht erst beim Ausführen.
- **Praktisch:** Die Entwicklungsumgebung schlägt dir alle möglichen Werte automatisch vor.

Im Hintergrund ist jeder enum-Wert übrigens eine Zahl (`Montag` ist `0`, `Dienstag` ist `1` …), aber im Code arbeitest du mit den klaren Namen. Wie man einen enum verwendet, schauen wir uns als Nächstes an.
