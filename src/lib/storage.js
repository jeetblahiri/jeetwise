export function safeGetStorage(key, fallbackValue = '') {
  try {
    return localStorage.getItem(key) || fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so the UI can still run in restrictive browsers.
  }
}

export function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so the UI can still run in restrictive browsers.
  }
}
