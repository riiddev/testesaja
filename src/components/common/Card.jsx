import React from "react";

export function Card({
  children,
  tint = "surface",
  interactive = false,
  className = "",
  onClick,
  ...props
}) {
  const tintClass = tint !== "surface" ? `card-tint-${tint}` : "";
  const interactiveClass = interactive ? "card-interactive" : "";

  return (
    <div
      className={`card ${tintClass} ${interactiveClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

