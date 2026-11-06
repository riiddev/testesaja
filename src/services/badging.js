/**
 * SINAUENGLISH V2 — PWA Badging API Service
 * 
 * Sets dynamic notification counts on the installed PWA app icon
 * across Android Chrome, desktop Chrome, and Edge launchers.
 * 
 * Spec: https://w3c.github.io/badging/
 */

/**
 * Update the application icon badge with pending tasks count (e.g., unfinished missions).
 * @param {number} count - Positive integer for count, or 0 to clear.
 */
export async function setAppBadge(count) {
  if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) {
    return false;
  }

  try {
    const num = Math.max(0, parseInt(count, 10) || 0);
    if (num > 0) {
      await navigator.setAppBadge(num);
    } else {
      await navigator.clearAppBadge();
    }
    return true;
  } catch (err) {
    // Silently ignore if permission or environment restricts badge
    return false;
  }
}

/**
 * Clear the application icon badge completely.
 */
export async function clearAppBadge() {
  if (typeof navigator === "undefined" || !("clearAppBadge" in navigator)) {
    return false;
  }

  try {
    await navigator.clearAppBadge();
    return true;
  } catch (err) {
    return false;
  }
}

