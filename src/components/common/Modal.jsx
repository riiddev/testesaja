import React, { useEffect, useRef } from "react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "580px"
}) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay is-open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-sheet modal-content"
        style={{ maxInlineSize: maxWidth, width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)", gap: "var(--space-2)" }}>
          {title ? (
            <h2 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>
              {title}
            </h2>
          ) : <div />}

          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-outline btn-icon"
            onClick={onClose}
            aria-label="Tutup jendela modal"
            style={{
              width: "44px",
              height: "44px",
              minWidth: "44px",
              minHeight: "44px",
              borderRadius: "var(--radius-pill)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
