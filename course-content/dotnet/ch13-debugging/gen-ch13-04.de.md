Jetzt übst du das Debugging selbst. Für die Aufgaben brauchst du Visual Studio und ein kleines Konsolenprojekt. Probiere die Werkzeuge aus, die du kennengelernt hast: Breakpoints, F5, F10, F11 und das Beobachten von Variablen.

## Aufgaben

1. **Breakpoint setzen und beobachten**: Schreibe eine Schleife, die von `1` bis `5` zählt und in jedem Durchlauf eine Variable `summe` erhöht. Setze einen Breakpoint in die Schleife (F9), starte den Debugger (F5) und drücke mehrmals F10. Notiere, welche Werte `i` und `summe` in jedem Schritt annehmen.

2. **Off-by-one finden**: Gegeben ist diese Beschreibung eines Bugs: Eine `for`-Schleife durchläuft ein Array mit der Bedingung `i <= array.Length`. Beim Ausführen stürzt das Programm mit einer `IndexOutOfRangeException` ab. Erkläre, warum der Fehler auftritt, und schreibe die korrigierte Schleife.

3. **Vergleich oder Zuweisung**: Schau dir folgende Beschreibung an: Ein Programm soll prüfen, ob eine Zahl `gleich 10` ist, gibt aber immer denselben Zweig aus, egal welche Zahl eingegeben wird. Welcher typische Fehler könnte vorliegen? Schreibe die richtige `if`-Bedingung auf.

4. **Tracing einbauen**: Nimm ein Programm, das eine Summe oder ein Produkt in einer Schleife berechnet, und füge `Console.WriteLine`-Ausgaben ein, die in jedem Durchlauf die Zwischenwerte anzeigen. Lasse das Programm laufen und überprüfe anhand der Ausgaben, ob die Berechnung stimmt.

5. **Step Into ausprobieren**: Schreibe eine kleine Methode, zum Beispiel `int Verdoppeln(int x)`, und rufe sie aus `Main` auf. Setze einen Breakpoint auf den Aufruf, starte den Debugger und benutze F11 (Step Into), um in die Methode hineinzuspringen. Beobachte den Wert von `x` innerhalb der Methode.
