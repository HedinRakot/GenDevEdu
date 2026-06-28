Du hast bereits Klassen kennengelernt, zum Beispiel eine Klasse `Person`. Stell dir nun vor, du brauchst auch eine Klasse `Student`. Ein Student **ist** im Grunde eine Person, hat aber zusätzlich noch eine Matrikelnummer. Müsstest du jetzt alles aus `Person` (Name, Alter) noch einmal abtippen? Nein! Genau hier hilft die **Vererbung**.

## Die Idee der Vererbung

Bei der Vererbung gibt es eine **Basisklasse** (auch Oberklasse genannt) und eine **abgeleitete Klasse** (auch Unterklasse). Die abgeleitete Klasse erbt alle Felder und Methoden der Basisklasse und kann eigene hinzufügen.

Eine gute Faustregel ist der "ist ein"-Satz:

- Ein Student **ist eine** Person.
- Ein Hund **ist ein** Tier.
- Ein Auto **ist ein** Fahrzeug.

Wenn dieser Satz Sinn ergibt, passt Vererbung gut.

## Ein Beispiel

Zuerst die Basisklasse `Person`:

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

Nun die abgeleitete Klasse `Student`. Das `:` bedeutet "erbt von":

```csharp
class Student : Person
{
    public string Matrikelnummer;
}
```

Obwohl `Student` selbst nur `Matrikelnummer` enthält, hat ein Student auch `Name`, `Alter` und die Methode `StellDichVor()` geerbt:

```csharp
Student s = new Student();
s.Name = "Anna";
s.Alter = 21;
s.Matrikelnummer = "12345";

s.StellDichVor();
Console.WriteLine("Matrikelnummer: " + s.Matrikelnummer);
```

Ausgabe:

```
Hallo, ich heiße Anna.
Matrikelnummer: 12345
```

## Warum das praktisch ist

Vererbung spart Schreibarbeit und vermeidet Wiederholung. Gemeinsame Eigenschaften stehen einmal in der Basisklasse, Besonderheiten kommen in die abgeleiteten Klassen. In den nächsten Lektionen baust du eigene abgeleitete Klassen.
