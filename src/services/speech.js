/**
 * SINAUENGLISH V2 — Web Speech API Service
 * Handles English pronunciation synthesis with fallbacks
 */

class SpeechService {
  constructor() {
    this.synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
    this.voices = [];
    this.selectedVoice = null;
    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      // Prioritize natural US/UK English voices
      this.selectedVoice =
        this.voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Premium"))) ||
        this.voices.find(v => v.lang === "en-US") ||
        this.voices.find(v => v.lang.startsWith("en")) ||
        null;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text, rate = 0.95) {
    if (!this.synth) {
      console.warn("SpeechSynthesis tidak didukung di peramban ini.");
      return;
    }

    try {
      this.synth.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.pitch = 1.0;
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      this.synth.speak(utterance);
    } catch (e) {
      console.warn("Gagal membunyikan audio:", e);
    }
  }
}

export const speechService = new SpeechService();

