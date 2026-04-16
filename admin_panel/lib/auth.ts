/** Demo-only auth flag (client-side). No real authentication. */

export const DEMO_AUTH_STORAGE_KEY = "admin_panel_demo_session";

export function isDemoSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY) === "1";
}

export function setDemoSessionActive(): void {
  sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, "1");
}

export function clearDemoSession(): void {
  sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}
