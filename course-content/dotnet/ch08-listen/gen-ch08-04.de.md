Jetzt bist du dran! Übe den Umgang mit Listen mit den folgenden Aufgaben. Du brauchst dafür `List<T>`, `.Add()`, den Index-Zugriff, `.Count` sowie `foreach` oder `for`.

## Aufgaben

1. **Einkaufsliste**
   Erstelle eine `List<string>` und füge mit `.Add()` mindestens vier Lebensmittel hinzu. Gib anschließend die gesamte Liste mit einer `foreach`-Schleife aus, jeweils mit dem Text `Einkaufen: ` davor.

2. **Zähle deine Liste**
   Gib mit `.Count` aus, wie viele Einträge deine Einkaufsliste hat. Entferne danach einen Eintrag mit `.RemoveAt(1)` und gib die Anzahl erneut aus.

3. **Summe einer Zahlenliste**
   Erstelle eine `List<int>` mit den Zahlen `5, 8, 2, 10`. Berechne mit einer Schleife die Summe aller Zahlen und gib das Ergebnis aus (erwartet: `25`).

4. **Das größte Element finden**
   Verwende dieselbe Zahlenliste. Finde mit einer Schleife die größte Zahl und gib sie aus. Tipp: Merke dir in einer Variablen den bisher größten Wert und vergleiche jedes Element damit.

5. **Suche in der Liste**
   Frage den Benutzer mit `Console.ReadLine()` nach einem Lebensmittel. Prüfe mit einer Schleife, ob es in deiner Einkaufsliste vorkommt, und gib `Gefunden!` oder `Nicht in der Liste.` aus.
