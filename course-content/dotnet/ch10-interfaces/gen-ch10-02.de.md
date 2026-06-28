Wir haben gelernt, dass ein Interface ein Vertrag ist. Jetzt erfüllen wir diesen Vertrag mit einer echten Klasse.

## Den Vertrag erfüllen

Eine Klasse setzt ein Interface um, indem sie es mit einem Doppelpunkt hinter dem Klassennamen angibt und **alle** Methoden des Interfaces ausprogrammiert.

```csharp
interface ITier
{
    void MachLaut();
}

class Hund : ITier
{
    public void MachLaut()
    {
        Console.WriteLine("Wuff!");
    }
}
```

Wichtig: Die Methode muss `public` sein und genau zur Signatur im Interface passen. Vergisst du die Methode, meldet der Compiler einen Fehler – der Vertrag wäre gebrochen.

```csharp
Hund bello = new Hund();
bello.MachLaut();   // Ausgabe: Wuff!
```

## Über den Interface-Typ benutzen

Das Besondere: Du kannst eine Variable vom **Typ des Interfaces** verwenden. Sie kann jedes Objekt aufnehmen, das den Vertrag erfüllt.

```csharp
ITier meinTier = new Hund();
meinTier.MachLaut();   // Ausgabe: Wuff!
```

Die Variable `meinTier` interessiert sich nicht dafür, *welche* Klasse dahintersteckt – nur dafür, dass sie `MachLaut()` kann.

## Mehrere Klassen, ein Vertrag

Viele verschiedene Klassen können dasselbe Interface umsetzen:

```csharp
class Katze : ITier
{
    public void MachLaut()
    {
        Console.WriteLine("Miau!");
    }
}

ITier[] tiere = { new Hund(), new Katze() };

foreach (ITier tier in tiere)
{
    tier.MachLaut();
}
// Ausgabe:
// Wuff!
// Miau!
```

So kannst du ganz unterschiedliche Objekte in einer Schleife gleich behandeln – das ist die große Stärke von Interfaces.
