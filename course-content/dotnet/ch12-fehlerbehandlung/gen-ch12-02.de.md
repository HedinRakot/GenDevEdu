Jetzt, wo du weißt, dass Exceptions dein Programm zum Absturz bringen können, lernst du, wie du sie **abfängst**. Das Werkzeug dafür heißt `try`/`catch`. Damit kannst du riskanten Code ausprobieren und ruhig reagieren, falls etwas schiefgeht.

## Der Grundaufbau

Du legst den riskanten Code in einen `try`-Block. Wenn dort eine Exception auftritt, springt C# sofort in den `catch`-Block:

```csharp
try
{
    int zahl = int.Parse("Hallo");
    Console.WriteLine(zahl);
}
catch (Exception e)
{
    Console.WriteLine("Das war keine gültige Zahl.");
}
```

Statt eines Absturzes erscheint nun die freundliche Meldung `Das war keine gültige Zahl.`. Das Programm läuft danach normal weiter.

## Was ist `e`?

In `catch (Exception e)` ist `e` ein Objekt, das Informationen über den Fehler enthält. Besonders nützlich ist `e.Message`, die eine kurze Beschreibung des Problems liefert:

```csharp
try
{
    int zahl = int.Parse("Hallo");
}
catch (Exception e)
{
    Console.WriteLine("Fehler: " + e.Message);
}
```

## Der `finally`-Block

Manchmal möchtest du Code ausführen, **egal ob ein Fehler auftrat oder nicht**. Dafür gibt es `finally`. Dieser Block läuft immer, ganz am Ende:

```csharp
try
{
    Console.WriteLine("Ich versuche etwas...");
    int zahl = int.Parse("abc");
}
catch (Exception e)
{
    Console.WriteLine("Etwas ist schiefgegangen.");
}
finally
{
    Console.WriteLine("Dieser Teil läuft immer.");
}
```

`finally` eignet sich gut zum Aufräumen, etwa zum Schließen von Dateien.

## Praktisches Beispiel: Eingabe abfangen

Hier liest das Programm eine Eingabe vom Nutzer und behandelt eine falsche Eingabe freundlich:

```csharp
Console.Write("Gib eine Zahl ein: ");
string eingabe = Console.ReadLine();

try
{
    int zahl = int.Parse(eingabe);
    Console.WriteLine("Das Doppelte ist: " + (zahl * 2));
}
catch (FormatException)
{
    Console.WriteLine("Das war leider keine gültige Zahl.");
}
```

Beachte: Du kannst eine **bestimmte** Exception abfangen, hier `FormatException`. So reagierst du genau auf den erwarteten Fehlertyp. Gibst du `Exception` an, fängst du jede Art von Fehler ab.

Mit `try`/`catch` bleibt dein Programm stabil, auch wenn Nutzer Unerwartetes eingeben.
