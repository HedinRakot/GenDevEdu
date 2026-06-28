Eine Liste ist erst dann nützlich, wenn du sie auch verändern kannst. Du kannst Elemente hinzufügen, auf einzelne Elemente zugreifen und Elemente wieder entfernen. Schauen wir uns die wichtigsten Werkzeuge an.

## Hinzufügen mit `.Add()`

Mit der Methode `.Add()` hängst du ein neues Element hinten an die Liste an:

```csharp
List<string> einkauf = new List<string>();
einkauf.Add("Milch");
einkauf.Add("Brot");
einkauf.Add("Äpfel");

Console.WriteLine("Etwas wurde zur Liste hinzugefügt.");
```

## Zugriff über den Index

Jedes Element hat eine Position, den sogenannten **Index**. Die Zählung beginnt bei `0`:

```csharp
Console.WriteLine(einkauf[0]); // Milch
Console.WriteLine(einkauf[1]); // Brot
Console.WriteLine(einkauf[2]); // Äpfel
```

## Wie viele Elemente? `.Count`

Mit `.Count` findest du heraus, wie viele Elemente in der Liste sind:

```csharp
Console.WriteLine("Anzahl der Einträge: " + einkauf.Count);
```

Ausgabe:

```
Anzahl der Einträge: 3
```

## Entfernen mit `.Remove()` und `.RemoveAt()`

Mit `.Remove()` entfernst du ein Element über seinen Wert, mit `.RemoveAt()` über seinen Index:

```csharp
einkauf.Remove("Brot");   // entfernt "Brot"
einkauf.RemoveAt(0);      // entfernt das Element an Position 0 (Milch)

Console.WriteLine("Übrig: " + einkauf[0]);
Console.WriteLine("Anzahl: " + einkauf.Count);
```

Ausgabe:

```
Übrig: Äpfel
Anzahl: 1
```

## Zusammengefasst

- `.Add(wert)` fügt hinten an
- `liste[index]` greift auf ein Element zu
- `.Count` gibt die Anzahl zurück
- `.Remove(wert)` entfernt nach Wert
- `.RemoveAt(index)` entfernt nach Position

Achtung: Greifst du auf einen Index zu, den es nicht gibt (zum Beispiel `einkauf[5]` bei nur 3 Elementen), stürzt das Programm ab. Prüfe im Zweifel vorher mit `.Count`.
