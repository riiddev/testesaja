import React from "react";
import { Link } from "react-router-dom";

export function BrandLogo({ to = "/", className = "", size = 36 }) {
  return (
    <Link to={to} className={`sinau-brand brand ${className}`} aria-label="SinauEnglish Beranda">
      {/* Ikon Split Pill S */}
      <svg
        className="sinau-brand-icon"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
      >
        {/* Kapsul Atas (Mustard) */}
        <path
          d="M46 18H24C17.3726 18 12 23.3726 12 30C12 36.6274 17.3726 42 24 42H36C38.2091 42 40 40.2091 40 38C40 35.7909 38.2091 34 36 34H24C21.7909 34 20 32.2091 20 30C20 27.7909 21.7909 26 24 26H46C48.2091 26 50 24.2091 50 22C50 19.7909 48.2091 18 46 18Z"
          fill="#C89D3C"
          stroke="#121212"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Kapsul Bawah (Krem) */}
        <path
          d="M18 46H40C46.6274 46 52 40.6274 52 34C52 27.3726 46.6274 22 40 22H28C25.7909 22 24 23.7909 24 26C24 28.2091 25.7909 30 28 30H40C42.2091 30 44 31.7909 44 34C44 36.2091 42.2091 38 40 38H18C15.7909 38 14 39.7909 14 42C14 44.2091 15.7909 46 18 46Z"
          fill="#F6F2E9"
          stroke="#121212"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      <span className="sinau-brand-text brand-text">
        <strong>sinau</strong><span>english</span>
      </span>
    </Link>
  );
}

