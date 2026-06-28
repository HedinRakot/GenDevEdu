Jetzt bist du dran! Übe das Abfangen von Fehlern mit `try`, `catch` und `finally`. Schreibe für jede Aufgabe ein kleines Programm und teste es mit verschiedenen Eingaben, auch mit absichtlich falschen.

## Aufgaben

1. **Sichere Zahleneingabe**: Schreibe ein Programm, das den Nutzer nach einer Zahl fragt und mit `Console.ReadLine()` einliest. Wandle die Eingabe mit `int.Parse` in eine Zahl um und gib sie aus. Fange mit `try`/`catch` den Fall ab, dass keine gültige Zahl eingegeben wurde, und zeige dann eine freundliche Meldung.

2. **Sichere Division**: Frage den Nutzer nach zwei Zahlen und teile die erste durch die zweite. Fange mit `catch (DivideByZeroException)` den Fall ab, dass die zweite Zahl `0` ist, und gib eine passende Meldung aus.

3. **Eingabe-Schleife**: Erweitere Aufgabe 1 so, dass das Programm so lange erneut nach einer Zahl fragt, bis der Nutzer wirklich eine gültige Zahl eingibt. Nutze dazu eine Schleife zusammen mit `try`/`catch`.

4. **`finally` ausprobieren**: Schreibe ein Programm mit einem `try`-Block, der eine fehlerhafte Eingabe verarbeitet, einem `catch`-Block und einem `finally`-Block. Gib im `finally`-Block die Nachricht `Vielen Dank für die Eingabe.` aus und überprüfe, dass sie sowohl bei richtiger als auch bei falscher Eingabe erscheint.

5. **Fehlermeldung anzeigen**: Schreibe ein Programm, das absichtlich eine Exception auslöst (zum Beispiel `int.Parse("abc")`) und im `catch`-Block die Eigenschaft `e.Message` ausgibt. Beobachte, welche Information C# dir über den Fehler liefert.
