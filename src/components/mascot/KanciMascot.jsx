import React, { useState } from "react";
import { getAssetUrl } from "../../data/assets.js";

/**
 * KANCI MASCOT — SinauEnglish V2
 * 
 * Expressions: 'base' | 'happy' | 'thinking' | 'celebrating' | 'sleepy' | 'encouraging' | 'reading'
 * Outfits: 'kacamata' | 'petualang' | 'syal' | 'headphone' | null
 */
export function KanciMascot({
  expression = "base",
  equippedOutfit = null,
  size = "md", // "sm" | "md" | "lg" | "xl"
  dialogue = null,
  className = "",
  animate = true
}) {
  const [imgError, setImgError] = useState(false);
  const [outfitImgError, setOutfitImgError] = useState(false);

  const sizeDimensions = {
    sm: { box: 56, icon: 48 },
    md: { box: 96, icon: 84 },
    lg: { box: 150, icon: 136 },
    xl: { box: 220, icon: 200 }
  };

  const dim = sizeDimensions[size] || sizeDimensions.md;
  const baseAssetUrl = getAssetUrl("mascot", expression) || getAssetUrl("mascot", "base");
  const outfitUrl = equippedOutfit ? getAssetUrl("outfits", equippedOutfit) : null;
  // If outfit is equipped and has a custom asset, use the full outfit mascot character
  const assetUrl = (equippedOutfit && outfitUrl) ? outfitUrl : baseAssetUrl;

  return (
    <div
      className={`kanci-mascot-container ${animate ? "kanci-animate-float" : ""} ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        userSelect: "none"
      }}
      aria-label={`Maskot Kanci (${expression})`}
    >
      {/* Speech / Dialogue Bubble */}
      {dialogue && (
        <div
          className="kanci-speech-bubble"
          style={{
            position: "relative",
            marginBottom: "var(--space-2)",
            padding: "8px 14px",
            backgroundColor: "var(--color-bg-surface)",
            border: "var(--border-sm)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-sm)",
            fontFamily: "var(--font-heading)",
            fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-sm)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            maxWidth: "260px",
            textAlign: "center",
            lineHeight: 1.4
          }}
        >
          {dialogue}
          {/* Bubble tail */}
          <div
            style={{
              position: "absolute",
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: "10px",
              height: "10px",
              backgroundColor: "var(--color-bg-surface)",
              borderRight: "var(--border-sm)",
              borderBottom: "var(--border-sm)"
            }}
          />
        </div>
      )}

      {/* Mascot Visual Box */}
      <div
        className="kanci-visual-box"
        style={{
          width: `${dim.box}px`,
          height: `${dim.box}px`,
          position: "relative",
          display: "grid",
          placeItems: "center"
        }}
      >
        {!imgError && assetUrl ? (
          <img
            src={assetUrl}
            alt={`Kanci ${expression}`}
            onError={() => setImgError(true)}
            style={{
              width: `${dim.icon}px`,
              height: `${dim.icon}px`,
              objectFit: "contain",
              pointerEvents: "none"
            }}
          />
        ) : (
          <KanciSvgFallback expression={expression} size={dim.icon} />
        )}

        {/* Outfit Overlay (Only needed if falling back to SVG mascot) */}
        {equippedOutfit && (imgError || !outfitUrl) && (
          <div
            className="kanci-outfit-layer"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none"
            }}
          >
            <KanciOutfitSvgFallback outfit={equippedOutfit} size={dim.icon} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Editorial SVG Fallback for Kanci (The Clever Indonesian Mousedeer)
 */
function KanciSvgFallback({ expression, size = 96 }) {
  const isHappy = expression === "happy" || expression === "celebrating";
  const isThinking = expression === "thinking";
  const isSleepy = expression === "sleepy";
  const isReading = expression === "reading";
  const isEncouraging = expression === "encouraging";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Left Ear */}
      <path
        d="M 32 38 C 22 20, 24 6, 32 2 C 38 0, 42 14, 38 34 Z"
        fill="#C9752A"
        stroke="#1E1E1E"
        strokeWidth="2.5"
      />
      <path
        d="M 31 34 C 25 22, 27 12, 32 8 C 36 6, 38 18, 35 32 Z"
        fill="#F5A97F"
      />

      {/* Right Ear */}
      <path
        d="M 68 38 C 78 20, 76 6, 68 2 C 62 0, 58 14, 62 34 Z"
        fill="#C9752A"
        stroke="#1E1E1E"
        strokeWidth="2.5"
      />
      <path
        d="M 69 34 C 75 22, 73 12, 68 8 C 64 6, 62 18, 65 32 Z"
        fill="#F5A97F"
      />

      {/* Head Contour */}
      <ellipse
        cx="50"
        cy="52"
        rx="28"
        ry="24"
        fill="#D68032"
        stroke="#1E1E1E"
        strokeWidth="2.5"
      />

      {/* White Chest / Muzzle Accent */}
      <ellipse
        cx="50"
        cy="59"
        rx="15"
        ry="13"
        fill="#FFF4E6"
        stroke="#1E1E1E"
        strokeWidth="1.5"
      />

      {/* Mousedeer Snout (Nose) */}
      <path
        d="M 46 54 Q 50 51 54 54 Q 50 57 46 54 Z"
        fill="#261C14"
      />

      {/* Eyes based on expression */}
      {isSleepy ? (
        <>
          <path d="M 38 46 Q 42 50 46 46" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 54 46 Q 58 50 62 46" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" />
          <text x="66" y="36" fill="#2B6CB0" fontSize="12" fontWeight="bold" fontFamily="sans-serif">z</text>
          <text x="73" y="28" fill="#2B6CB0" fontSize="9" fontWeight="bold" fontFamily="sans-serif">z</text>
        </>
      ) : isHappy ? (
        <>
          {/* Cheerful inverted arc eyes */}
          <path d="M 37 47 Q 41 42 45 47" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" />
          <path d="M 55 47 Q 59 42 63 47" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" />
          {/* Rosy cheeks */}
          <circle cx="35" cy="53" r="4" fill="#F48FB1" opacity="0.6" />
          <circle cx="65" cy="53" r="4" fill="#F48FB1" opacity="0.6" />
        </>
      ) : (
        <>
          {/* Big smart eyes */}
          <circle cx="41" cy="46" r="4.5" fill="#1E1E1E" />
          <circle cx="59" cy="46" r="4.5" fill="#1E1E1E" />
          {/* White glint */}
          <circle cx="39.5" cy="44.5" r="1.5" fill="#FFFFFF" />
          <circle cx="57.5" cy="44.5" r="1.5" fill="#FFFFFF" />
        </>
      )}

      {/* Mouth */}
      {isHappy ? (
        <path d="M 46 62 Q 50 68 54 62" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" fill="#E53935" />
      ) : isThinking ? (
        <path d="M 47 62 Q 52 61 54 63" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
      ) : isEncouraging ? (
        <path d="M 45 62 Q 50 66 55 62" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <path d="M 47 62 Q 50 65 53 62" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Prop based on expression */}
      {isReading && (
        <g transform="translate(34, 68)">
          <path d="M 0 6 Q 16 0 32 6 L 32 20 Q 16 14 0 20 Z" fill="#FDFBF7" stroke="#1E1E1E" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="18" stroke="#1E1E1E" strokeWidth="1.5" />
          <line x1="4" y1="9" x2="13" y2="8" stroke="#8D4E24" strokeWidth="1.5" />
          <line x1="19" y1="8" x2="28" y2="9" stroke="#8D4E24" strokeWidth="1.5" />
        </g>
      )}

      {expression === "celebrating" && (
        <g>
          {/* Sparkles */}
          <polygon points="20,24 23,28 20,32 17,28" fill="#F6AD55" />
          <polygon points="80,24 83,28 80,32 77,28" fill="#48BB78" />
          <polygon points="50,14 52,18 50,22 48,18" fill="#E53E3E" />
        </g>
      )}
    </svg>
  );
}

/**
 * Editorial SVG Fallback for Kanci Outfits
 */
function KanciOutfitSvgFallback({ outfit, size = 96 }) {
  if (outfit === "kacamata") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Round frame left */}
        <circle cx="41" cy="46" r="7" stroke="#1A202C" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
        {/* Round frame right */}
        <circle cx="59" cy="46" r="7" stroke="#1A202C" strokeWidth="2.5" fill="rgba(255,255,255,0.25)" />
        {/* Bridge */}
        <path d="M 48 45 Q 50 43 52 45" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
        {/* Temples */}
        <path d="M 34 46 L 27 43" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" />
        <path d="M 66 46 L 73 43" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (outfit === "syal") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Knitted scarf loop */}
        <ellipse cx="50" cy="73" rx="22" ry="7" fill="#C53030" stroke="#1A202C" strokeWidth="2" />
        {/* Hanging scarf tail */}
        <path d="M 54 73 L 57 88 L 65 88 L 62 73 Z" fill="#9B2C2C" stroke="#1A202C" strokeWidth="2" />
        <line x1="57" y1="88" x2="57" y2="91" stroke="#E2E8F0" strokeWidth="2" />
        <line x1="61" y1="88" x2="61" y2="91" stroke="#E2E8F0" strokeWidth="2" />
        <line x1="65" y1="88" x2="65" y2="91" stroke="#E2E8F0" strokeWidth="2" />
      </svg>
    );
  }

  if (outfit === "headphone") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Headband arch */}
        <path d="M 23 52 C 20 22, 80 22, 77 52" stroke="#2B6CB0" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* Ear cup left */}
        <rect x="18" y="45" width="8" height="15" rx="4" fill="#1A365D" stroke="#1A202C" strokeWidth="2" />
        {/* Ear cup right */}
        <rect x="74" y="45" width="8" height="15" rx="4" fill="#1A365D" stroke="#1A202C" strokeWidth="2" />
      </svg>
    );
  }

  if (outfit === "petualang") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Hat brim */}
        <ellipse cx="50" cy="34" rx="34" ry="7" fill="#744210" stroke="#1A202C" strokeWidth="2" />
        {/* Hat crown */}
        <path d="M 33 33 Q 35 15 42 16 Q 50 19 58 16 Q 65 15 67 33 Z" fill="#975A16" stroke="#1A202C" strokeWidth="2" />
        {/* Hat ribbon */}
        <path d="M 33 31 Q 50 33 67 31 L 67 27 Q 50 29 33 27 Z" fill="#1A202C" />
      </svg>
    );
  }

  return null;
}

