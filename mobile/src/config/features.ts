/**
 * Zentrale Feature-Flags.
 *
 * Zurückgestellte Features werden hier deaktiviert statt gelöscht —
 * Code, Hooks und Backend bleiben intakt und können per Flag reaktiviert werden.
 */
export const FEATURES = {
  /** F10 Zertifikate: zurückgestellt, keine Anzeige in der UI (Stand Juli 2026). */
  certificates: false,
} as const;
