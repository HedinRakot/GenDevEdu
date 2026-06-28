Jetzt benutzen wir einen enum in echtem Code: eine Variable anlegen, Werte vergleichen und ausgeben.

## Eine Variable vom enum-Typ

Du verwendest den enum-Namen wie jeden anderen Datentyp:

```csharp
enum Wochentag
{
    Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag
}

Wochentag heute = Wochentag.Samstag;
Console.WriteLine($"Heute ist {heute}.");   // Ausgabe: Heute ist Samstag.
```

## Vergleichen mit if

Mit `==` prüfst du, welchen Wert die Variable hat:

```csharp
if (heute == Wochentag.Samstag || heute == Wochentag.Sonntag)
{
    Console.WriteLine("Wochenende! Ausschlafen.");
}
else
{
    Console.WriteLine("Arbeitstag.");
}
// Ausgabe: Wochenende! Ausschlafen.
```

## Übersichtlich mit switch

Wenn du auf viele Werte reagieren möchtest, ist ein `switch` oft übersichtlicher als viele `if`-Blöcke:

```csharp
switch (heute)
{
    case Wochentag.Montag:
        Console.WriteLine("Neue Woche beginnt.");
        break;
    case Wochentag.Freitag:
        Console.WriteLine("Gleich Wochenende!");
        break;
    case Wochentag.Samstag:
    case Wochentag.Sonntag:
        Console.WriteLine("Wochenende.");
        break;
    default:
        Console.WriteLine("Ein normaler Arbeitstag.");
        break;
}
// Ausgabe: Wochenende.
```

Beachte: Du musst `Wochentag.` vor den Wert schreiben, damit klar ist, aus welchem enum der Wert stammt. Mit diesem Wissen kannst du Zustände in deinen Programmen sauber und sicher abbilden.
