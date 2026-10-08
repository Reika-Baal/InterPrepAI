import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
const key = "interprepai.theme";
function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f5f6fc" : "#0a0b10");
  window.dispatchEvent(new Event("interprepai-theme"));
}
function subscribe(notify: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key === key || event.key === null)
      applyTheme(event.newValue === "light" ? "light" : "dark");
  };
  window.addEventListener("interprepai-theme", notify);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener("interprepai-theme", notify);
    window.removeEventListener("storage", sync);
  };
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark");
  const light = theme === "light";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => {
        const next = light ? "dark" : "light";
        applyTheme(next);
        try {
          localStorage.setItem(key, next);
        } catch {
          /* Theme still works when browser storage is blocked. */
        }
      }}
    >
      {light ? (
        <Sun size={19} aria-hidden="true" />
      ) : (
        <Moon size={19} aria-hidden="true" />
      )}
    </button>
  );
}
