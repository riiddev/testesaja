import React, { useState } from "react";
import { getAssetUrl } from "../../data/assets.js";

/**
 * AVATAR WITH BORDER OVERLAY — SinauEnglish V2
 * 
 * Renders avatar image (or initials fallback) with equipped collectible border.
 */
export function AvatarWithBorder({
  avatarUrl = null,
  initialLetter = "S",
  bgColor = "var(--color-bg-subtle)",
  color = "var(--color-text-primary)",
  equippedBorder = null,
  size = 72,
  className = "",
  id = undefined
}) {
  const [borderImgError, setBorderImgError] = useState(false);

  // Normalize border key (strip prefix "border_")
  const borderKey = equippedBorder ? equippedBorder.replace(/^border_/, "") : null;
  const borderAssetUrl = borderKey ? getAssetUrl("borders", borderKey) : null;

  return (
    <div
      className={`avatar-with-border-wrap ${className}`}
      id={id}
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-grid",
        placeItems: "center",
        userSelect: "none"
      }}
    >
      {/* 1. Base Avatar Circle */}
      <div
        className="avatar-core-circle"
        style={{
          width: `${size * 0.82}px`,
          height: `${size * 0.82}px`,
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: avatarUrl ? "transparent" : bgColor,
          color: color,
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontFamily: "var(--font-heading)",
          fontSize: `${size * 0.38}px`,
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
        }}
      >
        {avatarUrl ? (
          <img
            id="scholar-avatar-image"
            className="scholar-avatar-img"
            src={avatarUrl}
            alt="Avatar Pelajar"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />
        ) : (
          <span id="scholar-avatar-initials">{initialLetter}</span>
        )}
      </div>

      {/* 2. Border Layer Overlay */}
      {borderKey && borderKey !== "none" && (
        <div
          className="avatar-border-overlay"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "grid",
            placeItems: "center"
          }}
        >
          {!borderImgError && borderAssetUrl ? (
            <img
              src={borderAssetUrl}
              alt={`Border ${borderKey}`}
              onError={() => setBorderImgError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }}
            />
          ) : (
            <AvatarBorderSvgFallback borderKey={borderKey} size={size} />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Editorial SVG Border Overlay Fallbacks
 */
function AvatarBorderSvgFallback({ borderKey, size = 72 }) {
  switch (borderKey) {
    case "daun":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" stroke="#2F5D38" strokeWidth="3" strokeDasharray="6 4" />
          {/* Leaves */}
          <path d="M 50 2 Q 55 10 50 14 Q 45 10 50 2 Z" fill="#48BB78" stroke="#1E1E1E" strokeWidth="1" />
          <path d="M 98 50 Q 90 55 86 50 Q 90 45 98 50 Z" fill="#48BB78" stroke="#1E1E1E" strokeWidth="1" />
          <path d="M 50 98 Q 45 90 50 86 Q 55 90 50 98 Z" fill="#48BB78" stroke="#1E1E1E" strokeWidth="1" />
          <path d="M 2 50 Q 10 45 14 50 Q 10 55 2 50 Z" fill="#48BB78" stroke="#1E1E1E" strokeWidth="1" />
        </svg>
      );

    case "tinta":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="#263238" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="38 12 18 10" />
          {/* Quill ink tip accent at top right */}
          <polygon points="76,14 86,18 84,28 78,22" fill="#263238" />
        </svg>
      );

    case "kawung":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="#8D4E24" strokeWidth="3.5" />
          {/* Traditional 4-petaled Kawung oval accents */}
          <ellipse cx="50" cy="9" rx="7" ry="5" fill="#C05621" stroke="#1E1E1E" strokeWidth="1" />
          <ellipse cx="91" cy="50" rx="5" ry="7" fill="#C05621" stroke="#1E1E1E" strokeWidth="1" />
          <ellipse cx="50" cy="91" rx="7" ry="5" fill="#C05621" stroke="#1E1E1E" strokeWidth="1" />
          <ellipse cx="9" cy="50" rx="5" ry="7" fill="#C05621" stroke="#1E1E1E" strokeWidth="1" />
          <circle cx="50" cy="9" r="2" fill="#FFF7EE" />
          <circle cx="91" cy="50" r="2" fill="#FFF7EE" />
          <circle cx="50" cy="91" r="2" fill="#FFF7EE" />
          <circle cx="9" cy="50" r="2" fill="#FFF7EE" />
        </svg>
      );

    case "buku":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="#2D4A6B" strokeWidth="3" />
          {/* Manuscript ribbon at bottom */}
          <path d="M 32 88 Q 50 82 68 88 L 65 96 Q 50 90 35 96 Z" fill="#2B6CB0" stroke="#1E1E1E" strokeWidth="1.5" />
          {/* Tiny book corners */}
          <rect x="18" y="18" width="6" height="6" fill="#ECC94B" stroke="#1E1E1E" strokeWidth="1" />
          <rect x="76" y="18" width="6" height="6" fill="#ECC94B" stroke="#1E1E1E" strokeWidth="1" />
        </svg>
      );

    case "emas":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#D69E2E" strokeWidth="3" />
          <circle cx="50" cy="50" r="42" stroke="#ECC94B" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* 4 Golden diamond studs */}
          <polygon points="50,2 53,5 50,8 47,5" fill="#ECC94B" stroke="#744210" strokeWidth="1" />
          <polygon points="98,50 95,53 92,50 95,47" fill="#ECC94B" stroke="#744210" strokeWidth="1" />
          <polygon points="50,98 53,95 50,92 47,95" fill="#ECC94B" stroke="#744210" strokeWidth="1" />
          <polygon points="2,50 5,53 8,50 5,47" fill="#ECC94B" stroke="#744210" strokeWidth="1" />
        </svg>
      );

    case "kanci":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Circle base */}
          <circle cx="50" cy="54" r="42" stroke="#B25E1A" strokeWidth="3.5" />
          {/* Mousedeer ears on top */}
          <path d="M 34 26 C 26 12 28 2 34 0 C 38 0 42 10 38 24 Z" fill="#C9752A" stroke="#1E1E1E" strokeWidth="2" />
          <path d="M 66 26 C 74 12 72 2 66 0 C 62 0 58 10 62 24 Z" fill="#C9752A" stroke="#1E1E1E" strokeWidth="2" />
          <circle cx="34" cy="12" r="3" fill="#F5A97F" />
          <circle cx="66" cy="12" r="3" fill="#F5A97F" />
        </svg>
      );

    default:
      return null;
  }
}
