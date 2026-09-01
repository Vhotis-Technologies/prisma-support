/**
 * Escape closes the open dialog. Disabled while a mutation is in flight.
 *
 * @module app-hooks/useEscapeToClose
 */
import { useEffect } from "react";

export function useEscapeToClose(enabled: boolean, onClose: () => void) {
  useEffect(() => {
    if (!enabled) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onClose]);
}
