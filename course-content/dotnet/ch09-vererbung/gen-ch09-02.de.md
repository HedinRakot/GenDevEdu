Eine abgeleitete Klasse ist viel mehr als nur eine Kopie der Basisklasse. Sie kann **eigene** Felder und Methoden hinzufügen und gleichzeitig alles aus der Basisklasse weiterverwenden. Genau das macht Vererbung so nützlich.

## Basis und Erweiterung

Wir bleiben beim Beispiel `Person` und `Student`. Hier die Basisklasse:

```csharp
class Person
{
    public string Name;
    public int Alter;

    public void StellDichVor()
    {
        Console.WriteLine("Hallo, ich heiße " + Name + ".");
    }
}
```

Die abgeleitete Klasse `Student` bekommt ein eigenes Feld und eine eigene Methode:

```csharp
class Student : Person
{
    public string Studienfach;

    public void Lernen()
    {
        Console.WriteLine(Name + " lernt " + Studienfach + ".");
    }
}
```

Beachte: In der Methode `Lernen()` darfst du `Name` direkt verwenden, obwohl `Name` in `Person` steht. Geerbte Felder gehören zur abgeleiteten Klasse genauso dazu.

## Alles zusammen nutzen

```csharp
Student anna = new Student();
anna.Name = "Anna";
anna.Alter = 21;
anna.Studienfach = "Informatik";

anna.StellDichVor(); // geerbt von Person
anna.Lernen();       // eigene Methode von Student
```

Ausgabe:

```
Hallo, ich heiße Anna.
Anna lernt Informatik.
```

## Was gehört wohin?

- Was **alle** gemeinsam haben (`Name`, `Alter`, `StellDichVor`) gehört in die Basisklasse.
- Was nur für `Student` gilt (`Studienfach`, `Lernen`) gehört in die abgeleitete Klasse.

So entsteht eine saubere Struktur: Du schreibst gemeinsame Dinge nur einmal und ergänzt das Besondere dort, wo es gebraucht wird.
