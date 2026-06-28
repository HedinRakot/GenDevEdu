Zeit zum Üben! Mit diesen Aufgaben festigst du, wie man Interfaces definiert und umsetzt. Schreibe deinen Code in einer Konsolenanwendung und teste die Ausgabe.

1. **Das Interface `IForm`**
   Definiere ein Interface `IForm` mit einer Methode `double Flaeche()`, die den Flächeninhalt zurückgibt.

2. **Kreis umsetzen**
   Schreibe eine Klasse `Kreis : IForm`. Sie soll ein Feld oder eine Eigenschaft `Radius` haben und in `Flaeche()` den Wert `3.14159 * Radius * Radius` zurückgeben. Erstelle einen Kreis mit Radius 5 und gib seine Fläche mit `Console.WriteLine` aus.

3. **Rechteck umsetzen**
   Schreibe eine zweite Klasse `Rechteck : IForm` mit `Breite` und `Hoehe`. In `Flaeche()` soll `Breite * Hoehe` zurückgegeben werden. Gib die Fläche eines Rechtecks (z. B. 4 x 3) aus.

4. **Alle Formen in einer Schleife**
   Lege ein Array `IForm[]` an, das einen Kreis und ein Rechteck enthält. Durchlaufe es mit `foreach` und gib für jede Form die Fläche aus.

5. **Eine weitere Form (Zusatz)**
   Erweitere dein Programm um eine Klasse `Quadrat : IForm` mit einer `Seitenlaenge`. Füge auch dieses Objekt deinem Array hinzu und prüfe, dass die Schleife unverändert funktioniert.
