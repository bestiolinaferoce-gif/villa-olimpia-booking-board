/** Sessione PasswordGate (solo client). */
export const AUTH_SESSION_KEY = "villa-olimpia:auth";

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}
