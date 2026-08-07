/**
 * Cookie and Session Management Utilities
 * Handles setting, retrieving, and expiring cookies with a 7-day TTL.
 */

export function setCookie(name: string, value: string, days: number = 7) {
  try {
    const maxAge = Math.floor(days * 24 * 60 * 60); // seconds
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    const encodedValue = encodeURIComponent(value);
    document.cookie = `${name}=${encodedValue}${expires}; max-age=${maxAge}; path=/; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to set cookie:", e);
  }
}

export function getCookie(name: string): string | null {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch (e) {
    console.error("Failed to get cookie:", e);
  }
  return null;
}

export function deleteCookie(name: string) {
  try {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
  } catch (e) {
    console.error("Failed to delete cookie:", e);
  }
}
