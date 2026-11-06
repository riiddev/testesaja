import React from "react";

export function Skeleton({ width = "100%", height = "20px", borderRadius, style = {}, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        inlineSize: width,
        blockSize: height,
        borderRadius: borderRadius || "var(--radius-sm)",
        ...style
      }}
    />
  );
}

