import React from 'react';

interface ThemeBackgroundEffectsProps {
  effectOverlay?: string;
  isHero?: boolean;
}

const FourPointStar = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${className}`} style={style} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

export const ThemeBackgroundEffects: React.FC<ThemeBackgroundEffectsProps> = ({ effectOverlay, isHero = false }) => {
  if (!effectOverlay) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
      {/* 1. SHOOTING STARS (KAYAN YILDIZLAR & METEOR YAĞMURU) */}
      {effectOverlay === 'shooting_star' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-indigo-900/10 to-transparent" />
          
          <FourPointStar className="absolute top-3 left-6 text-cyan-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-1/3 text-sky-300 animate-starburst-2" />
          <FourPointStar className="absolute top-4 right-16 text-white animate-starburst-3" />
          <FourPointStar className="absolute bottom-12 right-1/4 text-cyan-300 animate-starburst-1" />
          <div className="absolute bottom-4 right-1/3 w-2 h-2 bg-cyan-300 rounded-full animate-ping" />

          {/* Shooting Star Streaks */}
          <div className={`absolute top-0 right-10 ${isHero ? 'w-64 sm:w-96 h-[3px]' : 'w-44 sm:w-60 h-[2px]'} bg-gradient-to-r from-transparent via-cyan-300 to-white shadow-[0_0_20px_#22d3ee] animate-shooting-star-1`}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_#ffffff]" />
          </div>
          <div className={`absolute top-4 right-36 ${isHero ? 'w-52 sm:w-80 h-[2.5px]' : 'w-36 sm:w-48 h-[2px]'} bg-gradient-to-r from-transparent via-sky-300 to-white shadow-[0_0_15px_#38bdf8] animate-shooting-star-2`}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
          </div>
          <div className={`absolute top-8 right-64 ${isHero ? 'w-60 sm:w-88 h-[3px]' : 'w-40 sm:w-52 h-[2px]'} bg-gradient-to-r from-transparent via-indigo-300 to-white shadow-[0_0_18px_#818cf8] animate-shooting-star-3`}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff]" />
          </div>
        </div>
      )}

      {/* 2. SATURN (SATÜRN HALKALARI & KOZMİK GEZEGEN) */}
      {effectOverlay === 'saturn' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-indigo-950/20 to-transparent" />
          
          <div className={`absolute -top-4 -right-4 opacity-80 sm:opacity-90 animate-saturn-float ${isHero ? 'w-48 h-48 sm:w-64 sm:h-64' : 'w-28 h-28 sm:w-36 sm:h-36'}`}>
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="22" fill="url(#saturnGradient)" className="drop-shadow-[0_0_18px_rgba(251,191,36,0.8)]" />
              <ellipse cx="50" cy="50" rx="44" ry="13" stroke="url(#ringGradient)" strokeWidth="3.5" transform="rotate(-22 50 50)" className="drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
              <ellipse cx="50" cy="50" rx="36" ry="10" stroke="url(#ringInnerGradient)" strokeWidth="1.5" transform="rotate(-22 50 50)" opacity="0.9" />
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
          
          <FourPointStar className="absolute top-4 left-10 text-amber-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-1/3 text-yellow-200 animate-starburst-2" />
          <FourPointStar className="absolute top-1/2 left-1/4 text-amber-200 animate-starburst-3" />
          <div className="absolute bottom-4 right-16 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
        </div>
      )}

      {/* 3. NEBULA (NEBULA GALAKSİ & YILDIZ KÜMESİ) */}
      {effectOverlay === 'nebula' && (
        <div className="absolute inset-0">
          <div className={`absolute -top-12 -left-12 ${isHero ? 'w-96 h-96' : 'w-60 h-60'} bg-purple-600/40 rounded-full blur-2xl animate-nebula-drift`} />
          <div className={`absolute -bottom-12 -right-12 ${isHero ? 'w-96 h-96' : 'w-60 h-60'} bg-fuchsia-600/40 rounded-full blur-2xl animate-nebula-drift delay-1000`} />
          <div className={`absolute top-1/2 left-1/3 -translate-y-1/2 ${isHero ? 'w-64 h-64' : 'w-40 h-40'} bg-cyan-500/25 rounded-full blur-xl animate-pulse`} />

          <FourPointStar className="absolute top-4 right-14 text-fuchsia-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-12 text-cyan-200 animate-starburst-2" />
          <FourPointStar className="absolute top-1/2 right-1/3 text-white animate-starburst-3" />
          <FourPointStar className="absolute top-1/3 left-16 text-purple-200 animate-starburst-2" />
          <div className="absolute bottom-4 right-1/4 w-2 h-2 bg-fuchsia-200 rounded-full animate-ping" />
        </div>
      )}

      {/* 4. SUPERNOVA (SÜPERNOVA PATLAMASI & GÜNEŞ FIRTINASI) */}
      {effectOverlay === 'supernova' && (
        <div className="absolute inset-0">
          <div className={`absolute top-1/2 right-10 -translate-y-1/2 ${isHero ? 'w-80 h-80' : 'w-52 h-52'} bg-amber-400/30 rounded-full blur-2xl animate-pulse`} />
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/25 to-transparent" />
          
          <div className="absolute bottom-4 right-12 w-3 h-3 bg-amber-300 rounded-full animate-ember-1 shadow-[0_0_12px_#f59e0b]" />
          <div className="absolute bottom-8 right-28 w-2.5 h-2.5 bg-orange-400 rounded-full animate-ember-2 shadow-[0_0_10px_#fb923c]" />
          <div className="absolute bottom-4 right-48 w-2.5 h-2.5 bg-yellow-200 rounded-full animate-ember-3" />
          <FourPointStar className="absolute top-4 left-14 text-amber-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-8 left-1/3 text-orange-200 animate-starburst-2" />
        </div>
      )}

      {/* 5. DIVINE WINGS (İLAHİ YÜKSELİŞ & KUTSAL ALTIN) */}
      {effectOverlay === 'divine_wings' && (
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-transparent via-yellow-200/25 to-transparent animate-shimmer-ray" />
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-300/15 via-amber-200/10 to-transparent" />
          
          <div className="absolute bottom-4 left-14 w-3 h-3 bg-yellow-200 rounded-full animate-ember-1 shadow-[0_0_12px_#fef08a]" />
          <div className="absolute bottom-8 right-1/3 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ember-2 shadow-[0_0_10px_#f59e0b]" />
          <FourPointStar className="absolute top-4 right-12 text-yellow-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-1/4 text-amber-300 animate-starburst-2" />
          <FourPointStar className="absolute top-1/2 left-12 text-amber-200 animate-starburst-3" />
        </div>
      )}

      {/* 6. STARDUST (YILDIZ TOZU) */}
      {effectOverlay === 'stardust' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/15 via-purple-900/15 to-transparent" />
          <FourPointStar className="absolute top-4 left-12 text-pink-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 right-16 text-purple-300 animate-starburst-2" />
          <FourPointStar className="absolute top-6 right-1/3 text-white animate-starburst-3" />
          <FourPointStar className="absolute bottom-1/3 left-1/4 text-pink-200 animate-starburst-1" />
          <div className="absolute bottom-4 left-1/3 w-2 h-2 bg-pink-200 rounded-full animate-ping" />
        </div>
      )}

      {/* 7. DRAGON FIRE (EJDER ATEŞİ & ALEV EMBERS) */}
      {effectOverlay === 'dragon_fire' && (
        <div className="absolute inset-0">
          <div className={`absolute bottom-0 inset-x-0 ${isHero ? 'h-32' : 'h-20'} bg-gradient-to-t from-red-600/35 via-orange-500/15 to-transparent`} />
          <div className="absolute bottom-3 left-12 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ember-1 shadow-[0_0_12px_#fbbf24]" />
          <div className="absolute bottom-4 right-20 w-3 h-3 bg-red-400 rounded-full animate-ember-2 shadow-[0_0_12px_#f87171]" />
          <div className="absolute bottom-6 left-1/2 w-2.5 h-2.5 bg-orange-300 rounded-full animate-ember-3 shadow-[0_0_8px_#fdba74]" />
          <div className="absolute bottom-2 right-1/3 w-3 h-3 bg-amber-300 rounded-full animate-ember-1 shadow-[0_0_10px_#f59e0b]" />
        </div>
      )}

      {/* 8. FROST CRYSTAL (BUZ KIRAĞI & KRİSTAL) */}
      {effectOverlay === 'frost_crystal' && (
        <div className="absolute inset-0">
          <div className={`absolute top-0 inset-x-0 ${isHero ? 'h-24' : 'h-14'} bg-gradient-to-b from-sky-400/25 via-blue-500/10 to-transparent`} />
          <FourPointStar className="absolute top-3 right-12 text-sky-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-14 text-blue-100 animate-starburst-2" />
          <FourPointStar className="absolute top-1/2 left-1/3 text-cyan-200 animate-starburst-3" />
          <div className="absolute top-4 left-1/3 text-sky-200 text-base sm:text-xl animate-pulse">❄</div>
          <div className="absolute top-6 right-1/4 text-blue-100 text-sm sm:text-lg animate-pulse delay-500">❄</div>
        </div>
      )}

      {/* 9. VOID PORTAL (KARADELİK PORTAL) */}
      {effectOverlay === 'void_portal' && (
        <div className="absolute inset-0">
          <div className={`absolute -top-16 -right-16 ${isHero ? 'w-72 h-72 sm:w-96 sm:h-96' : 'w-48 h-48 sm:w-60 sm:h-60'} border-2 border-purple-500/45 rounded-full animate-void-spin shadow-[0_0_30px_rgba(168,85,247,0.45)]`} />
          <div className={`absolute -top-10 -right-10 ${isHero ? 'w-56 h-56 sm:w-72 sm:h-72' : 'w-36 h-36 sm:w-44 sm:h-44'} border border-fuchsia-400/60 rounded-full animate-void-spin`} />
          <FourPointStar className="absolute bottom-6 left-14 text-purple-300 animate-starburst-1" />
          <FourPointStar className="absolute top-1/2 left-1/4 text-fuchsia-300 animate-starburst-2" />
        </div>
      )}

      {/* 10. LIGHTNING PLASMA (PLAZMA ŞİMŞEK) */}
      {effectOverlay === 'lightning_plasma' && (
        <div className="absolute inset-0 animate-plasma-arc border-2 border-cyan-400/60 rounded-2xl pointer-events-none">
          <div className="absolute top-3 left-1/3 w-3 h-3 bg-cyan-300 rounded-full animate-ping" />
          <FourPointStar className="absolute top-3 right-12 text-cyan-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-1/4 text-sky-300 animate-starburst-2" />
        </div>
      )}

      {/* 11. MOON STARS (GECE YARISI HİLAL AY) */}
      {effectOverlay === 'moon_stars' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-2 right-8 opacity-75 filter drop-shadow-[0_0_15px_rgba(129,140,248,0.8)] pointer-events-none ${isHero ? 'w-16 h-16 sm:w-24 sm:h-24' : 'w-10 h-10 sm:w-14 sm:h-14'}`}>
            <svg className="w-full h-full text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 3z" />
            </svg>
          </div>
          <FourPointStar className="absolute top-4 left-12 text-sky-200/70 animate-starburst-1" />
          <FourPointStar className="absolute top-12 right-28 text-indigo-300/60 animate-starburst-2" />
          <FourPointStar className="absolute bottom-6 left-1/3 text-purple-200/60 animate-starburst-3" />
        </div>
      )}

      {/* 12. SAKURA BLOOM (SAKURA PEMBE PETALS) */}
      {effectOverlay === 'sakura_bloom' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-900/15 to-transparent" />
          <div className={`absolute top-0 left-8 text-pink-300 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-lg'} animate-sakura-1 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]`}>🌸</div>
          <div className={`absolute top-0 left-1/3 text-pink-400 ${isHero ? 'text-2xl sm:text-4xl' : 'text-base sm:text-xl'} animate-sakura-2 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]`}>🌸</div>
          <div className={`absolute top-0 right-1/4 text-rose-300 ${isHero ? 'text-lg sm:text-2xl' : 'text-xs sm:text-base'} animate-sakura-3 drop-shadow-[0_0_6px_rgba(251,113,133,0.8)]`}>🌸</div>
          <div className={`absolute top-0 right-10 text-pink-200 ${isHero ? 'text-2xl sm:text-3xl' : 'text-sm sm:text-lg'} animate-sakura-4 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]`}>🌸</div>
          <div className={`absolute top-0 left-2/3 text-pink-300 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-lg'} animate-sakura-1 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]`}>🌸</div>
        </div>
      )}

      {/* 13. EMERALD POISON (ZÜMRÜT ZEHİR) */}
      {effectOverlay === 'emerald_poison' && (
        <div className="absolute inset-0">
          <div className="absolute bottom-3 left-14 w-3 h-3 bg-emerald-400 rounded-full animate-ember-1 shadow-[0_0_12px_#34d399]" />
          <div className="absolute bottom-6 right-16 w-2.5 h-2.5 bg-teal-300 rounded-full animate-ember-2 shadow-[0_0_10px_#5eead4]" />
          <FourPointStar className="absolute top-4 right-12 text-emerald-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-1/3 text-teal-200 animate-starburst-2" />
        </div>
      )}

      {/* 14. NIGHT LOTUS (KUTSAL GECE NİLÜFERİ) */}
      {effectOverlay === 'night_lotus' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 via-indigo-950/20 to-cyan-950/30" />
          
          {/* Main Glowing Lotus */}
          <div className={`absolute -bottom-2 -left-2 opacity-90 animate-lotus-pulse ${isHero ? 'w-28 h-28 sm:w-44 sm:h-44' : 'w-18 h-18 sm:w-26 sm:h-26'}`}>
            <svg className="w-full h-full text-cyan-300 drop-shadow-[0_0_16px_rgba(34,211,238,0.95)]" viewBox="0 0 100 100" fill="currentColor">
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

          {/* Secondary Floating Lotus */}
          <div className={`absolute top-2 right-6 opacity-80 animate-lotus-pulse delay-700 ${isHero ? 'w-20 h-20 sm:w-32 sm:h-32' : 'w-14 h-14 sm:w-18 sm:h-18'}`}>
            <svg className="w-full h-full text-sky-200 drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 15 C40 35, 20 45, 10 50 C25 65, 45 60, 50 85 C55 60, 75 65, 90 50 C80 45, 60 35, 50 15 Z" fill="#7dd3fc" />
            </svg>
          </div>
          
          <FourPointStar className="absolute top-4 left-1/3 text-cyan-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 right-1/4 text-indigo-200 animate-starburst-2" />
          <div className="absolute top-4 left-14 w-2.5 h-2.5 bg-cyan-300 rounded-full animate-ping" />
        </div>
      )}

      {/* 15. MOON FURIN (DOLUNAY & SAKURA CAM RÜZGAR ÇANI) */}
      {effectOverlay === 'moon_furin' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-neutral-950 to-slate-900" />
          
          {/* Silver Moon */}
          <div className={`absolute -top-6 left-6 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 opacity-90 shadow-[0_0_30px_rgba(255,255,255,0.85)] ${isHero ? 'w-28 h-28 sm:w-48 sm:h-48' : 'w-16 h-16 sm:w-24 sm:h-24'}`} />
          
          {/* Glass Furin Windchime Graphic Hanging */}
          <div className={`absolute top-0 right-8 origin-top animate-swing-pendulum ${isHero ? 'w-20 h-48 sm:w-28 sm:h-64' : 'w-12 h-32 sm:w-16 sm:h-40'}`}>
            <svg className="w-full h-full" viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="30" y1="0" x2="30" y2="30" stroke="#f472b6" strokeWidth="2" />
              <path d="M15 30 C15 15, 45 15, 45 30 C45 48, 15 48, 15 30 Z" fill="rgba(253, 164, 175, 0.4)" stroke="#f472b6" strokeWidth="2.5" className="drop-shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
              <circle cx="30" cy="48" r="3.5" fill="#f43f5e" />
              <line x1="30" y1="48" x2="30" y2="70" stroke="#f472b6" strokeWidth="2" />
              <rect x="23" y="70" width="14" height="45" rx="2" fill="url(#furinPaper)" stroke="#fb7185" strokeWidth="1.5" className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" />
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
          
          <div className={`absolute top-2 right-28 text-pink-300 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-base'} animate-sakura-1`}>🌸</div>
          <div className={`absolute bottom-4 left-14 text-rose-200 ${isHero ? 'text-lg sm:text-2xl' : 'text-xs sm:text-sm'} animate-sakura-2`}>🌸</div>
          <FourPointStar className="absolute bottom-4 right-1/3 text-slate-200 animate-starburst-1" />
        </div>
      )}

      {/* 16. PURPLE MOON BUTTERFLY (EFLATUN DOLUNAY & BÜYÜLÜ KELEBEK) */}
      {effectOverlay === 'purple_moon_butterfly' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/50 via-slate-950 to-indigo-950/40" />
          
          {/* Glowing Purple Moon */}
          <div className={`absolute -top-6 -right-4 rounded-full bg-gradient-to-br from-fuchsia-100 via-purple-200 to-indigo-300 opacity-90 shadow-[0_0_35px_rgba(232,121,249,0.9)] ${isHero ? 'w-36 h-36 sm:w-56 sm:h-56' : 'w-20 h-20 sm:w-28 sm:h-28'}`} />
          
          {/* Glowing Butterfly 1 */}
          <div className={`absolute top-4 left-10 text-fuchsia-300 animate-butterfly-1 drop-shadow-[0_0_15px_rgba(232,121,249,0.95)] ${isHero ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-8 h-8 sm:w-10 sm:h-10'}`}>
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12C10 7 4 4 2 8C0 12 5 16 11 13C5 18 2 22 6 22C10 22 11 16 12 12ZM12 12C14 7 20 4 22 8C24 12 19 16 13 13C19 18 22 22 18 22C14 22 13 16 12 12Z" />
            </svg>
          </div>
          
          {/* Glowing Butterfly 2 */}
          <div className={`absolute bottom-4 left-1/2 text-purple-200 animate-butterfly-2 drop-shadow-[0_0_12px_rgba(192,132,252,0.9)] ${isHero ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-6 h-6 sm:w-8 sm:h-8'}`}>
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12C10 7 4 4 2 8C0 12 5 16 11 13C5 18 2 22 6 22C10 22 11 16 12 12ZM12 12C14 7 20 4 22 8C24 12 19 16 13 13C19 18 22 22 18 22C14 22 13 16 12 12Z" />
            </svg>
          </div>

          {isHero && (
            <div className="absolute top-1/3 right-1/4 text-fuchsia-200 animate-butterfly-1 drop-shadow-[0_0_14px_rgba(232,121,249,0.9)] w-10 h-10 sm:w-14 sm:h-14">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12C10 7 4 4 2 8C0 12 5 16 11 13C5 18 2 22 6 22C10 22 11 16 12 12ZM12 12C14 7 20 4 22 8C24 12 19 16 13 13C19 18 22 22 18 22C14 22 13 16 12 12Z" />
              </svg>
            </div>
          )}

          <FourPointStar className="absolute top-1/2 left-12 text-fuchsia-200 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 right-16 text-purple-200 animate-starburst-2" />
        </div>
      )}

      {/* 17. NIGHT LANTERNS (GECE BAHÇESİ & SARAY FENERİ) */}
      {effectOverlay === 'night_lanterns' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-zinc-950 to-rose-950/60" />
          
          {/* Hanging Oriental Lantern 1 (Main Large) */}
          <div className={`absolute top-0 right-6 sm:right-10 origin-top animate-swing-pendulum z-10 ${isHero ? 'w-24 h-56 sm:w-36 sm:h-76 md:w-40 md:h-88' : 'w-14 h-36 sm:w-20 sm:h-48'}`}>
            <svg className="w-full h-full" viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* String */}
              <line x1="30" y1="0" x2="30" y2="22" stroke="#fcd34d" strokeWidth="2.5" />
              {/* Roof */}
              <path d="M6 22 L54 22 L44 32 L16 32 Z" fill="#92400e" stroke="#fcd34d" strokeWidth="2" />
              {/* Glass Frame Glowing */}
              <rect x="12" y="32" width="36" height="48" rx="4" fill="url(#lanternGlowLg)" stroke="#fcd34d" strokeWidth="2" className="drop-shadow-[0_0_20px_rgba(252,211,77,1)]" />
              {/* Middle Ribs */}
              <line x1="24" y1="32" x2="24" y2="80" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
              <line x1="36" y1="32" x2="36" y2="80" stroke="#b45309" strokeWidth="1.5" opacity="0.6" />
              {/* Bottom Rim */}
              <path d="M14 80 L46 80 L40 86 L20 86 Z" fill="#92400e" stroke="#fcd34d" strokeWidth="1.5" />
              {/* Tassel */}
              <line x1="30" y1="86" x2="30" y2="125" stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="30" cy="90" r="3.5" fill="#fcd34d" />
              <defs>
                <radialGradient id="lanternGlowLg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="30%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* Hanging Oriental Lantern 2 (Secondary Floating Lantern) */}
          <div className={`absolute top-0 right-24 sm:right-36 origin-top animate-swing-pendulum-delayed opacity-90 ${isHero ? 'w-18 h-44 sm:w-26 sm:h-60' : 'w-11 h-28 sm:w-15 sm:h-38'}`}>
            <svg className="w-full h-full" viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="30" y1="0" x2="30" y2="28" stroke="#fcd34d" strokeWidth="2" />
              <path d="M10 28 L50 28 L40 36 L20 36 Z" fill="#92400e" stroke="#fcd34d" strokeWidth="1.5" />
              <rect x="15" y="36" width="30" height="40" rx="3" fill="url(#lanternGlowLg)" stroke="#fcd34d" strokeWidth="1.5" className="drop-shadow-[0_0_15px_rgba(252,211,77,0.9)]" />
              <line x1="30" y1="76" x2="30" y2="110" stroke="#f43f5e" strokeWidth="2" />
              <circle cx="30" cy="80" r="3" fill="#fcd34d" />
            </svg>
          </div>

          {/* Additional Lantern in Hero Mode (Left Side for Magnificent Balance) */}
          {isHero && (
            <div className="absolute top-0 left-10 origin-top animate-swing-pendulum opacity-85 w-20 h-48 sm:w-28 sm:h-64">
              <svg className="w-full h-full" viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="30" y1="0" x2="30" y2="24" stroke="#fcd34d" strokeWidth="2" />
                <path d="M8 24 L52 24 L42 34 L18 34 Z" fill="#92400e" stroke="#fcd34d" strokeWidth="2" />
                <rect x="14" y="34" width="32" height="44" rx="3" fill="url(#lanternGlowLg)" stroke="#fcd34d" strokeWidth="2" className="drop-shadow-[0_0_18px_rgba(252,211,77,0.95)]" />
                <line x1="30" y1="78" x2="30" y2="115" stroke="#f43f5e" strokeWidth="2.5" />
                <circle cx="30" cy="82" r="3" fill="#fcd34d" />
              </svg>
            </div>
          )}

          <FourPointStar className="absolute bottom-6 left-12 text-amber-200 animate-starburst-1" />
          <FourPointStar className="absolute top-1/3 left-1/4 text-yellow-100 animate-starburst-2" />
          <div className={`absolute top-4 left-14 text-rose-300 ${isHero ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'} animate-sakura-1`}>🌸</div>
        </div>
      )}

      {/* 19. CRIMSON MOON ROMANCE (KIZIL DOLUNAY & GEYİK BOYNUZLU AKÇAAĞAÇ YAPRAKLARI) */}
      {effectOverlay === 'crimson_moon_romance' && (
        <div className="absolute inset-0">
          {/* Falling Red Maple Leaves */}
          <div className={`absolute top-0 left-8 text-red-500 ${isHero ? 'text-2xl sm:text-4xl' : 'text-base sm:text-xl'} animate-petal-rain-1 drop-shadow-[0_0_12px_rgba(239,68,68,0.95)]`}>🍁</div>
          <div className={`absolute top-0 left-1/3 text-rose-400 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-lg'} animate-petal-rain-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.9)]`}>🍁</div>
          <div className={`absolute top-0 left-2/3 text-red-600 ${isHero ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl'} animate-petal-rain-3 drop-shadow-[0_0_15px_rgba(220,38,38,0.95)]`}>🍁</div>
          <div className={`absolute top-0 right-12 text-amber-500 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-lg'} animate-petal-rain-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]`}>🍁</div>
          <div className={`absolute top-0 right-1/3 text-red-400 ${isHero ? 'text-2xl sm:text-4xl' : 'text-base sm:text-xl'} animate-petal-rain-5 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]`}>🍁</div>

          <FourPointStar className="absolute top-4 right-1/4 text-red-300 animate-starburst-1" />
          <FourPointStar className="absolute bottom-6 left-12 text-amber-200 animate-starburst-2" />
          <div className="absolute top-4 left-1/4 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />
        </div>
      )}

      {/* 20. PURPLE CRYSTAL SAKURA (MİSTİK MOR KRİSTAL SAKURA & PIRLANTA ÇİÇEK FONU) */}
      {effectOverlay === 'purple_crystal_sakura' && (
        <div className="absolute inset-0">
          {/* Large Glowing Crystal Sakura Flower in Foreground Left/Bottom */}
          <div className={`absolute -bottom-6 -left-6 opacity-90 animate-lotus-pulse ${isHero ? 'w-44 h-44 sm:w-64 sm:h-64' : 'w-24 h-24 sm:w-32 sm:h-32'}`}>
            <svg className="w-full h-full drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]" viewBox="0 0 200 200" fill="none">
              {/* Petal 1 */}
              <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad1)" stroke="#ede9fe" strokeWidth="1.5" />
              {/* Petal 2 */}
              <g transform="rotate(72 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad1)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              {/* Petal 3 */}
              <g transform="rotate(144 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad1)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              {/* Petal 4 */}
              <g transform="rotate(216 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad1)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              {/* Petal 5 */}
              <g transform="rotate(288 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad1)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              {/* Center Diamond Gem */}
              <circle cx="100" cy="100" r="14" fill="#ffffff" className="drop-shadow-[0_0_12px_#ffffff]" />
              <polygon points="100,88 108,94 112,100 108,106 100,112 92,106 88,100 92,94" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1" />
              <circle cx="100" cy="100" r="4" fill="#ffffff" />
              {/* Radiant Starburst */}
              <polygon points="100,60 103,94 100,98 97,94" fill="#ffffff" />
              <polygon points="100,140 103,106 100,102 97,106" fill="#ffffff" />
              <polygon points="60,100 94,103 98,100 94,97" fill="#ffffff" />
              <polygon points="140,100 106,103 102,100 106,97" fill="#ffffff" />
              <defs>
                <linearGradient id="pcsGrad1" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#c084fc" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f5d0fe" stopOpacity="0.95" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Secondary Crystal Blossom Top Right */}
          <div className={`absolute -top-3 -right-3 opacity-80 animate-lotus-pulse delay-500 ${isHero ? 'w-36 h-36 sm:w-52 sm:h-52' : 'w-20 h-20 sm:w-28 sm:h-28'}`}>
            <svg className="w-full h-full drop-shadow-[0_0_16px_rgba(216,180,254,0.85)]" viewBox="0 0 200 200" fill="none">
              <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad2)" stroke="#ede9fe" strokeWidth="1.5" />
              <g transform="rotate(72 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad2)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              <g transform="rotate(144 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad2)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              <g transform="rotate(216 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad2)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              <g transform="rotate(288 100 100)">
                <path d="M100 100 C80 60, 45 40, 50 15 C70 5, 88 18, 92 10 C96 10, 104 10, 108 10 C112 18, 130 5, 150 15 C155 40, 120 60, 100 100 Z" fill="url(#pcsGrad2)" stroke="#ede9fe" strokeWidth="1.5" />
              </g>
              <circle cx="100" cy="100" r="10" fill="#ffffff" className="drop-shadow-[0_0_10px_#ffffff]" />
              <polygon points="100,70 102,96 100,98 98,96" fill="#ffffff" />
              <polygon points="100,130 102,104 100,102 98,104" fill="#ffffff" />
              <polygon points="70,100 96,102 98,100 96,98" fill="#ffffff" />
              <polygon points="130,100 104,102 102,100 104,98" fill="#ffffff" />
              <defs>
                <linearGradient id="pcsGrad2" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#d8b4fe" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Falling Floating Purple Crystal Petals */}
          <div className={`absolute top-0 left-10 text-purple-300 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-base'} animate-sakura-1 drop-shadow-[0_0_10px_rgba(192,132,252,0.95)]`}>🌸</div>
          <div className={`absolute top-0 left-1/4 text-fuchsia-200 ${isHero ? 'text-lg sm:text-2xl' : 'text-xs sm:text-sm'} animate-sakura-2 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)]`}>🌸</div>
          <div className={`absolute top-0 left-1/2 text-purple-200 ${isHero ? 'text-2xl sm:text-4xl' : 'text-base sm:text-lg'} animate-sakura-3 drop-shadow-[0_0_12px_rgba(216,180,254,0.95)]`}>🌸</div>
          <div className={`absolute top-0 right-1/3 text-violet-300 ${isHero ? 'text-xl sm:text-3xl' : 'text-sm sm:text-base'} animate-sakura-4 drop-shadow-[0_0_10px_rgba(167,139,250,0.9)]`}>🌸</div>
          <div className={`absolute top-0 right-16 text-purple-100 ${isHero ? 'text-lg sm:text-2xl' : 'text-xs sm:text-sm'} animate-sakura-1 drop-shadow-[0_0_8px_rgba(243,232,255,0.9)]`}>🌸</div>

          {/* Diamond Sparkle Stars */}
          <FourPointStar className="absolute top-6 left-1/3 text-purple-200 animate-starburst-1 drop-shadow-[0_0_8px_#c084fc]" />
          <FourPointStar className="absolute top-1/2 right-12 text-fuchsia-200 animate-starburst-2 drop-shadow-[0_0_10px_#e879f9]" />
          <FourPointStar className="absolute bottom-8 right-1/3 text-white animate-starburst-3 drop-shadow-[0_0_12px_#ffffff]" />
          <FourPointStar className="absolute bottom-16 left-1/4 text-violet-200 animate-starburst-1 drop-shadow-[0_0_8px_#a78bfa]" />

          {/* Shimmering Bokeh & Pinging Orbs */}
          <div className="absolute top-8 right-1/4 w-3 h-3 bg-purple-300 rounded-full animate-ping shadow-[0_0_12px_#d8b4fe]" />
          <div className="absolute bottom-12 left-1/2 w-2 h-2 bg-fuchsia-300 rounded-full animate-ping delay-700 shadow-[0_0_10px_#f0abfc]" />
        </div>
      )}

      {/* 21. GOTHIC HANGING LANTERNS (GOTİK ASILI GECE FENERLERİ & MİSTİK ŞAMDAN FONU) */}
      {effectOverlay === 'gothic_hanging_lanterns' && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Top Hanging Chain & Left Gothic Lantern */}
          <div className={`absolute top-0 left-4 sm:left-10 animate-lantern-sway-1 origin-top pointer-events-none ${isHero ? 'w-24 sm:w-36' : 'w-16 sm:w-20'}`}>
            {/* Chain links */}
            <div className="w-0.5 sm:w-1 h-12 sm:h-24 mx-auto bg-gradient-to-b from-purple-400/80 via-slate-600 to-purple-900 border-x border-purple-950/80" />
            {/* Hanging Lantern */}
            <div className="relative -mt-1">
              <svg viewBox="0 0 100 180" className="w-full h-auto drop-shadow-[0_0_18px_rgba(192,132,252,0.85)]" fill="none">
                {/* Top Ring */}
                <circle cx="50" cy="14" r="8" stroke="#6b528e" strokeWidth="3" />
                {/* Roof */}
                <path d="M 22 36 L 50 18 L 78 36 Z" fill="#231738" stroke="#5d437e" strokeWidth="2" />
                <path d="M 18 36 L 82 36 L 76 44 L 24 44 Z" fill="#1b112c" stroke="#4a3565" strokeWidth="1.5" />
                {/* Glowing Glass Body */}
                <path d="M 24 44 L 76 44 L 68 120 L 32 120 Z" fill="url(#ghlGrad1)" />
                {/* Inner Glowing Flame Core */}
                <ellipse cx="50" cy="85" rx="14" ry="20" fill="#ffffff" className="animate-lantern-flame" />
                <circle cx="50" cy="85" r="8" fill="#e879f9" className="animate-ping" />
                {/* Metal Frame Pillars */}
                <rect x="22" y="44" width="4" height="76" fill="#180e28" stroke="#4a3565" strokeWidth="1" />
                <rect x="74" y="44" width="4" height="76" fill="#180e28" stroke="#4a3565" strokeWidth="1" />
                <rect x="48" y="44" width="4" height="76" fill="#231738" />
                {/* Gothic Arches */}
                <path d="M 24 62 Q 36 46 48 62 Q 62 46 76 62" stroke="#1b112c" strokeWidth="2.5" />
                {/* Base */}
                <path d="M 30 120 L 70 120 L 62 134 L 38 134 Z" fill="#231738" stroke="#5d437e" strokeWidth="1.5" />
                <polygon points="46,134 54,134 50,144" fill="#1b112c" />
                {/* Dangling Crystal Diamond */}
                <polygon points="50,146 56,156 50,170 44,156" fill="url(#ghlCrystal)" stroke="#f3e8ff" strokeWidth="1" className="animate-pulse" />
                <defs>
                  <linearGradient id="ghlGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#c084fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.75" />
                  </linearGradient>
                  <linearGradient id="ghlCrystal" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#581c87" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Center-Right Prominent Hero Lantern */}
          <div className={`absolute top-0 right-8 sm:right-20 animate-lantern-sway-2 origin-top pointer-events-none ${isHero ? 'w-28 sm:w-44' : 'w-20 sm:w-28'}`}>
            <div className="w-0.5 sm:w-1 h-8 sm:h-16 mx-auto bg-gradient-to-b from-purple-300/90 via-slate-600 to-purple-900 border-x border-purple-950/80" />
            <div className="relative -mt-1">
              <svg viewBox="0 0 100 180" className="w-full h-auto drop-shadow-[0_0_24px_rgba(216,180,254,0.95)]" fill="none">
                <circle cx="50" cy="14" r="8" stroke="#7e62a4" strokeWidth="3" />
                <path d="M 22 36 L 50 18 L 78 36 Z" fill="#231738" stroke="#6d4f91" strokeWidth="2" />
                <path d="M 18 36 L 82 36 L 76 44 L 24 44 Z" fill="#1b112c" stroke="#5d437e" strokeWidth="1.5" />
                <path d="M 24 44 L 76 44 L 68 120 L 32 120 Z" fill="url(#ghlGrad2)" />
                {/* Flickering Core Flame & Star Flare */}
                <ellipse cx="50" cy="82" rx="16" ry="24" fill="#ffffff" className="animate-lantern-flame-delayed" />
                <circle cx="50" cy="82" r="9" fill="#d946ef" className="animate-ping delay-500" />
                <polygon points="50,60 52,80 50,84 48,80" fill="#ffffff" />
                <polygon points="50,104 52,84 50,80 48,84" fill="#ffffff" />
                <polygon points="30,82 48,84 52,82 48,80" fill="#ffffff" />
                <polygon points="70,82 52,84 48,82 52,80" fill="#ffffff" />
                {/* Pillars & Arches */}
                <rect x="22" y="44" width="4" height="76" fill="#180e28" stroke="#5d437e" strokeWidth="1" />
                <rect x="74" y="44" width="4" height="76" fill="#180e28" stroke="#5d437e" strokeWidth="1" />
                <rect x="48" y="44" width="4" height="76" fill="#231738" />
                <path d="M 24 62 Q 36 46 48 62 Q 62 46 76 62" stroke="#1b112c" strokeWidth="2.5" />
                <path d="M 30 120 L 70 120 L 62 134 L 38 134 Z" fill="#231738" stroke="#6d4f91" strokeWidth="1.5" />
                <polygon points="46,134 54,134 50,144" fill="#1b112c" />
                <polygon points="50,146 56,156 50,170 44,156" fill="url(#ghlCrystal2)" stroke="#ffffff" strokeWidth="1" className="animate-pulse" />
                <defs>
                  <linearGradient id="ghlGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#e879f9" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="ghlCrystal2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#f5d0fe" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Floating Mystical Embers & Purple Stardust rising up */}
          <div className="absolute bottom-6 left-12 w-2 h-2 rounded-full bg-purple-300 animate-ember-1 drop-shadow-[0_0_8px_#c084fc]" />
          <div className="absolute bottom-14 left-1/3 w-2.5 h-2.5 rounded-full bg-fuchsia-300 animate-ember-2 drop-shadow-[0_0_10px_#f0abfc]" />
          <div className="absolute bottom-10 right-1/4 w-2 h-2 rounded-full bg-violet-200 animate-ember-3 drop-shadow-[0_0_8px_#ddd6fe]" />
          <div className="absolute bottom-20 right-10 w-1.5 h-1.5 rounded-full bg-white animate-ember-1 drop-shadow-[0_0_6px_#ffffff]" />
          <div className="absolute bottom-4 left-1/2 w-2 h-2 rounded-full bg-purple-200 animate-ember-2 drop-shadow-[0_0_8px_#d8b4fe]" />

          {/* Starlight Starburst Crosses */}
          <FourPointStar className="absolute top-1/3 left-8 text-purple-200 animate-starburst-1 drop-shadow-[0_0_8px_#c084fc]" />
          <FourPointStar className="absolute top-1/2 right-10 text-fuchsia-200 animate-starburst-2 drop-shadow-[0_0_10px_#e879f9]" />
          <FourPointStar className="absolute bottom-1/4 left-1/4 text-white animate-starburst-3 drop-shadow-[0_0_12px_#ffffff]" />
          <FourPointStar className="absolute bottom-12 right-1/3 text-violet-200 animate-starburst-1 drop-shadow-[0_0_8px_#a78bfa]" />

          {/* Soft Ivy Leaf Accents at the top */}
          <div className="absolute top-0 left-0 opacity-40 text-purple-400 text-lg sm:text-2xl pointer-events-none select-none">🌿</div>
          <div className="absolute top-0 right-0 opacity-40 text-purple-400 text-lg sm:text-2xl pointer-events-none select-none scale-x-[-1]">🌿</div>
        </div>
      )}

      {/* 22. GOTHIC SILVER FILIGREE (GOTİK GÜMÜŞ SARMAŞIK & PARILDAYAN KELEBEK FONU) */}
      {effectOverlay === 'gothic_silver_filigree' && (
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          {/* Midnight deep starlight nebula */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#050711]/60 via-[#0a0e1e]/40 to-[#101429]/50" />

          {/* Top-Right Filigree Silver Baroque Swirls */}
          <div className={`absolute -top-4 right-0 ${isHero ? 'w-64 sm:w-96' : 'w-36 sm:w-48'} opacity-90 animate-filigree-glow`}>
            <svg viewBox="0 0 300 200" className="w-full h-auto drop-shadow-[0_0_16px_rgba(255,255,255,0.7)]" fill="none">
              <path d="M 320,10 C 240,10 180,60 170,120 C 160,170 200,190 230,170 C 260,150 240,110 200,120 C 170,130 160,160 180,180" stroke="url(#gsfGradSilver)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 220,50 C 160,50 110,90 90,140 C 70,190 30,160 20,130" stroke="url(#gsfGradSilver2)" strokeWidth="2" strokeLinecap="round" />
              {/* Petal Drops */}
              <circle cx="180" cy="180" r="4" fill="#ffffff" />
              <circle cx="170" cy="120" r="3" fill="#cbd5e1" />
              <circle cx="20" cy="130" r="3.5" fill="#ffffff" />
              <circle cx="90" cy="140" r="2.5" fill="#e2e8f0" />
              <path d="M 230,40 C 220,25 210,15 225,5 C 235,15 230,25 230,40 Z" fill="url(#gsfGradSilver)" />
              <path d="M 160,70 C 150,55 140,45 155,35 C 165,45 160,55 160,70 Z" fill="url(#gsfGradSilver)" />
            </svg>
          </div>

          {/* Top-Left Delicate Swirl */}
          <div className={`absolute top-0 left-0 ${isHero ? 'w-48 sm:w-72' : 'w-24 sm:w-36'} opacity-80`}>
            <svg viewBox="0 0 200 150" className="w-full h-auto drop-shadow-[0_0_12px_rgba(226,232,240,0.6)]" fill="none">
              <path d="M -10,30 C 50,20 100,70 90,110 C 80,140 40,130 50,100 C 60,80 85,90 80,110" stroke="url(#gsfGradSilver)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="80" cy="110" r="3" fill="#ffffff" />
              <path d="M 60,35 C 50,20 40,10 55,5 C 65,15 60,25 60,35 Z" fill="url(#gsfGradSilver)" />
            </svg>
          </div>

          {/* ✨ HERO OVERLAPPING BOTANICAL VINES (DALLAR ÖNE VE ÜSTE ÇIKARAK KARTI SARIYOR) */}
          <div className={`absolute -bottom-4 -left-3 z-30 animate-branch-drape origin-bottom-left ${
            isHero ? 'w-72 sm:w-[420px]' : 'w-44 sm:w-60'
          }`}>
            <svg viewBox="0 0 350 320" className="w-full h-auto drop-shadow-[0_0_18px_rgba(255,255,255,0.85)] drop-shadow-[0_0_30px_rgba(165,180,252,0.4)]" fill="none">
              {/* Main Rising Silver Branch Trunk */}
              <path d="M -20,340 C 40,280 80,210 70,140 C 60,70 140,20 200,60 C 250,95 230,170 170,160 C 130,150 130,100 170,95 C 195,90 210,115 190,130" stroke="url(#gsfGradSilver)" strokeWidth="4.5" strokeLinecap="round" />
              
              {/* Arching Upper Tendril Branch extending over avatar & text */}
              <path d="M 70,170 C 130,140 210,170 250,120 C 280,80 270,30 320,10" stroke="url(#gsfGradSilver2)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 140,150 C 180,200 240,210 280,260" stroke="url(#gsfGradSilver)" strokeWidth="2.5" strokeLinecap="round" />

              {/* Botanical Silver Leaves along the Vine */}
              {/* Leaf 1 */}
              <path d="M 60,240 C 45,225 35,210 50,195 C 62,208 58,225 60,240 Z" fill="url(#gsfGradSilver)" filter="url(#gsfGlow)" />
              <path d="M 45,250 C 30,240 20,230 32,215 C 44,226 42,240 45,250 Z" fill="url(#gsfGradSilver2)" />
              
              {/* Leaf 2 */}
              <path d="M 68,170 C 50,150 40,135 55,120 C 70,135 65,155 68,170 Z" fill="url(#gsfGradSilver)" filter="url(#gsfGlow)" />
              <path d="M 52,185 C 32,170 25,155 38,140 C 52,154 48,172 52,185 Z" fill="url(#gsfGradSilver2)" />
              <path d="M 85,150 C 85,130 90,115 105,108 C 112,125 100,140 85,150 Z" fill="url(#gsfGradSilver)" />

              {/* Leaf 3 (Apex Tendril) */}
              <path d="M 145,95 C 135,75 130,60 148,50 C 160,65 155,82 145,95 Z" fill="url(#gsfGradSilver)" filter="url(#gsfGlow)" />
              <path d="M 170,75 C 165,55 165,40 185,32 C 195,48 185,65 170,75 Z" fill="url(#gsfGradSilver)" />
              <path d="M 200,60 C 205,40 215,25 235,20 C 240,40 225,55 200,60 Z" fill="url(#gsfGradSilver)" />

              {/* Extended Branch Leaves */}
              <path d="M 220,145 C 225,125 240,115 255,125 C 255,145 235,155 220,145 Z" fill="url(#gsfGradSilver2)" />
              <path d="M 270,100 C 280,80 300,75 310,90 C 305,110 285,115 270,100 Z" fill="url(#gsfGradSilver)" />

              {/* Pearl Droplet Clusters */}
              <circle cx="190" cy="130" r="3.5" fill="#ffffff" filter="url(#gsfGlow)" />
              <circle cx="205" cy="138" r="2.5" fill="#e2e8f0" />
              <circle cx="218" cy="148" r="1.8" fill="#cbd5e1" />
              <circle cx="320" cy="10" r="3" fill="#ffffff" />
            </svg>
          </div>

          {/* 🦋 HERO GLOWING SILVER BUTTERFLY (CANLI KANAT ÇIRPAN GÜMÜŞ KELEBEK) */}
          <div className={`absolute z-30 animate-silver-butterfly pointer-events-none ${
            isHero ? 'bottom-16 left-28 sm:bottom-28 sm:left-44 w-12 h-12 sm:w-16 sm:h-16' : 'bottom-6 left-12 w-8 h-8 sm:w-10 sm:h-10'
          }`}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_14px_rgba(255,255,255,0.95)] drop-shadow-[0_0_24px_rgba(199,210,254,0.8)]" fill="none">
              {/* Upper Wings */}
              <path d="M 50,50 C 35,25 10,15 5,30 C 0,45 25,65 48,56" fill="url(#gsfGradSilver)" stroke="#ffffff" strokeWidth="1.2" />
              <path d="M 50,50 C 65,25 90,15 95,30 C 100,45 75,65 52,56" fill="url(#gsfGradSilver)" stroke="#ffffff" strokeWidth="1.2" />
              {/* Wing Inner Lines */}
              <path d="M 45,46 C 30,32 18,28 14,35" stroke="#ffffff" strokeWidth="0.8" />
              <path d="M 55,46 C 70,32 82,28 86,35" stroke="#ffffff" strokeWidth="0.8" />
              {/* Lower Wings */}
              <path d="M 48,56 C 30,65 15,80 25,90 C 35,98 48,78 50,62" fill="url(#gsfGradSilver2)" stroke="#e2e8f0" strokeWidth="1" />
              <path d="M 52,56 C 70,65 85,80 75,90 C 65,98 52,78 50,62" fill="url(#gsfGradSilver2)" stroke="#e2e8f0" strokeWidth="1" />
              {/* Body */}
              <ellipse cx="50" cy="54" rx="2.5" ry="12" fill="#ffffff" />
              <circle cx="50" cy="40" r="3" fill="#ffffff" />
              <path d="M 48,38 Q 40,25 34,22" stroke="#ffffff" strokeWidth="1" />
              <circle cx="34" cy="22" r="1.5" fill="#ffffff" />
              <path d="M 52,38 Q 60,25 66,22" stroke="#ffffff" strokeWidth="1" />
              <circle cx="66" cy="22" r="1.5" fill="#ffffff" />
            </svg>
          </div>

          {/* Secondary Distant Tiny Butterfly Fluttering */}
          <div className={`absolute z-30 animate-silver-butterfly-delayed pointer-events-none opacity-85 ${
            isHero ? 'top-16 right-1/4 w-8 h-8 sm:w-10 sm:h-10' : 'top-3 right-1/3 w-5 h-5'
          }`}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="none">
              <path d="M 50,50 C 38,30 18,20 14,32 C 10,44 30,60 48,54" fill="url(#gsfGradSilver)" stroke="#ffffff" strokeWidth="1" />
              <path d="M 50,50 C 62,30 82,20 86,32 C 90,44 70,60 52,54" fill="url(#gsfGradSilver)" stroke="#ffffff" strokeWidth="1" />
              <ellipse cx="50" cy="54" rx="2" ry="9" fill="#ffffff" />
            </svg>
          </div>

          {/* Silver Starlight 4-Point Diamonds */}
          <FourPointStar className="absolute top-1/4 left-10 text-white animate-starburst-1 drop-shadow-[0_0_10px_#ffffff]" />
          <FourPointStar className="absolute bottom-1/3 right-12 text-slate-100 animate-starburst-2 drop-shadow-[0_0_12px_#cbd5e1]" />
          <FourPointStar className="absolute bottom-8 right-1/3 text-white animate-starburst-3 drop-shadow-[0_0_14px_#ffffff]" />
          <FourPointStar className="absolute top-1/3 right-16 text-indigo-100 animate-starburst-1 drop-shadow-[0_0_8px_#e0e7ff]" />

          {/* Floating Silver Luminous Embers */}
          <div className="absolute bottom-6 left-1/3 w-2 h-2 rounded-full bg-white animate-ember-1 drop-shadow-[0_0_8px_#ffffff]" />
          <div className="absolute bottom-12 right-1/4 w-2.5 h-2.5 rounded-full bg-slate-100 animate-ember-2 drop-shadow-[0_0_10px_#e2e8f0]" />
          <div className="absolute bottom-20 left-16 w-1.5 h-1.5 rounded-full bg-indigo-100 animate-ember-3 drop-shadow-[0_0_6px_#c7d2fe]" />

          <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
            <defs>
              <linearGradient id="gsfGradSilver" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="gsfGradSilver2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
              <filter id="gsfGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
};
