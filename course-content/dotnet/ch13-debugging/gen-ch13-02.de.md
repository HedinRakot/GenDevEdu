Eine Fehlermeldung sagt dir, *dass* etwas schiefging. Aber wie findest du heraus, *warum*? Hier hilft der **Debugger** von Visual Studio. Damit kannst du dein Programm anhalten und Zeile für Zeile beobachten, welche Werte deine Variablen gerade haben.

## Breakpoints setzen (F9)

Ein **Breakpoint** (Haltepunkt) ist eine Markierung an einer Codezeile. Wenn das Programm diese Zeile erreicht, hält es dort an, bevor die Zeile ausgeführt wird.

So setzt du einen Breakpoint in Visual Studio:

- Klicke in den grauen Randbereich links neben einer Codezeile, **oder**
- setze den Cursor in die Zeile und drücke **F9**.

An der Zeile erscheint dann ein roter Punkt. So weißt du, wo das Programm später anhalten wird.

## Start Debugging (F5)

Statt das Programm normal zu starten, startest du es nun mit dem Debugger. Drücke dazu **F5** (Start Debugging) oder klicke auf den grünen Pfeil.

Das Programm läuft jetzt ganz normal, bis es einen Breakpoint erreicht. Dort hält es an. Die aktuelle Zeile wird gelb markiert. Sie ist die Zeile, die als **Nächstes** ausgeführt wird, aber noch nicht gelaufen ist.

## Schritt für Schritt: Step Over (F10) und Step Into (F11)

Wenn das Programm angehalten ist, kannst du es zeilenweise weiterlaufen lassen:

- **Step Over (F10)**: Führt die aktuelle Zeile aus und hält an der nächsten Zeile an. Wenn die Zeile eine Methode aufruft, wird diese komplett ausgeführt, ohne dass du hineinschaust.
- **Step Into (F11)**: Wie Step Over, aber wenn die Zeile eine Methode aufruft, springt der Debugger **in** diese Methode hinein, damit du auch dort Zeile für Zeile schauen kannst.

So tastest du dich durch dein Programm und siehst genau, welchen Weg es nimmt.

## Variablen beobachten

Das Beste am Debugger: Während das Programm angehalten ist, kannst du die aktuellen Werte deiner Variablen sehen. Fahre einfach mit der Maus über eine Variable im Code, dann zeigt Visual Studio ihren aktuellen Wert an. Alternativ findest du unten die Fenster **Locals** (Lokale) und **Watch** (Überwachung), die alle Variablen und ihre Werte auflisten.

## Ein kleines Beispiel

```csharp
int summe = 0;
for (int i = 1; i <= 3; i++)
{
    summe = summe + i; // Breakpoint hier (F9) setzen
}
Console.WriteLine(summe);
```

Setze einen Breakpoint auf die Zeile `summe = summe + i;`, starte mit **F5** und drücke dann mehrmals **F10**. Beobachte, wie sich `i` und `summe` bei jedem Schleifendurchlauf verändern. So siehst du genau, wie die Summe Schritt für Schritt entsteht.

Mit dieser Technik findest du Bugs viel schneller, als wenn du nur den Code anstarrst.
