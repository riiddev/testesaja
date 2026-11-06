import React from "react";

export function IconBase({ size = 16, className = "", children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`sinau-svg-icon ${className}`}
      aria-hidden="true"
      style={{ verticalAlign: "middle", display: "inline-block", ...props.style }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconTarget({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </IconBase>
  );
}

export function IconClock({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconBase>
  );
}

export function IconHourglass({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </IconBase>
  );
}

export function IconLock({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IconBase>
  );
}

export function IconUnlock({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </IconBase>
  );
}

export function IconCheck({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </IconBase>
  );
}

export function IconCheckCircle({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </IconBase>
  );
}

export function IconClose({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconBase>
  );
}

export const IconX = IconClose;

export function IconArrowRight({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </IconBase>
  );
}

export function IconArrowLeft({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </IconBase>
  );
}

export function IconArrowUpRight({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </IconBase>
  );
}

export function IconRefresh({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </IconBase>
  );
}

export function IconTrophy({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
    </IconBase>
  );
}

export function IconStar({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </IconBase>
  );
}

export function IconBook({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </IconBase>
  );
}

export function IconFire({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </IconBase>
  );
}

export function IconSparkles({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </IconBase>
  );
}

export function IconVolume({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </IconBase>
  );
}

export function IconLightbulb({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </IconBase>
  );
}

export function IconWidget({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </IconBase>
  );
}

export function IconCoin({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
      <path d="M12 6v2m0 8v2" />
    </IconBase>
  );
}

export function IconChevronDown({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </IconBase>
  );
}

export function IconChevronUp({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polyline points="18 15 12 9 6 15" />
    </IconBase>
  );
}

export function IconCompass({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </IconBase>
  );
}

export function IconEdit({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </IconBase>
  );
}

export function IconGift({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </IconBase>
  );
}

export function IconScroll({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </IconBase>
  );
}

export function IconHelp({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconBase>
  );
}

export function IconPin({ size = 16, className = "", ...props }) {
  return (
    <IconBase size={size} className={className} {...props}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76l-1.92-3.84A2 2 0 0 1 17 10.5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6.5a2 2 0 0 1-.08.89L5 15.24V17z" />
    </IconBase>
  );
}
