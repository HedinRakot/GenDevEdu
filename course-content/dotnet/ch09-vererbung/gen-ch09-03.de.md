Manchmal soll eine abgeleitete Klasse eine geerbte Methode **anders** machen als die Basisklasse. Beispiel: Jedes Tier kann einen Laut von sich geben, aber ein Hund bellt und eine Katze miaut. Dafür gibt es das **Überschreiben** von Methoden mit `virtual` und `override`.

## `virtual` in der Basisklasse

In der Basisklasse markierst du die Methode, die überschrieben werden darf, mit dem Schlüsselwort `virtual`:

```csharp
class Tier
{
    public string Name;

    public virtual void Sprich()
    {
        Console.WriteLine(Name + " macht ein Geräusch.");
    }
}
```

`virtual` bedeutet: "Diese Methode darf von abgeleiteten Klassen ersetzt werden."

## `override` in der abgeleiteten Klasse

In der abgeleiteten Klasse schreibst du dieselbe Methode noch einmal, diesmal mit `override`:

```csharp
class Hund : Tier
{
    public override void Sprich()
    {
        Console.WriteLine(Name + " bellt: Wuff!");
    }
}

class Katze : Tier
{
    public override void Sprich()
    {
        Console.WriteLine(Name + " miaut: Miau!");
    }
}
```

## Das Ergebnis

Jede Klasse benutzt nun ihre eigene Version von `Sprich()`:

```csharp
Hund bello = new Hund();
bello.Name = "Bello";

Katze mimi = new Katze();
mimi.Name = "Mimi";

bello.Sprich();
mimi.Sprich();
```

Ausgabe:

```
Bello bellt: Wuff!
Mimi miaut: Miau!
```

## Merke dir

- `virtual` steht in der **Basisklasse**: die Methode darf überschrieben werden.
- `override` steht in der **abgeleiteten Klasse**: die Methode wird ersetzt.
- Eine abgeleitete Klasse, die nicht überschreibt, benutzt einfach die Version aus der Basisklasse.

So kann jede Klasse das gemeinsame Verhalten auf ihre eigene Art umsetzen.
