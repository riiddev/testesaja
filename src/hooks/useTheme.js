/**
 * Light theme hook (Dark Mode removed per specification).
 * Retains hook structure for future extensions.
 */
export function useTheme() {
  if (typeof document !== "undefined") {
    if (document.documentElement.dataset.theme) {
      delete document.documentElement.dataset.theme;
    }
  }
  return {
    theme: "light",
    toggleTheme: () => {},
    isDark: false
  };
}
