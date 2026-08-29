import React from 'react';

interface SaturnIconProps {
  size?: number;
  className?: string;
}

export const SaturnIcon: React.FC<SaturnIconProps> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible ${className}`}
    >
      <defs>
        {/* Deep Cosmic Radial Core */}
        <radialGradient id="mkPlanetCore" cx="42%" cy="40%" r="58%">
          <stop offset="0%" stopColor="#1a0b2e" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#0a0518" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#04020a" stopOpacity="0.98" />
        </radialGradient>

        {/* Ring Main Neon Gradient (Cyan -> Violet -> Magenta -> White Hot) */}
        <linearGradient id="mkRingNeon1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="25%" stopColor="#4facfe" />
          <stop offset="48%" stopColor="#b122e6" />
          <stop offset="72%" stopColor="#ff007f" />
          <stop offset="90%" stopColor="#ff77e9" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* Outer Ring Secondary Stream (Cyan -> Magenta -> Pink) */}
        <linearGradient id="mkRingNeon2" x1="0%" y1="80%" x2="100%" y2="20%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#c084fc" />
          <stop offset="70%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>

        {/* Inner Front Sweeping Stream */}
        <linearGradient id="mkRingInner" x1="10%" y1="90%" x2="90%" y2="10%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="45%" stopColor="#d946ef" />
          <stop offset="80%" stopColor="#ff00aa" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>

        {/* White Hot Specular Core Stroke */}
        <linearGradient id="mkWhiteHot" x1="20%" y1="80%" x2="80%" y2="20%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="85%" stopColor="#ff77e9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
        </linearGradient>

        {/* Planet Left Rim Glow Gradient */}
        <linearGradient id="mkLeftRimCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Cosmic Bloom & Drop Shadow Filters */}
        <filter id="mkCosmicGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur1" />
          <feGaussianBlur stdDeviation="1.2" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="mkSoftAura" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ================= BACKGROUND CELESTIAL GLOW ================= */}
      <circle cx="58" cy="58" r="32" fill="#9333ea" opacity="0.22" filter="url(#mkSoftAura)" />
      <circle cx="56" cy="56" r="24" fill="#06b6d4" opacity="0.18" filter="url(#mkCosmicGlow)" />

      {/* ================= BACK HALF OF ORBITAL RINGS ================= */}
      <g filter="url(#mkCosmicGlow)">
        {/* Back Wide Neon Arch (Dips behind top-right of the planet) */}
        <path
          d="M 22 84 C 10 52 38 20 78 20 C 96 20 108 26 106 38 C 104 48 94 58 78 68"
          stroke="url(#mkRingNeon1)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />
        {/* Back Outer Delicate Ring Streak */}
        <path
          d="M 28 80 C 18 52 42 24 80 23 C 100 23 112 30 110 42 C 108 50 100 60 84 70"
          stroke="url(#mkRingNeon2)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>

      {/* ================= MAIN PLANETARY SPHERE BODY ================= */}
      {/* Central Planet Disc with Deep Cosmic Gradient */}
      <circle cx="58" cy="58" r="26" fill="url(#mkPlanetCore)" />

      {/* Planetary Atmosphere Outer Rings & Internal Crescent Glow */}
      <circle
        cx="58"
        cy="58"
        r="25.5"
        stroke="#4f46e5"
        strokeWidth="1"
        strokeOpacity="0.4"
      />
      {/* Upper-Left Radiant Cyan/Blue Crescent Rim Light */}
      <path
        d="M 36 40 C 33 50 35 64 42 74 C 36 64 36 50 42 38 C 48 28 58 24 70 24 C 56 26 44 32 36 40 Z"
        fill="url(#mkLeftRimCyan)"
        filter="url(#mkCosmicGlow)"
        opacity="0.9"
      />
      {/* Inner Pink/Magenta Crescent Shadow on lower sphere rim */}
      <path
        d="M 78 72 C 72 80 62 84 50 84 C 62 82 72 76 76 68 C 80 60 80 48 78 38 C 82 48 82 62 78 72 Z"
        fill="#f43f5e"
        opacity="0.4"
      />

      {/* Planet Surface Internal Orbit Swirl Shadows */}
      <path
        d="M 38 66 C 46 72 60 74 72 70"
        stroke="#9333ea"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M 44 48 C 52 44 64 44 74 48"
        stroke="#06b6d4"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />

      {/* ================= FRONT HALF OF SWEEPING ORBITAL RINGS ================= */}
      <g filter="url(#mkCosmicGlow)">
        {/* Main Sweeping Front Primary Neon Band */}
        <path
          d="M 104 36 C 96 48 76 66 48 82 C 28 92 12 94 14 84 C 16 74 32 62 58 48 C 76 38 96 30 106 32"
          stroke="url(#mkRingNeon1)"
          strokeWidth="4.8"
          strokeLinecap="round"
        />

        {/* Outer Radiant Secondary Ribbon */}
        <path
          d="M 110 42 C 102 56 80 74 50 90 C 30 100 12 102 14 88 C 16 78 34 66 60 52"
          stroke="url(#mkRingNeon2)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Front Inner Vivid Cyan-Magenta Blade */}
        <path
          d="M 98 42 C 86 54 68 70 44 84 C 30 92 20 92 20 86 C 22 78 36 68 58 56"
          stroke="url(#mkRingInner)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Ultra-Bright White Hot Central Light Filament */}
        <path
          d="M 94 44 C 82 55 64 70 42 82 C 30 88 22 88 24 84 C 26 78 40 68 62 56 C 76 48 90 42 96 42"
          stroke="url(#mkWhiteHot)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>

      {/* ================= PROMINENT 4-POINT STAR FLARES & LIGHT RAYS ================= */}
      {/* Top Starburst Flare where ring meets atmosphere */}
      <g transform="translate(80, 24)" filter="url(#mkCosmicGlow)">
        {/* Vertical and Horizontal Lens Rays */}
        <line x1="0" y1="-14" x2="0" y2="14" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="-8" y1="-8" x2="8" y2="8" stroke="#ff77e9" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="-8" y1="8" x2="8" y2="-8" stroke="#38bdf8" strokeWidth="0.8" strokeLinecap="round" />
        {/* Star Diamond Core */}
        <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#ffffff" />
        <circle cx="0" cy="0" r="2" fill="#ffffff" />
      </g>

      {/* Bottom Starburst Flare at front ring intersection */}
      <g transform="translate(44, 86)" filter="url(#mkCosmicGlow)">
        <line x1="0" y1="-16" x2="0" y2="18" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="-15" y1="0" x2="15" y2="0" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="-7" y1="-7" x2="7" y2="7" stroke="#38bdf8" strokeWidth="0.9" strokeLinecap="round" />
        <line x1="-7" y1="7" x2="7" y2="-7" stroke="#ff007f" strokeWidth="0.9" strokeLinecap="round" />
        <polygon points="0,-8 2.5,-2 8,0 2.5,2 0,8 -2.5,2 -8,0 -2.5,-2" fill="#ffffff" />
        <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
      </g>

      {/* ================= SCATTERED SPARKLING DIAMONDS & STARS ================= */}
      {/* Top Left Major Sparkle */}
      <g transform="translate(38, 18)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-7 1.8,-1.8 7,0 1.8,1.8 0,7 -1.8,1.8 -7,0 -1.8,-1.8" fill="#ffffff" />
      </g>
      {/* Left Mid Sparkle */}
      <g transform="translate(24, 34)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-5 1.4,-1.4 5,0 1.4,1.4 0,5 -1.4,1.4 -5,0 -1.4,-1.4" fill="#67e8f9" />
      </g>
      {/* Left Far Lower Sparkle */}
      <g transform="translate(16, 58)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-6 1.5,-1.5 6,0 1.5,1.5 0,6 -1.5,1.5 -6,0 -1.5,-1.5" fill="#f472b6" />
      </g>
      {/* Top Right Mini Sparkle */}
      <g transform="translate(94, 20)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-5 1.2,-1.2 5,0 1.2,1.2 0,5 -1.2,1.2 -5,0 -1.2,-1.2" fill="#ffffff" />
      </g>
      {/* Far Right Lower Star */}
      <g transform="translate(108, 62)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-6 1.5,-1.5 6,0 1.5,1.5 0,6 -1.5,1.5 -6,0 -1.5,-1.5" fill="#ffffff" />
      </g>
      {/* Bottom Right Sparkle */}
      <g transform="translate(90, 88)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-7 1.8,-1.8 7,0 1.8,1.8 0,7 -1.8,1.8 -7,0 -1.8,-1.8" fill="#ffffff" />
      </g>
      {/* Bottom Far Right Mini Diamond */}
      <g transform="translate(86, 102)" filter="url(#mkCosmicGlow)">
        <polygon points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1" fill="#e879f9" />
      </g>

      {/* ================= GLOWING STARDUST PARTICLES ================= */}
      <g opacity="0.85">
        <circle cx="28" cy="24" r="1.2" fill="#ffffff" />
        <circle cx="50" cy="14" r="1.5" fill="#38bdf8" />
        <circle cx="68" cy="12" r="1" fill="#f472b6" />
        <circle cx="30" cy="48" r="1" fill="#ffffff" />
        <circle cx="20" cy="74" r="1.4" fill="#38bdf8" />
        <circle cx="32" cy="100" r="1.2" fill="#ffffff" />
        <circle cx="58" cy="108" r="1" fill="#e879f9" />
        <circle cx="74" cy="98" r="1.2" fill="#38bdf8" />
        <circle cx="102" cy="78" r="1.2" fill="#f472b6" />
        <circle cx="114" cy="48" r="1" fill="#ffffff" />
        <circle cx="70" cy="34" r="0.9" fill="#ffffff" />
        <circle cx="86" cy="62" r="1.1" fill="#67e8f9" />
      </g>
    </svg>
  );
};
