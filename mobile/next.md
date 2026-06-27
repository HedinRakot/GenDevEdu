# Nächste Schritte – Mobile App

## 1. Auth: Mock durch echte OIDC-Anbindung ersetzen

- In `src/context/AuthContext.tsx` den Mock-Block (Zeilen 54–106) entfernen
- Den auskommentierten Original-Block darunter wieder einkommentieren
- Werte in `src/config/env.ts` prüfen: `OAUTH_CLIENT_ID`, `OAUTH_REDIRECT_URI`, `OAUTH_SCOPES`, Discovery-URL des Identity Servers

## 2. API: Mock-Daten durch echte Backend-Calls ersetzen

- In `src/api/courses.ts` die statischen Mock-Daten durch Axios-Calls gegen das Backend ersetzen
- Base-URL in `src/config/env.ts` / `src/services/apiClient.ts` auf den echten Backend-Endpunkt setzen
- Token-Weitergabe im Axios-Interceptor prüfen (Bearer-Header wird bereits in `apiClient.ts` gesetzt)

## 3. Tests wieder auf echtes Verhalten anpassen

- In `__tests__/AuthContext.test.tsx` alle fünf `it.skip` auf `it` zurückstellen
- In `__tests__/RootNavigator.test.tsx` den übersprungenen Test reaktivieren
- Sicherstellen, dass der SecureStore-Mock in `jest.setup.js` zwischen den Tests korrekt resettet wird (`__reset()` wird bereits aufgerufen – bei Problemen Reihenfolge der `beforeEach`-Hooks prüfen)
