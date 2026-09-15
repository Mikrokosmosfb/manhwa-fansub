const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createIcon(size, isMaskable = false) {
  const png = new PNG({ width: size, height: size });

  const center = size / 2;
  const radius = size / 2;
  const padding = isMaskable ? size * 0.15 : 0;
  const drawAreaSize = size - padding * 2;
  const drawCenter = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Background: Deep cosmic purple (#3b0764 to #581c87 radial gradient)
      const dx = (x - center) / radius;
      const dy = (y - center) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = Math.round(59 + (88 - 59) * (1 - Math.min(dist, 1)));
      let g = Math.round(7 + (28 - 7) * (1 - Math.min(dist, 1)));
      let b = Math.round(100 + (135 - 100) * (1 - Math.min(dist, 1)));
      let alpha = 255;

      if (!isMaskable) {
        // Rounded corners for standard icon
        const cornerRadius = size * 0.22;
        const normX = Math.abs(x - center) - (center - cornerRadius);
        const normY = Math.abs(y - center) - (center - cornerRadius);
        if (normX > 0 && normY > 0) {
          const cornerDist = Math.sqrt(normX * normX + normY * normY);
          if (cornerDist > cornerRadius) {
            alpha = 0;
          }
        }
      }

      // Draw stylized "M" with cosmic ring/glow inside inner draw area
      const ix = (x - drawCenter) / (drawAreaSize / 2);
      const iy = (y - drawCenter) / (drawAreaSize / 2);

      // Saturn/Galaxy ring ellipse
      const ringEq = Math.pow(ix * 1.2 + iy * 0.5, 2) / 0.8 + Math.pow(iy * 0.5 - ix * 0.2, 2) / 0.15;
      const isRing = ringEq >= 0.8 && ringEq <= 1.1;

      // "M" shape test
      let isM = false;
      const mx = Math.abs(ix);
      const my = iy;

      // Outer pillars of M
      if (mx >= 0.45 && mx <= 0.65 && my >= -0.55 && my <= 0.55) {
        isM = true;
      }
      // Diagonal strokes of M
      if (mx <= 0.45 && my >= -0.55) {
        const diagLeft = -0.55 + (0.45 - mx) * 1.8;
        const diagRight = -0.55 + (0.45 - mx) * 2.4;
        if (my >= diagLeft - 0.1 && my <= diagRight + 0.1 && my <= 0.1) {
          isM = true;
        }
      }

      // Star sparkle (top right)
      const sx = ix - 0.5;
      const sy = iy + 0.55;
      const isStar = (Math.abs(sx) < 0.04 && Math.abs(sy) < 0.2) || (Math.abs(sx) < 0.2 && Math.abs(sy) < 0.04);

      if (alpha > 0) {
        if (isM) {
          // Cyan/White bright gradient for M
          const mRatio = (iy + 0.55) / 1.1;
          r = Math.round(236 * (1 - mRatio) + 168 * mRatio);
          g = Math.round(254 * (1 - mRatio) + 85 * mRatio);
          b = Math.round(255 * (1 - mRatio) + 247 * mRatio);
        } else if (isStar) {
          r = 255;
          g = 230;
          b = 150;
        } else if (isRing) {
          // Purple / Amber glowing ring
          r = 217;
          g = 119;
          b = 227;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = alpha;
    }
  }

  return PNG.sync.write(png);
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating PWA icons...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createIcon(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createIcon(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createIcon(180));

console.log('PWA Icons successfully generated in /public!');
