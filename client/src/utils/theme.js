const STORAGE_KEY = 'mymind-theme';

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
}

export function applyStoredTheme() {
  const theme = getStoredTheme();
  setTheme(theme);
  return theme;
}

export function toggleTheme(current) {
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
