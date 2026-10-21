const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

async function generateOGImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <!-- Background Cosmic Gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#190938" />
        <stop offset="50%" stop-color="#0f0720" />
        <stop offset="100%" stop-color="#070210" />
      </linearGradient>

      <!-- Purple Glow Gradient -->
      <radialGradient id="purpleGlow" cx="30%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
      </radialGradient>

      <!-- Pink Glow Gradient -->
      <radialGradient id="pinkGlow" cx="80%" cy="70%" r="50%">
        <stop offset="0%" stop-color="#ec4899" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#ec4899" stop-opacity="0" />
      </radialGradient>

      <!-- Logo Saturn Ring Gradient -->
      <linearGradient id="saturnRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f472b6" />
        <stop offset="50%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#38bdf8" />
      </linearGradient>

      <!-- Logo Planet Gradient -->
      <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7" />
        <stop offset="100%" stop-color="#4c1d95" />
      </linearGradient>

      <!-- Text Gradient -->
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="60%" stop-color="#f3e8ff" />
        <stop offset="100%" stop-color="#e9d5ff" />
      </linearGradient>
    </defs>

    <!-- Background Base -->
    <rect width="1200" height="630" fill="url(#bgGrad)" />
    <rect width="1200" height="630" fill="url(#purpleGlow)" />
    <rect width="1200" height="630" fill="url(#pinkGlow)" />

    <!-- Outer Decorative Border -->
    <rect x="20" y="20" width="1160" height="590" rx="32" fill="none" stroke="#a855f7" stroke-width="2" stroke-opacity="0.25" />
    <rect x="28" y="28" width="1144" height="574" rx="24" fill="none" stroke="#ec4899" stroke-width="1" stroke-opacity="0.15" />

    <!-- Stars & Cosmic Particles -->
    <circle cx="120" cy="100" r="2.5" fill="#e9d5ff" opacity="0.8" />
    <circle cx="340" cy="80" r="1.5" fill="#f472b6" opacity="0.6" />
    <circle cx="950" cy="120" r="3" fill="#c084fc" opacity="0.9" />
    <circle cx="1080" cy="220" r="2" fill="#38bdf8" opacity="0.7" />
    <circle cx="180" cy="500" r="2.5" fill="#f472b6" opacity="0.8" />
    <circle cx="1020" cy="520" r="2" fill="#e9d5ff" opacity="0.6" />
    <circle cx="850" cy="460" r="1.5" fill="#c084fc" opacity="0.5" />

    <!-- Logo Section (Saturn Symbol) -->
    <g transform="translate(180, 235)">
      <!-- Outer Orbit Ring -->
      <ellipse cx="0" cy="0" rx="110" ry="32" fill="none" stroke="url(#saturnRing)" stroke-width="12" transform="rotate(-22)" opacity="0.9" />
      <!-- Planet Sphere -->
      <circle cx="0" cy="0" r="62" fill="url(#planetGrad)" stroke="#d8b4fe" stroke-width="2" />
      <!-- Inner Planet Glow Lines -->
      <path d="M -45 -18 Q 0 10 45 -18" fill="none" stroke="#f472b6" stroke-width="3" opacity="0.5" />
      <path d="M -52 10 Q 0 35 52 10" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.4" />
      <!-- Front Ring Overlap -->
      <path d="M -102 12 A 110 32 0 0 0 98 15" fill="none" stroke="url(#saturnRing)" stroke-width="12" transform="rotate(-22)" />
    </g>

    <!-- Main Title & Tagline -->
    <text x="350" y="240" fill="url(#textGrad)" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" letter-spacing="-1">
      Mikrokosmos
    </text>

    <text x="735" y="240" fill="#f472b6" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="34" letter-spacing="4">
      FANSUB
    </text>

    <!-- Slogan / Subtitle -->
    <text x="352" y="295" fill="#a855f7" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="22" letter-spacing="3">
      SHINE • DREAM • SMILE
    </text>

    <text x="352" y="348" fill="#e9d5ff" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="26">
      Türkçe Webtoon, Manga, Manhua &amp; Web Novel Oku
    </text>

    <!-- Category Badges -->
    <g transform="translate(352, 385)">
      <!-- Badge 1: Webtoon -->
      <rect x="0" y="0" width="130" height="38" rx="12" fill="#9333ea" fill-opacity="0.3" stroke="#c084fc" stroke-width="1.5" />
      <text x="65" y="24" text-anchor="middle" fill="#f3e8ff" font-family="system-ui, sans-serif" font-weight="800" font-size="15">WEBTOON</text>

      <!-- Badge 2: Manga -->
      <rect x="145" y="0" width="110" height="38" rx="12" fill="#e11d48" fill-opacity="0.3" stroke="#fda4af" stroke-width="1.5" />
      <text x="200" y="24" text-anchor="middle" fill="#ffe4e6" font-family="system-ui, sans-serif" font-weight="800" font-size="15">MANGA</text>

      <!-- Badge 3: Web Novel -->
      <rect x="270" y="0" width="140" height="38" rx="12" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.5" />
      <text x="340" y="24" text-anchor="middle" fill="#e0f2fe" font-family="system-ui, sans-serif" font-weight="800" font-size="15">WEB NOVEL</text>
    </g>

    <!-- Domain Badge Footer -->
    <g transform="translate(352, 470)">
      <rect x="0" y="0" width="280" height="48" rx="24" fill="#1e1035" stroke="#a855f7" stroke-width="2" />
      <circle cx="28" cy="24" r="10" fill="#22c55e" />
      <text x="48" y="31" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="900" font-size="20" letter-spacing="1">
        mikrokosmos.fans
      </text>
    </g>

  </svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 }
  });

  const pngData = resvg.render().asPng();
  const outPath = path.join(__dirname, '../public/og-image.png');
  fs.writeFileSync(outPath, pngData);
  console.log('Successfully generated 1200x630 OpenGraph PNG image at:', outPath);
}

generateOGImage().catch(console.error);
