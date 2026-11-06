import presentSimple from "./present-simple.json";
import presentContinuous from "./present-continuous.json";
import pastSimple from "./past-simple.json";
import legacyGrammarData from "../grammar.json";

// Map of enhanced modular grammar topics (Batch 1)
const ENHANCED_TOPICS = {
  "present-simple": presentSimple,
  "present-continuous": presentContinuous,
  "past-simple": pastSimple
};

/**
 * Returns enhanced 10-part topic data if migrated, or gracefully mapped legacy topic
 * @param {string} topicId 
 * @returns {object|null}
 */
export function getGrammarTopic(topicId) {
  if (ENHANCED_TOPICS[topicId]) {
    return ENHANCED_TOPICS[topicId];
  }

  // Fallback to legacy grammar.json
  const legacy = legacyGrammarData.topics?.find((t) => t.id === topicId);
  if (!legacy) return null;

  return {
    ...legacy,
    isLegacy: true,
    learningObjectives: {
      goal: legacy.summary || "Pelajari kaidah tata bahasa ini untuk menyusun kalimat yang tepat.",
      whenToUse: [
        {
          situation: "Penggunaan Umum",
          description: legacy.explanation || "Gunakan pola ini sesuai aturan tata bahasa standar.",
          triggerWords: []
        }
      ]
    },
    patternTable: (legacy.patterns || []).map((p) => ({
      type: p.label || "Pola",
      subjectGroup: "Umum",
      formula: p.pattern,
      example: ""
    })),
    progressiveExplanation: {
      step1_intuition: legacy.explanation,
      step2_coreRules: [legacy.summary],
      step3_spellingRules: [],
      step4_exceptions: []
    },
    useCaseExamples: [
      {
        category: "Contoh Utama",
        sentences: (legacy.examples || []).map((ex) => ({
          en: ex.en,
          id: ex.id
        }))
      }
    ],
    indonesianContrast: {
      fundamentalDifference: "Bahasa Indonesia tidak memiliki konjugasi waktu seperti bahasa Inggris.",
      whyIndonesiansStruggle: "Penutur Indonesia terbiasa dengan struktur kata kerja yang tidak berubah.",
      contrastTable: []
    },
    commonMistakes: (legacy.mistakes || []).map((m) => ({
      wrong: m.wrong,
      correct: m.right,
      trapType: "Kaidah Dasar",
      explanation: m.why
    })),
    cheatSheet: {
      keyTakeaways: [legacy.summary],
      quickGoldenRule: "Perhatikan subjek dan penanda waktu kalimat."
    },
    practiceExercises: (legacy.questions || []).map((q, idx) => ({
      id: `legacy-ex-${idx + 1}`,
      type: q.type === "typed" ? "fill-in" : "multiple-choice",
      level: "Dasar",
      prompt: q.prompt,
      options: q.options || [],
      correctIndex: q.answer,
      acceptedAnswers: q.accepted || [],
      explanation: q.explanation
    })),
    finalQuiz: (legacy.questions || []).map((q, idx) => ({
      id: `legacy-q-${idx + 1}`,
      question: q.prompt,
      options: q.options || ["A", "B", "C"],
      correctIndex: q.answer || 0,
      explanation: {
        correctReason: q.explanation || "Jawaban ini sesuai dengan pola tata bahasa baku.",
        wrongAnalysis: ["Opsi lain tidak memenuhi aturan gramatikal topik ini."],
        readingStrategy: "Perhatikan subjek kalimat.",
        keywords: [legacy.title]
      }
    }))
  };
}

/**
 * Returns all topics from master list with enhanced indicator
 */
export function getAllTopics() {
  return (legacyGrammarData.topics || []).map((t) => ({
    ...t,
    hasDeepCurriculum: Boolean(ENHANCED_TOPICS[t.id])
  }));
}
