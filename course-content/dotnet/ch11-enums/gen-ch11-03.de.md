Übe jetzt selbst, eigene Aufzählungen zu definieren und zu verwenden. Schreibe deinen Code in einer Konsolenanwendung und teste die Ausgaben.

1. **Ampel-enum**
   Definiere einen enum `Ampel` mit den Werten `Rot`, `Gelb` und `Gruen`. Lege eine Variable an und weise ihr `Ampel.Rot` zu. Gib den Wert mit `Console.WriteLine` aus.

2. **Reaktion mit switch**
   Schreibe einen `switch` über deine Ampel-Variable: Bei `Rot` soll "Stopp!" ausgegeben werden, bei `Gelb` "Achtung!" und bei `Gruen` "Fahren!".

3. **Bestellstatus**
   Definiere einen enum `Bestellstatus` mit `Offen`, `Bezahlt`, `Versandt` und `Geliefert`. Lege eine Variable mit dem Wert `Bestellstatus.Versandt` an und prüfe mit einem `if`, ob die Bestellung schon `Geliefert` ist. Gib eine passende Meldung aus.

4. **Mehrere Bestellungen**
   Erstelle ein Array `Bestellstatus[]` mit mehreren Werten. Durchlaufe es mit `foreach` und gib für jeden Status eine Zeile aus, z. B. `"Status: Bezahlt"`.

5. **Wochenende prüfen (Zusatz)**
   Definiere einen enum `Wochentag` und schreibe eine Variable `heute`. Prüfe mit `if`, ob `heute` `Samstag` oder `Sonntag` ist, und gib "Wochenende" bzw. "Arbeitstag" aus.
