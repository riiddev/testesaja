/**
 * SINAUENGLISH V2 — Speech & Pronunciation Service
 * Uses client-side Web Speech Synthesis API without external paid services
 */

export class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    // Prioritize high-quality English voices (Google, Natural, Samantha, Daniel)
    this.selectedVoice =
      this.voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
      this.voices.find(v => v.lang.startsWith("en-US")) ||
      this.voices.find(v => v.lang.startsWith("en-GB")) ||
      this.voices.find(v => v.lang.startsWith("en")) ||
      null;
  }

  speak(text: string, rate: number = 0.9): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        console.warn("SpeechSynthesis not available in this browser.");
        return resolve();
      }
      this.synth.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn("Speech synthesis error:", e);
        resolve(); // Don't throw, just resolve
      };

      this.synth.speak(utterance);
    });
  }

  cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechService = new SpeechService();

