import React, { useEffect, useState } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { SaturnIcon } from './SaturnIcon';

interface AppSplashScreenProps {
  onFinished?: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Evren kapıları açılıyor...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(38);
      setStatusText('Kozmik kütüphane taranıyor...');
    }, 250);

    const timer2 = setTimeout(() => {
      setProgress(68);
      setStatusText('Son güncel bölümler hazırlanıyor...');
    }, 550);

    const timer3 = setTimeout(() => {
      setProgress(92);
      setStatusText('Mikrokosmos dünyasına bağlanılıyor...');
    }, 850);

    const timer4 = setTimeout(() => {
      setProgress(100);
      setStatusText('Hoş Geldiniz!');
    }, 1100);

    const timer5 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1250);

    const timer6 = setTimeout(() => {
      if (onFinished) onFinished();
    }, 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d061a] text-white select-none transition-all duration-500 overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Cosmic Glows & Floating Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0d061a]/90 to-[#07030e]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Sparkling Stars Animation Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <Sparkles className="absolute top-16 left-12 w-5 h-5 text-purple-300 animate-pulse" />
        <Star className="absolute top-28 right-20 w-4 h-4 text-amber-300 animate-ping" />
        <Sparkles className="absolute bottom-24 left-1/4 w-6 h-6 text-pink-300 animate-bounce" />
        <Star className="absolute bottom-16 right-16 w-5 h-5 text-cyan-300 animate-pulse" />
        <div className="absolute top-1/3 right-12 w-2 h-2 bg-purple-200 rounded-full animate-ping" />
        <div className="absolute bottom-1/3 left-10 w-2 h-2 bg-pink-200 rounded-full animate-pulse" />
      </div>

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">
        {/* Saturn Planet Logo with Pulsing Glowing Rings */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 blur-2xl opacity-60 animate-pulse" />
          <div className="relative p-5 rounded-3xl bg-gradient-to-b from-purple-950/80 to-[#0f0720]/90 border border-purple-500/40 shadow-2xl backdrop-blur-md transform transition-transform hover:scale-105">
            <SaturnIcon size={72} className="drop-shadow-[0_0_25px_rgba(236,72,153,0.8)]" />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-200 drop-shadow-md">
          MIKROKOSMOS
        </h1>
        <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.35em] text-pink-400 mt-1.5 drop-shadow-sm">
          FANSUB
        </p>

        {/* Progress Bar & Status Text */}
        <div className="w-full mt-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-purple-300/90 text-[11px] font-mono tracking-wide">
              {statusText}
            </span>
            <span className="text-amber-300 font-mono font-extrabold text-[12px]">
              %{progress}
            </span>
          </div>

          <div className="relative w-full h-2 rounded-full bg-purple-950/80 border border-purple-500/30 overflow-hidden shadow-inner p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 shadow-[0_0_12px_rgba(236,72,153,0.8)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom Small Tagline */}
        <p className="text-[10px] text-purple-300/50 font-medium tracking-wider mt-10">
          Türkçe Webtoon, Manga & Web Novel Platformu
        </p>
      </div>
    </div>
  );
};
