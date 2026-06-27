/**
 * Schmaler Event-Bus, damit Module ohne React-Kontext (Axios-Interceptor)
 * dem AuthContext signalisieren können, dass ein erzwungener Logout
 * stattfinden muss (Hard-Logout bei abgelaufenem Refresh-Token).
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onForceLogout(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitForceLogout(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (e) {
      console.error('[authEvents] listener error', e);
    }
  }
}
