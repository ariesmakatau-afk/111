// The id of this browser tab's staff sign-in. Kept in sessionStorage, which
// survives reloads and a sleeping screen but is deleted when the tab closes —
// so a new tab, or a reopened one, has to sign in again.

const KEY = "yiannis_staff_tab";

export function currentTab(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Called after a successful sign-in, in the tab that signed in. */
export function startTab(): void {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  try {
    sessionStorage.setItem(KEY, id);
  } catch {}
}

export function endTab(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
