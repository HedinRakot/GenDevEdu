Oft möchtest du etwas mit **jedem** Element einer Liste tun, zum Beispiel alle Namen ausgeben. Das von Hand mit `liste[0]`, `liste[1]` und so weiter zu schreiben, wäre mühsam. Stattdessen lässt du eine Schleife über die Liste laufen.

## Mit `foreach` über eine Liste

Die einfachste Variante ist `foreach`. Sie nimmt sich automatisch ein Element nach dem anderen:

```csharp
List<string> tiere = new List<string>() { "Hund", "Katze", "Maus" };

foreach (string tier in tiere)
{
    Console.WriteLine("Tier: " + tier);
}
```

Ausgabe:

```
Tier: Hund
Tier: Katze
Tier: Maus
```

Bei `foreach (string tier in tiere)` ist `tier` bei jedem Durchlauf das aktuelle Element. Du musst dich nicht um Indizes kümmern.

## Mit `for` über eine Liste

Manchmal brauchst du die Position (den Index), zum Beispiel um sie mit auszugeben. Dann nutzt du eine `for`-Schleife zusammen mit `.Count`:

```csharp
List<int> zahlen = new List<int>() { 10, 20, 30 };

for (int i = 0; i < zahlen.Count; i++)
{
    Console.WriteLine("Position " + i + ": " + zahlen[i]);
}
```

Ausgabe:

```
Position 0: 10
Position 1: 20
Position 2: 30
```

Hier läuft `i` von `0` bis kurz vor `zahlen.Count`. Mit `zahlen[i]` holst du dir das Element an der aktuellen Position.

## Wann was?

- **`foreach`**: wenn du nur die Werte brauchst (einfacher und übersichtlicher)
- **`for`**: wenn du zusätzlich die Position brauchst oder gezielt Elemente ändern möchtest

Für den Anfang ist `foreach` meist die beste Wahl.
