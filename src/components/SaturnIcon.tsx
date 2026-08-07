import React from 'react';

interface SaturnIconProps {
  size?: number;
  className?: string;
}

export const SaturnIcon: React.FC<SaturnIconProps> = ({ size = 22, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="saturn-planet-grad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Saturn planet body */}
      <circle cx="12" cy="12" r="5" fill="url(#saturn-planet-grad)" stroke="currentColor" strokeWidth="1.2" />

      {/* Saturn ring ellipse around planet */}
      <ellipse
        cx="12"
        cy="12"
        rx="9.5"
        ry="3.4"
        transform="rotate(-28 12 12)"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Tiny surrounding cosmic sparkle dot */}
      <circle cx="19" cy="5" r="0.9" fill="#fef08a" />
    </svg>
  );
};
