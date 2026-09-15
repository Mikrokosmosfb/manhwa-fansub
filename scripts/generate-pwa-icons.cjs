const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');
const rawSvg = fs.readFileSync(svgPath, 'utf8');

function renderSvgToPng(svgString, targetSize) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: targetSize,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

// 1. Standard Icon SVG with deep dark background (#0f0720) and full Saturn logo
function buildPwaSvg(paddingPercent = 0.08) {
  const padding = 120 * paddingPercent;
  const innerSize = 120 - padding * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <!-- Dark Cosmic Background -->
    <rect width="120" height="120" rx="24" fill="#0f0720" />
    <g transform="translate(${padding}, ${padding}) scale(${innerSize / 120})">
      ${rawSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
    </g>
  </svg>`;
}

// 2. Maskable Icon SVG with 15% padding safe-zone
function buildMaskableSvg() {
  const padding = 120 * 0.15;
  const innerSize = 120 - padding * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <!-- Full-bleed background for maskable shape cropping -->
    <rect width="120" height="120" fill="#0f0720" />
    <g transform="translate(${padding}, ${padding}) scale(${innerSize / 120})">
      ${rawSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
    </g>
  </svg>`;
}

console.log('Rendering favicon.svg into PWA PNG icons using Resvg...');

const stdSvg = buildPwaSvg(0.08);
const maskSvg = buildMaskableSvg();

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderSvgToPng(stdSvg, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderSvgToPng(stdSvg, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderSvgToPng(stdSvg, 180));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderSvgToPng(maskSvg, 512));

// Also copy favicon.svg to icon.svg so both exist
fs.writeFileSync(path.join(publicDir, 'icon.svg'), rawSvg);

console.log('PWA Icons successfully generated directly from site favicon.svg!');
