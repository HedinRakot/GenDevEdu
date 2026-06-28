Stell dir eine Fernbedienung vor. Egal welche Marke dein Fernseher hat, es gibt immer einen Knopf zum Einschalten. Die Fernbedienung verspricht dir: "Ich habe einen Ein-Schalter." *Wie* das Gerät intern reagiert, ist dabei egal – wichtig ist nur, dass der Knopf existiert.

Genau das ist ein **Interface** (deutsch: Schnittstelle): ein **Vertrag**. Eine Klasse, die ein Interface umsetzt, verspricht, bestimmte Methoden bereitzustellen.

## Ein Interface ist nur ein Versprechen

Ein Interface beschreibt *was* eine Klasse können muss – aber nicht *wie*. Es enthält nur Methoden-Signaturen, keinen fertigen Code.

```csharp
interface ITier
{
    void MachLaut();
}
```

Das `I` am Anfang des Namens ist eine verbreitete Konvention für Interfaces (von englisch *interface*).

Hier steht: "Jedes Tier muss eine Methode `MachLaut()` haben." Wie ein Hund oder eine Katze diesen Laut macht, legt das Interface bewusst **nicht** fest. Es gibt also keinen Methoden-Rumpf mit `{ ... }`, sondern nur die Signatur mit einem Semikolon.

## Warum ist das nützlich?

Ein Interface erlaubt es dir, verschiedene Klassen gleich zu behandeln, solange sie denselben Vertrag erfüllen. So wie jede Fernbedienung einen Ein-Schalter hat, kann jedes `ITier` einen Laut machen – egal ob Hund, Katze oder Vogel.

```csharp
Console.WriteLine("Ein Interface ist ein Vertrag.");
Console.WriteLine("Es legt fest, WAS eine Klasse kann - nicht WIE.");
```

Im nächsten Abschnitt schreiben wir eine echte Klasse, die diesen Vertrag erfüllt.
