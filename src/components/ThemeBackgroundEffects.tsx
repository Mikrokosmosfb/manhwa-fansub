import React from 'react';

interface ThemeBackgroundEffectsProps {
  effectOverlay?: string;
}

const FourPointStar = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={`w-3.5 h-3.5 ${className}`} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

export const ThemeBackgroundEffects: React.FC<ThemeBackgroundEffectsProps> = ({ effectOverlay }) => {
  if (!effectOverlay) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
      {/* 1. SHOOTING STARS (KAYAN YILDIZLAR & METEOR YAĞMURU) */}
      {effectOverlay === 'shooting_star' && (
        <div className="absolute inset-0">
          {/* Cosmic Sky Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-indigo-900/10 to-transparent" />
          
          {/* Background Starfield Twinkles */}
          <FourPointStar className="absolute top-2 left-6 text-cyan-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-1/3 text-sky-300 animate-starburst-2" />
          <FourPointStar className="absolute top-3 right-12 text-white animate-starburst-3" />
          <div className="absolute bottom-2 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" />

          {/* Shooting Star Streaks with glowing comet heads */}
          <div className="absolute top-0 right-8 w-36 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-white shadow-[0_0_15px_#22d3ee] animate-shooting-star-1">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
          </div>
          <div className="absolute top-2 right-28 w-28 h-[1.5px] bg-gradient-to-r from-transparent via-sky-300 to-white shadow-[0_0_10px_#38bdf8] animate-shooting-star-2">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="absolute top-4 right-44 w-32 h-[2px] bg-gradient-to-r from-transparent via-indigo-300 to-white shadow-[0_0_12px_#818cf8] animate-shooting-star-3">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>
      )}

      {/* 2. SATURN (SATÜRN HALKALARI & KOZMİK GEZEGEN) */}
      {effectOverlay === 'saturn' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-indigo-950/20 to-transparent" />
          
          {/* Animated Floating Saturn Planet Graphic */}
          <div className="absolute -top-3 -right-2 opacity-60 sm:opacity-75 animate-saturn-float">
            <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="22" fill="url(#saturnGradient)" className="drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              <ellipse cx="50" cy="50" rx="44" ry="13" stroke="url(#ringGradient)" strokeWidth="3.5" transform="rotate(-22 50 50)" className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <ellipse cx="50" cy="50" rx="36" ry="10" stroke="url(#ringInnerGradient)" strokeWidth="1.5" transform="rotate(-22 50 50)" opacity="0.8" />
              <defs>
                <radialGradient id="saturnGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(42 42) rotate(45) scale(28)">
                  <stop stopColor="#fef08a" />
                  <stop offset="0.5" stopColor="#f59e0b" />
                  <stop offset="1" stopColor="#78350f" />
                </radialGradient>
                <linearGradient id="ringGradient" x1="0" y1="0" x2="100" y2="100">
                  <stop stopColor="#fbbf24" />
                  <stop offset="0.5" stopColor="#fef08a" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="ringInnerGradient" x1="0" y1="0" x2="100" y2="100">
                  <stop stopColor="#ffffff" />
                  <stop offset="1" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Orbital Dust & Starbursts */}
          <FourPointStar className="absolute top-2 left-8 text-amber-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-1/3 text-yellow-200 animate-starburst-2" />
          <div className="absolute bottom-2 right-12 w-2 h-2 bg-amber-300/80 rounded-full animate-ping" />
        </div>
      )}

      {/* 3. NEBULA (NEBULA GALAKSİ & YILDIZ KÜMESİ) */}
      {effectOverlay === 'nebula' && (
        <div className="absolute inset-0">
          {/* Vibrant Glowing Nebula Clouds */}
          <div className="absolute -top-8 -left-8 w-44 h-44 bg-purple-600/35 rounded-full blur-xl animate-nebula-drift" />
          <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-fuchsia-600/35 rounded-full blur-xl animate-nebula-drift delay-1000" />
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-28 h-28 bg-cyan-500/20 rounded-full blur-lg animate-pulse" />

          {/* Sparkling Starbursts */}
          <FourPointStar className="absolute top-2 right-10 text-fuchsia-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-8 text-cyan-200 animate-starburst-2" />
          <FourPointStar className="absolute top-1/2 right-1/3 text-white animate-starburst-3" />
          <div className="absolute bottom-2 right-1/4 w-1.5 h-1.5 bg-fuchsia-200 rounded-full animate-ping" />
        </div>
      )}

      {/* 4. SUPERNOVA (SÜPERNOVA PATLAMASI & GÜNEŞ FIRTINASI) */}
      {effectOverlay === 'supernova' && (
        <div className="absolute inset-0">
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-36 h-36 bg-amber-400/25 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-0 right-0 w-28 h-full bg-gradient-to-l from-orange-500/20 to-transparent" />
          
          {/* Floating Flame Embers */}
          <div className="absolute bottom-1 right-8 w-2 h-2 bg-amber-300 rounded-full animate-ember-1 shadow-[0_0_8px_#f59e0b]" />
          <div className="absolute bottom-2 right-20 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ember-2 shadow-[0_0_6px_#fb923c]" />
          <div className="absolute bottom-1 right-36 w-2 h-2 bg-yellow-200 rounded-full animate-ember-3" />
          <FourPointStar className="absolute top-2 left-10 text-amber-300 animate-starburst-1" />
        </div>
      )}

      {/* 5. DIVINE WINGS (İLAHİ YÜKSELİŞ & KUTSAL ALTIN) */}
      {effectOverlay === 'divine_wings' && (
        <div className="absolute inset-0">
          {/* Shimmer Light Beam */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent animate-shimmer-ray" />
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-300/10 via-amber-200/5 to-transparent" />
          
          {/* Golden Stardust Embers */}
          <div className="absolute bottom-1 left-10 w-2 h-2 bg-yellow-200 rounded-full animate-ember-1 shadow-[0_0_8px_#fef08a]" />
          <div className="absolute bottom-2 right-1/3 w-1.5 h-1.5 bg-amber-300 rounded-full animate-ember-2 shadow-[0_0_6px_#f59e0b]" />
          <FourPointStar className="absolute top-2 right-8 text-yellow-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-1/4 text-amber-300 animate-starburst-2" />
        </div>
      )}

      {/* 6. STARDUST (YILDIZ TOZU) */}
      {effectOverlay === 'stardust' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/10 via-purple-900/10 to-transparent" />
          <FourPointStar className="absolute top-2 left-10 text-pink-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 right-12 text-purple-300 animate-starburst-2" />
          <FourPointStar className="absolute top-3 right-1/3 text-white animate-starburst-3" />
          <div className="absolute bottom-2 left-1/3 w-1.5 h-1.5 bg-pink-200 rounded-full animate-ping" />
        </div>
      )}

      {/* 7. DRAGON FIRE (EJDER ATEŞİ & ALEV EMBERS) */}
      {effectOverlay === 'dragon_fire' && (
        <div className="absolute inset-0">
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-red-600/30 via-orange-500/10 to-transparent" />
          <div className="absolute bottom-1 left-10 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ember-1 shadow-[0_0_8px_#fbbf24]" />
          <div className="absolute bottom-1 right-16 w-2 h-2 bg-red-400 rounded-full animate-ember-2 shadow-[0_0_8px_#f87171]" />
          <div className="absolute bottom-2 left-1/2 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ember-3" />
        </div>
      )}

      {/* 8. FROST CRYSTAL (BUZ KIRAĞI & KRİSTAL) */}
      {effectOverlay === 'frost_crystal' && (
        <div className="absolute inset-0">
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-sky-400/20 via-blue-500/5 to-transparent" />
          <FourPointStar className="absolute top-2 right-8 text-sky-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-10 text-blue-100 animate-starburst-2" />
          <div className="absolute top-2 left-1/3 text-sky-200/80 text-xs animate-pulse">❄</div>
        </div>
      )}

      {/* 9. VOID PORTAL (KARADELİK PORTAL) */}
      {effectOverlay === 'void_portal' && (
        <div className="absolute inset-0">
          <div className="absolute -top-14 -right-14 w-40 h-40 border-2 border-purple-500/40 rounded-full animate-void-spin shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
          <div className="absolute -top-10 -right-10 w-32 h-32 border border-fuchsia-400/50 rounded-full animate-void-spin" />
          <FourPointStar className="absolute bottom-3 left-10 text-purple-300 animate-starburst-1" />
        </div>
      )}

      {/* 10. LIGHTNING PLASMA (PLAZMA ŞİMŞEK) */}
      {effectOverlay === 'lightning_plasma' && (
        <div className="absolute inset-0 animate-plasma-arc border-2 border-cyan-400/50 rounded-2xl pointer-events-none">
          <div className="absolute top-2 left-1/3 w-2 h-2 bg-cyan-300 rounded-full animate-ping" />
          <FourPointStar className="absolute top-2 right-10 text-cyan-200 animate-starburst-1" />
        </div>
      )}

      {/* 11. MOON STARS (GECE YARISI HİLAL AY) */}
      {effectOverlay === 'moon_stars' && (
        <div className="absolute inset-0">
          <div className="absolute top-2 right-6 opacity-80 filter drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">
            <svg className="w-8 h-8 text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z" />
            </svg>
          </div>
          <FourPointStar className="absolute top-3 left-10 text-sky-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-1/2 text-indigo-300 animate-starburst-2" />
        </div>
      )}

      {/* 12. SAKURA BLOOM (SAKURA PEMBE PETALS) */}
      {effectOverlay === 'sakura_bloom' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-900/10 to-transparent" />
          <div className="absolute top-0 left-8 text-pink-300 text-xs animate-sakura-1">🌸</div>
          <div className="absolute top-0 left-1/3 text-pink-400 text-sm animate-sakura-2">🌸</div>
          <div className="absolute top-0 right-1/4 text-rose-300 text-xs animate-sakura-3">🌸</div>
          <div className="absolute top-0 right-8 text-pink-200 text-sm animate-sakura-4">🌸</div>
        </div>
      )}

      {/* 13. EMERALD POISON (ZÜMRÜT ZEHİR) */}
      {effectOverlay === 'emerald_poison' && (
        <div className="absolute inset-0">
          <div className="absolute bottom-1 left-12 w-2 h-2 bg-emerald-400/90 rounded-full animate-ember-1 shadow-[0_0_8px_#34d399]" />
          <div className="absolute bottom-2 right-12 w-1.5 h-1.5 bg-teal-300/90 rounded-full animate-ember-2 shadow-[0_0_6px_#5eead4]" />
          <FourPointStar className="absolute top-2 right-8 text-emerald-300 animate-starburst-1" />
        </div>
      )}

      {/* 14. NIGHT LOTUS (KUTSAL GECE NİLÜFERİ) */}
      {effectOverlay === 'night_lotus' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 via-indigo-950/20 to-cyan-950/30" />
          {/* Glowing Lotus Blossoms Graphic */}
          <div className="absolute -bottom-2 -left-2 opacity-80 animate-lotus-pulse">
            <svg className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 15 C40 35, 20 45, 10 50 C25 65, 45 60, 50 85 C55 60, 75 65, 90 50 C80 45, 60 35, 50 15 Z" fill="url(#lotusGrad1)" opacity="0.9" />
              <path d="M50 30 C42 45, 28 50, 20 55 C32 65, 45 62, 50 80 C55 62, 68 65, 80 55 C72 50, 58 45, 50 30 Z" fill="url(#lotusGrad2)" />
              <circle cx="50" cy="55" r="5" fill="#fef08a" className="animate-ping" />
              <defs>
                <linearGradient id="lotusGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="lotusGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bae6fd" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute top-1 right-4 opacity-70 animate-lotus-pulse delay-700">
            <svg className="w-12 h-12 text-sky-200 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 15 C40 35, 20 45, 10 50 C25 65, 45 60, 50 85 C55 60, 75 65, 90 50 C80 45, 60 35, 50 15 Z" fill="#7dd3fc" />
            </svg>
          </div>
          <FourPointStar className="absolute top-2 left-1/3 text-cyan-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 right-1/4 text-indigo-200 animate-starburst-2" />
          <div className="absolute top-3 left-12 w-2 h-2 bg-cyan-300 rounded-full animate-ping" />
        </div>
      )}

      {/* 15. MOON FURIN (DOLUNAY & SAKURA CAM RÜZGAR ÇANI) */}
      {effectOverlay === 'moon_furin' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-neutral-950 to-slate-900" />
          {/* Silver Moon */}
          <div className="absolute -top-3 left-6 w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 opacity-85 shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
          
          {/* Glass Furin Windchime Graphic Hanging */}
          <div className="absolute top-0 right-8 origin-top animate-swing-pendulum">
            <svg className="w-10 h-24" viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* String */}
              <line x1="30" y1="0" x2="30" y2="30" stroke="#f472b6" strokeWidth="1.5" />
              {/* Glass Bowl */}
              <path d="M15 30 C15 15, 45 15, 45 30 C45 48, 15 48, 15 30 Z" fill="rgba(253, 164, 175, 0.35)" stroke="#f472b6" strokeWidth="2" className="drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
              {/* Inner Clapper */}
              <circle cx="30" cy="48" r="3" fill="#f43f5e" />
              <line x1="30" y1="48" x2="30" y2="70" stroke="#f472b6" strokeWidth="1.5" />
              {/* Hanging Paper Strip (Tanzaku) */}
              <rect x="23" y="70" width="14" height="45" rx="2" fill="url(#furinPaper)" stroke="#fb7185" strokeWidth="1" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
              <circle cx="30" cy="85" r="2" fill="#f43f5e" />
              <circle cx="30" cy="100" r="1.5" fill="#f43f5e" />
              <defs>
                <linearGradient id="furinPaper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fecdd3" />
                  <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute top-1 right-24 text-pink-300 text-xs animate-sakura-1">🌸</div>
          <div className="absolute bottom-2 left-10 text-rose-200 text-xs animate-sakura-2">🌸</div>
          <FourPointStar className="absolute bottom-2 right-1/3 text-slate-200 animate-starburst-1" />
        </div>
      )}

      {/* 16. PURPLE MOON BUTTERFLY (EFLATUN DOLUNAY & BÜYÜLÜ KELEBEK) */}
      {effectOverlay === 'purple_moon_butterfly' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/50 via-slate-950 to-indigo-950/40" />
          {/* Glowing Purple Moon */}
          <div className="absolute -top-4 -right-2 w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-100 via-purple-200 to-indigo-300 opacity-90 shadow-[0_0_25px_rgba(232,121,249,0.8)]" />
          
          {/* Glowing Butterfly 1 */}
          <div className="absolute top-2 left-6 text-fuchsia-300 animate-butterfly-1 drop-shadow-[0_0_10px_rgba(232,121,249,0.9)]">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12C10 7 4 4 2 8C0 12 5 16 11 13C5 18 2 22 6 22C10 22 11 16 12 12ZM12 12C14 7 20 4 22 8C24 12 19 16 13 13C19 18 22 22 18 22C14 22 13 16 12 12Z" />
            </svg>
          </div>
          {/* Glowing Butterfly 2 */}
          <div className="absolute bottom-2 left-1/2 text-purple-200 animate-butterfly-2 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12C10 7 4 4 2 8C0 12 5 16 11 13C5 18 2 22 6 22C10 22 11 16 12 12ZM12 12C14 7 20 4 22 8C24 12 19 16 13 13C19 18 22 22 18 22C14 22 13 16 12 12Z" />
            </svg>
          </div>
          <FourPointStar className="absolute top-1/2 left-8 text-fuchsia-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 right-10 text-purple-200 animate-starburst-2" />
        </div>
      )}

      {/* 17. NIGHT LANTERNS (GECE BAHÇESİ & SARAY FENERİ) */}
      {effectOverlay === 'night_lanterns' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-zinc-950 to-rose-950/60" />
          
          {/* Hanging Oriental Lantern 1 */}
          <div className="absolute top-0 right-6 origin-top animate-swing-pendulum">
            <svg className="w-10 h-24" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="30" y1="0" x2="30" y2="20" stroke="#fcd34d" strokeWidth="1.5" />
              {/* Roof */}
              <path d="M10 20 L50 20 L40 28 L20 28 Z" fill="#92400e" stroke="#fcd34d" strokeWidth="1" />
              {/* Glass Frame */}
              <rect x="15" y="28" width="30" height="40" rx="3" fill="url(#lanternGlow)" stroke="#fcd34d" strokeWidth="1.5" className="drop-shadow-[0_0_12px_rgba(252,211,77,0.95)]" />
              {/* Tassel */}
              <line x1="30" y1="68" x2="30" y2="100" stroke="#f43f5e" strokeWidth="2" />
              <circle cx="30" cy="72" r="3" fill="#fcd34d" />
              <defs>
                <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* Hanging Oriental Lantern 2 (Smaller & Delayed) */}
          <div className="absolute top-0 right-20 origin-top animate-swing-pendulum-delayed opacity-85">
            <svg className="w-8 h-20" viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="30" y1="0" x2="30" y2="25" stroke="#fcd34d" strokeWidth="1.5" />
              <rect x="18" y="25" width="24" height="32" rx="2" fill="url(#lanternGlow)" stroke="#fcd34d" strokeWidth="1" className="drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]" />
              <line x1="30" y1="57" x2="30" y2="85" stroke="#f43f5e" strokeWidth="1.5" />
            </svg>
          </div>

          <FourPointStar className="absolute bottom-2 left-8 text-amber-200 animate-starburst-1" />
          <div className="absolute top-3 left-10 text-rose-300 text-xs animate-sakura-1">🌸</div>
        </div>
      )}

      {/* 19. CRIMSON MOON ROMANCE (KIZIL DOLUNAY & GEYİK BOYNUZLU AKÇAAĞAÇ YAPRAKLARI) */}
      {effectOverlay === 'crimson_moon_romance' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-950/40 via-stone-950/50 to-rose-950/40" />
          
          {/* Falling Red Maple Leaves */}
          <div className="absolute top-0 left-8 text-red-500 text-base animate-petal-rain-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]">🍁</div>
          <div className="absolute top-0 left-1/3 text-rose-400 text-xs animate-petal-rain-2 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]">🍁</div>
          <div className="absolute top-0 left-2/3 text-red-600 text-sm animate-petal-rain-3 drop-shadow-[0_0_10px_rgba(220,38,38,0.9)]">🍁</div>
          <div className="absolute top-0 right-10 text-amber-500 text-xs animate-petal-rain-4 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🍁</div>

          <FourPointStar className="absolute top-2 right-1/4 text-red-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-3 left-10 text-amber-200 animate-starburst-2" />
          <div className="absolute top-3 left-1/4 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
};

