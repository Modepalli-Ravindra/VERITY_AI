import React from 'react';

interface VerityLogoProps {
  className?: string;
  size?: number;
}

export const VerityLogo: React.FC<VerityLogoProps> = ({ className = 'h-8 md:h-9', size }) => {
  return (
    <svg
      width={size || 36}
      height={size || 36}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none transition-transform duration-200 group-hover:scale-105`}
    >
      {/* Background soft shield outline */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="#702B40"
        stroke="#A64C61"
        strokeWidth="1.5"
      />

      {/* Stylized Faceted VERITY "V" Glyph in burgundy/rose theme */}
      {/* Left Wing Facet */}
      <path
        d="M12 14L24 36L20 36L9 14H12Z"
        fill="#D28B96"
      />

      {/* Right Wing Facet */}
      <path
        d="M36 14L24 36L28 36L39 14H36Z"
        fill="#A64C61"
      />

      {/* Center Dynamic Core Prism */}
      <path
        d="M24 18L18 30L24 36L30 30L24 18Z"
        fill="#F1DDE0"
      />

      {/* Inner Central Accent Line */}
      <path
        d="M24 21V33"
        stroke="#702B40"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Top Precision Accent Point */}
      <circle
        cx="24"
        cy="12"
        r="2"
        fill="#F1DDE0"
      />
    </svg>
  );
};
