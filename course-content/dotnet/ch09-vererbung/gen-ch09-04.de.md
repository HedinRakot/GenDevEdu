Jetzt übst du Vererbung selbst. Du brauchst dafür Basisklassen, abgeleitete Klassen mit `:` sowie `virtual` und `override`.

## Aufgaben

1. **Tier, Hund und Katze**
   Erstelle eine Basisklasse `Tier` mit einem Feld `Name` und einer `virtual`-Methode `Sprich()`, die `... macht ein Geräusch.` ausgibt. Leite davon `Hund` und `Katze` ab und überschreibe `Sprich()` jeweils mit einem passenden Laut. Erzeuge ein Objekt jeder Klasse und rufe `Sprich()` auf.

2. **Eigenes Feld ergänzen**
   Erweitere die Klasse `Hund` um ein Feld `Rasse`. Gib zu einem `Hund`-Objekt sowohl den Namen, die Rasse als auch das Ergebnis von `Sprich()` aus.

3. **Fahrzeug und Auto**
   Erstelle eine Basisklasse `Fahrzeug` mit einem Feld `Marke` und einer Methode `Starten()`, die `Das Fahrzeug startet.` ausgibt. Leite eine Klasse `Auto` ab, die ein zusätzliches Feld `AnzahlTueren` hat. Erzeuge ein `Auto` und gib Marke, Türenanzahl und das Ergebnis von `Starten()` aus.

4. **Methode überschreiben**
   Mache `Starten()` in `Fahrzeug` zu einer `virtual`-Methode und überschreibe sie in `Auto`, sodass sie `Das Auto startet mit einem Brummen.` ausgibt.

5. **Mehrere Tiere in einer Liste**
   Lege eine `List<Tier>` an und füge einen `Hund` und eine `Katze` hinzu. Laufe mit einer `foreach`-Schleife über die Liste und rufe für jedes Tier `Sprich()` auf. Beobachte, dass jedes Tier seinen eigenen Laut ausgibt.
