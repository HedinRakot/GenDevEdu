Stell dir vor, du möchtest die Namen von drei Freunden speichern. Mit dem, was du bisher kennst, würdest du drei Variablen anlegen:

```csharp
string freund1 = "Anna";
string freund2 = "Ben";
string freund3 = "Clara";
```

Das funktioniert, ist aber umständlich. Was machst du bei zehn Freunden? Oder wenn du vorher gar nicht weißt, wie viele es werden? Genau dafür gibt es **Listen**.

## Was ist eine Liste?

Eine Liste ist ein Behälter, der viele Werte des gleichen Typs aufnehmen kann. In C# heißt dieser Typ `List<T>`. Das `T` steht für den Typ der Werte, die du speichern möchtest, zum Beispiel `string` oder `int`.

## Eine Liste erstellen

So legst du eine leere Liste für Texte (`string`) an:

```csharp
List<string> freunde = new List<string>();
```

Du kannst eine Liste auch direkt mit Werten füllen:

```csharp
List<string> freunde = new List<string>() { "Anna", "Ben", "Clara" };
List<int> zahlen = new List<int>() { 3, 7, 12 };

Console.WriteLine("Die Liste enthält Freunde und Zahlen.");
Console.WriteLine(freunde[0]);
Console.WriteLine(zahlen[2]);
```

Ausgabe:

```
Die Liste enthält Freunde und Zahlen.
Anna
12
```

## Warum Listen besser sind

Mit `freunde[0]` greifst du auf das erste Element zu (die Zählung beginnt bei `0`!). Eine Liste kann beliebig wachsen, du kannst Elemente hinzufügen und entfernen, und du kannst bequem über alle Elemente laufen. Das alles lernst du in den nächsten Lektionen.

Merke dir: Eine Variable speichert **einen** Wert, eine Liste speichert **viele** Werte des gleichen Typs.
