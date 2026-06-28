Programme laufen selten beim ersten Versuch perfekt. Manchmal gibt der Nutzer etwas Unerwartetes ein, eine Datei fehlt oder eine Rechnung ist nicht möglich. Damit dein Programm in solchen Situationen nicht einfach abstürzt, musst du verstehen, **was Fehler sind** und wie C# sie meldet.

## Zwei Arten von Fehlern

Es gibt grob zwei Kategorien von Fehlern:

- **Logikfehler**: Das Programm läuft ohne Absturz, macht aber etwas Falsches. Zum Beispiel berechnest du einen Durchschnitt und teilst versehentlich durch die falsche Zahl. Der Computer beschwert sich nicht, aber das Ergebnis stimmt nicht.
- **Laufzeitfehler**: Während das Programm läuft, passiert etwas, das C# nicht ausführen kann. Das Programm bricht ab und zeigt eine Fehlermeldung. Solche Laufzeitfehler nennt man in C# **Exceptions** (Ausnahmen).

## Was ist eine Exception?

Eine **Exception** ist ein Signal, das C# auslöst, wenn etwas schiefgeht. Stell dir vor, du gibst einem Programm eine Aufgabe, die es unmöglich erfüllen kann. Statt einfach falsch weiterzurechnen, "wirft" C# eine Exception (englisch *throw*) und stoppt die normale Ausführung.

## Beispiel 1: Falsche Eingabe parsen

Mit `int.Parse` kannst du Text in eine Zahl umwandeln. Aber was passiert, wenn der Text gar keine Zahl ist?

```csharp
string eingabe = "Hallo";
int zahl = int.Parse(eingabe); // Hier wird eine Exception geworfen!
Console.WriteLine(zahl);
```

`"Hallo"` lässt sich nicht in eine Zahl umwandeln. C# wirft eine `FormatException` und das Programm stürzt ab, bevor `Console.WriteLine` überhaupt erreicht wird.

## Beispiel 2: Division durch null

In der Mathematik darf man nicht durch null teilen. C# erlaubt das auch nicht:

```csharp
int a = 10;
int b = 0;
int ergebnis = a / b; // Hier wird eine DivideByZeroException geworfen!
Console.WriteLine(ergebnis);
```

Sobald C# versucht `10 / 0` zu berechnen, wird eine `DivideByZeroException` geworfen.

## Warum ist das wichtig?

Wenn eine Exception nicht behandelt wird, stürzt dein Programm ab. Das ist für Nutzer unangenehm. In den nächsten Lektionen lernst du, wie du solche Fehler mit `try` und `catch` abfangen kannst, damit dein Programm freundlich reagiert, statt einfach aufzugeben.
