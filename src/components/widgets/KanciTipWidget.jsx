import React, { useState } from "react";
import { IconLightbulb, IconRefresh } from "../common/Icons.jsx";
import { KanciMascot } from "../mascot/KanciMascot.jsx";

const KANCI_TIPS = [
  {
    title: "Active Recall",
    desc: "Uji ingatan Anda sebelum melihat terjemahan. Menghubungkan makna sendiri memperkuat sinapsis memori 3x lebih cepat!"
  },
  {
    title: "Pacing Harian",
    desc: "10 menit setiap hari jauh lebih efektif daripada 2 jam seminggu sekali. Konsistensi harian adalah kunci kefasihan."
  },
  {
    title: "Membaca Bersuara (Shadowing)",
    desc: "Tirukan intonasi penutur asli saat mendengarkan audio cerita. Lidah dan otot rahang butuh latihan motorik untuk fasih."
  },
  {
    title: "Konteks Kalimat",
    desc: "Jangan menghafal kata secara terisolasi. Selalu pelajari kosakata bersama frasa dan kalimat contohnya."
  },
  {
    title: "Jangan Takut Keliru",
    desc: "Setiap kesalahan dalam latihan SRS adalah kesempatan bagi algoritma untuk menjadwalkan repetisi tepat waktu."
  },
  {
    title: "Collocation Power",
    desc: "Perhatikan kata yang sering berpasangan, seperti 'make a decision' atau 'take a break'. Ini membuat bicara lebih natural."
  }
];

export function KanciTipWidget({ equippedOutfit }) {
  const [tipIndex, setTipIndex] = useState(0);

  const currentTip = KANCI_TIPS[tipIndex % KANCI_TIPS.length];

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % KANCI_TIPS.length);
  };

  return (
    <div className="sinau-widget-card" id="widget-kanci-tips">
      <div className="widget-card-header">
        <div className="widget-card-title-group">
          <IconLightbulb size={14} style={{ color: "var(--color-accent-gold)" }} />
          <h4 className="widget-card-title">Tips Sahabat Kanci</h4>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleNextTip}
          title="Ganti Tips Belajar"
          style={{ padding: "2px 6px", height: "auto", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <IconRefresh size={12} /> Ganti Tip
        </button>
      </div>

      <div className="widget-card-body">
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <div style={{ width: "54px", height: "54px", flexShrink: 0 }}>
            <KanciMascot
              state="encouraging"
              size="sm"
              equippedOutfit={equippedOutfit}
            />
          </div>
          <div>
            <h5 style={{ margin: "0 0 2px 0", fontSize: "var(--text-xs)", fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", fontWeight: 800 }}>
              {currentTip.title}
            </h5>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
              {currentTip.desc}
            </p>
          </div>
        </div>
      </div>

      <div className="widget-card-footer">
        <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
          Tip {tipIndex + 1} dari {KANCI_TIPS.length}
        </span>
      </div>
    </div>
  );
}

