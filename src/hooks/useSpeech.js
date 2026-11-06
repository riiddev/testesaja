import { useCallback } from "react";
import { speechService } from "../services/speech.js";

export function useSpeech() {
  const speak = useCallback((text, rate = 0.95) => {
    if (text) {
      speechService.speak(text, rate);
    }
  }, []);

  return { speak };
}

