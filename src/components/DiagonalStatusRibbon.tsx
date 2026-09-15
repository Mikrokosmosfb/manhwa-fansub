import React from 'react';

interface DiagonalStatusRibbonProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const getStatusRibbonConfig = (statusStr: string) => {
  const s = (statusStr || '').toLowerCase().trim();

  if (s.includes('tamamlan') || s.includes('finished') || s.includes('completed')) {
    return {
      text: 'TAMAMLANDI',
      bgClass: 'bg-emerald-600 !text-white badge-preserve-white border-y border-emerald-300/40 shadow-emerald-950/80',
    };
  }

  if (s.includes('askı') || s.includes('bekle') || s.includes('pause') || s.includes('hiatus')) {
    return {
      text: 'ASKIDA',
      bgClass: 'bg-amber-600 !text-white badge-preserve-white border-y border-amber-300/40 shadow-amber-950/80',
    };
  }

  if (s.includes('bırak') || s.includes('iptal') || s.includes('drop') || s.includes('cancel')) {
    return {
      text: 'BIRAKILDI',
      bgClass: 'bg-rose-700 !text-white badge-preserve-white border-y border-rose-300/40 shadow-rose-950/80',
    };
  }

  // Default: Devam Ediyor / Güncel / Ongoing
  return {
    text: 'DEVAM EDİYOR',
    bgClass: 'bg-purple-600 !text-white badge-preserve-white border-y border-purple-300/40 shadow-purple-950/80',
  };
};

export const DiagonalStatusRibbon: React.FC<DiagonalStatusRibbonProps> = ({ status, size = 'md' }) => {
  const config = getStatusRibbonConfig(status);

  if (size === 'sm') {
    return (
      <div className="absolute top-0 left-0 overflow-hidden w-20 h-20 pointer-events-none z-20">
        <div
          className={`absolute top-2.5 -left-8 w-28 text-[8px] font-black tracking-wider py-0.5 text-center uppercase shadow-md -rotate-45 select-none pointer-events-auto ${config.bgClass}`}
        >
          {config.text}
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="absolute top-0 left-0 overflow-hidden w-28 sm:w-32 h-28 sm:h-32 pointer-events-none z-20">
        <div
          className={`absolute top-4 sm:top-5 -left-10 sm:-left-11 w-36 sm:w-40 text-[9px] sm:text-[10px] font-black tracking-wider py-0.5 sm:py-1 text-center uppercase shadow-md -rotate-45 select-none pointer-events-auto ${config.bgClass}`}
        >
          {config.text}
        </div>
      </div>
    );
  }

  // Default 'md'
  return (
    <div className="absolute top-0 left-0 overflow-hidden w-24 sm:w-28 h-24 sm:h-28 pointer-events-none z-20">
      <div
        className={`absolute top-3.5 sm:top-4 -left-9 sm:-left-10 w-32 sm:w-36 text-[8px] sm:text-[9.5px] font-black tracking-wider py-0.5 text-center uppercase shadow-md -rotate-45 select-none pointer-events-auto ${config.bgClass}`}
      >
        {config.text}
      </div>
    </div>
  );
};
