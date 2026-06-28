Selbst erfahrene Entwickler schreiben Programme, die nicht sofort richtig funktionieren. Ein Programm tut etwas Unerwartetes, stürzt ab oder zeigt ein falsches Ergebnis. Diese Probleme nennt man **Bugs** (Fehler), und das systematische Suchen und Beheben nennt man **Debugging**.

## Was ist ein Bug?

Ein **Bug** ist ein Fehler im Code, der dazu führt, dass das Programm sich anders verhält als beabsichtigt. Der Begriff stammt aus den Anfängen der Computertechnik, als einmal tatsächlich ein Insekt einen Rechner lahmlegte. Heute meint "Bug" jeden Programmierfehler, egal ob klein oder groß.

Beispiele für Bugs:

- Eine Schleife läuft einmal zu oft.
- Eine Berechnung verwendet die falsche Variable.
- Das Programm stürzt ab, wenn der Nutzer nichts eingibt.

## Debugging ist Detektivarbeit

Beim Debugging gehst du wie ein Detektiv vor. Du hast einen Hinweis (das falsche Verhalten) und suchst systematisch nach der Ursache. Wichtig ist: Rate nicht wild herum, sondern gehe Schritt für Schritt vor:

1. **Beobachten**: Was genau passiert? Was hattest du erwartet?
2. **Eingrenzen**: In welchem Teil des Codes tritt der Fehler auf?
3. **Vermuten**: Was könnte die Ursache sein?
4. **Prüfen**: Stimmt deine Vermutung? Teste sie.
5. **Beheben**: Korrigiere den Fehler und prüfe, ob alles wieder stimmt.

## Fehlermeldungen lesen

Dein wichtigster Verbündeter ist die **Fehlermeldung**. Wenn ein Programm abstürzt, gibt C# dir oft eine genaue Beschreibung. Lies sie aufmerksam:

```text
System.FormatException: The input string 'abc' was not in a correct format.
   at Program.Main() in Program.cs:line 7
```

Diese Meldung verrät dir gleich mehrere Dinge:

- **Welcher Fehlertyp**: `FormatException` deutet auf ein Format-Problem hin.
- **Was schiefging**: Der Text `'abc'` hatte nicht das richtige Format.
- **Wo**: in `Program.cs`, Zeile 7.

Anfänger überlesen Fehlermeldungen oft, weil sie technisch aussehen. Doch genau dort steht meist schon die Lösung. In den nächsten Lektionen lernst du Werkzeuge kennen, mit denen du deinem Programm beim Laufen zusehen kannst, um Bugs noch leichter zu finden.
