Manche Fehler tauchen bei Anfängern immer wieder auf. Wenn du sie kennst, erkennst du sie schneller. Hier sind die häufigsten Bugs und wie du sie aufspürst.

## Off-by-one-Fehler in Schleifen

Ein **Off-by-one-Fehler** bedeutet: Eine Schleife läuft einmal zu oft oder einmal zu wenig. Oft liegt es am Vergleich `<` gegenüber `<=`.

```csharp
int[] zahlen = { 10, 20, 30 };
for (int i = 0; i <= zahlen.Length; i++) // Bug: <= statt <
{
    Console.WriteLine(zahlen[i]);
}
```

Das Array hat die Indizes `0`, `1` und `2`. Mit `<=` läuft die Schleife aber bis `i = 3` und greift auf `zahlen[3]` zu, das es nicht gibt. Es kommt zu einer `IndexOutOfRangeException`. Richtig ist `i < zahlen.Length`.

## `=` statt `==`

Das einfache `=` ist eine **Zuweisung**, das doppelte `==` ein **Vergleich**. Wer das verwechselt, bekommt unerwartetes Verhalten:

```csharp
int alter = 18;
if (alter == 18) // richtig: Vergleich
{
    Console.WriteLine("Genau 18.");
}
```

In C# schützt dich der Compiler oft davor, weil `if (alter = 18)` keinen gültigen Wahrheitswert ergibt. Bei `bool`-Variablen kann der Fehler aber durchrutschen. Prüfe daher immer, ob du wirklich `==` zum Vergleichen verwendest.

## Null oder leere Eingabe

`Console.ReadLine()` kann eine leere Zeichenkette zurückgeben, wenn der Nutzer nur Enter drückt. Verlässt du dich auf einen Inhalt, kann das Probleme machen:

```csharp
string name = Console.ReadLine();
Console.WriteLine("Hallo, " + name.ToUpper()); // Fehler, falls name null/leer ist
```

Prüfe deshalb die Eingabe, bevor du sie verwendest:

```csharp
string name = Console.ReadLine();
if (string.IsNullOrEmpty(name))
{
    Console.WriteLine("Du hast keinen Namen eingegeben.");
}
else
{
    Console.WriteLine("Hallo, " + name.ToUpper());
}
```

## Tracing mit `Console.WriteLine`

Manchmal brauchst du keinen Debugger, sondern fügst einfach Ausgaben ein, um zu sehen, was passiert. Das nennt man **Tracing**:

```csharp
int summe = 0;
for (int i = 1; i <= 3; i++)
{
    summe = summe + i;
    Console.WriteLine("i = " + i + ", summe = " + summe); // Trace-Ausgabe
}
```

So siehst du in der Konsole genau, wie sich die Werte entwickeln. Nach der Fehlersuche entfernst du diese Hilfsausgaben wieder.

Wenn du diese typischen Fehler im Hinterkopf hast, findest du viele Bugs schon beim ersten Durchlesen deines Codes.
