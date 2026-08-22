import React from 'react';

interface SaturnIconProps {
  size?: number;
  className?: string;
}

export const SaturnIcon: React.FC<SaturnIconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Glow filter */}
        <filter id="cosmos-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Planet sphere gradient */}
        <radialGradient id="planet-sphere" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>

        {/* Ring gradient */}
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Atmosphere back ring shadow */}
        <linearGradient id="back-ring" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Background soft celestial glow */}
      <circle cx="16" cy="16" r="10" fill="#a855f7" opacity="0.25" filter="url(#cosmos-glow)" />

      {/* Back half of the ring (behind planet) */}
      <path
        d="M 5 19 C 3 14 11 8 23 9 C 27 9.5 29 11.5 28 13.5"
        stroke="url(#back-ring)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Main Celestial Planet Body */}
      <circle cx="16" cy="16" r="7.5" fill="url(#planet-sphere)" stroke="#fef08a" strokeWidth="0.75" />

      {/* Planet surface cloud bands */}
      <path
        d="M 9.5 14 Q 16 17 22.5 14"
        stroke="#ffffff"
        strokeWidth="0.8"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <path
        d="M 10 18 Q 16 21 22 18"
        stroke="#7e22ce"
        strokeWidth="0.9"
        strokeOpacity="0.6"
        strokeLinecap="round"
      />

      {/* Front half of the glowing cosmic planetary ring */}
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="4.8"
        transform="rotate(-25 16 16)"
        stroke="url(#ring-gradient)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="42 22"
        strokeDashoffset="12"
      />

      {/* Outer subtle secondary ring aura */}
      <ellipse
        cx="16"
        cy="16"
        rx="15"
        ry="5.8"
        transform="rotate(-25 16 16)"
        stroke="#38bdf8"
        strokeWidth="0.75"
        strokeOpacity="0.5"
        strokeDasharray="46 26"
        strokeDashoffset="14"
      />

      {/* Sparkling Stars around planet */}
      <path
        d="M 25 6 L 25.8 8.2 L 28 9 L 25.8 9.8 L 25 12 L 24.2 9.8 L 22 9 L 24.2 8.2 Z"
        fill="#fef08a"
      />
      <circle cx="6" cy="10" r="1" fill="#67e8f9" />
      <circle cx="26" cy="24" r="0.8" fill="#f472b6" />
    </svg>
  );
};

