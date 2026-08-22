import React from 'react';

export const DiscordWidget: React.FC = () => {
  return (
    <div className="relative overflow-visible rounded-2xl bg-gradient-to-br from-white via-indigo-50/70 to-purple-50/60 dark:from-[#1e1b29] dark:to-[#110f18] border-2 border-[#5865F2] p-5 text-center shadow-xl my-6 transition-colors">
      
      {/* Mascot Wrapper with Chibi SVG */}
      <div className="-mt-12 mb-2 flex justify-center">
        <svg
          className="w-20 h-20 drop-shadow-xl animate-bounce duration-1000"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Headband */}
          <path d="M20,45 A30,30 0 0,1 80,45" fill="none" stroke="#5865F2" strokeWidth="6" strokeLinecap="round" />
          {/* Earphones */}
          <rect x="12" y="38" width="10" height="20" rx="5" fill="#5865F2" />
          <rect x="78" y="38" width="10" height="20" rx="5" fill="#5865F2" />
          {/* Main Head */}
          <rect x="22" y="25" width="56" height="46" rx="20" fill="#ffffff" />
          {/* Face Screen */}
          <rect x="28" y="31" width="44" height="30" rx="12" fill="#23272A" />
          {/* Happy Eyes */}
          <path d="M36,44 Q41,39 44,44" fill="none" stroke="#5865F2" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M56,44 Q59,39 64,44" fill="none" stroke="#5865F2" strokeWidth="3.5" strokeLinecap="round" />
          {/* Pink Cheeks */}
          <circle cx="34" cy="51" r="4" fill="#FF8EA7" opacity="0.8" />
          <circle cx="66" cy="51" r="4" fill="#FF8EA7" opacity="0.8" />
          {/* Mouth */}
          <path d="M48,49 Q50,52 52,49" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          {/* Antenna */}
          <path d="M50,25 L50,15" fill="none" stroke="#5865F2" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="12" r="4" fill="#FF8EA7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-black text-[#5865F2] uppercase tracking-wider">
          Topluluğumuza Katıl!
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 font-medium leading-relaxed max-w-md mx-auto">
          Mikrokosmos evreninde sohbet etmeye ve güncel bölümlerden anında haberdar olmaya ne dersin?
        </p>
        <div className="pt-2">
          <a
            href="https://discord.com/invite/5d6sseKRfs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#5865F2] hover:bg-[#4752c4] !text-white badge-preserve-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg hover:shadow-[#5865F2]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 16 16">
              <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.214 12.214 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032a.04.04 0 0 0 .016.028a13.16 13.16 0 0 0 3.977 2.01.05.05 0 0 0 .055-.018c.308-.42.582-.865.819-1.332a.05.05 0 0 0-.028-.069a8.63 8.63 0 0 1-1.242-.593.05.05 0 0 1-.005-.085c.084-.063.167-.128.247-.195a.05.05 0 0 1 .051-.007c2.443 1.12 5.084 1.12 7.488 0a.05.05 0 0 1 .051.007c.08.066.163.132.248.195a.05.05 0 0 1-.004.085 8.254 8.254 0 0 1-1.242.593.05.05 0 0 0-.027.069c.24.467.513.912.819 1.332a.05.05 0 0 1 .056.018a13.16 13.16 0 0 0 3.977-2.01.04.04 0 0 0 .016-.028c.398-3.529-.67-6.523-2.74-9.006a.043.043 0 0 0-.02-.018zM5.122 10.036c-.75 0-1.366-.688-1.366-1.53c0-.841.604-1.53 1.366-1.53.765 0 1.366.69 1.356 1.53 0 .842-.6 1.53-1.356 1.53zm4.99 0c-.75 0-1.366-.688-1.366-1.53c0-.841.604-1.53 1.366-1.53.765 0 1.366.69 1.356 1.53 0 .842-.6 1.53-1.356 1.53z" />
            </svg>
            Discord'a Katıl
          </a>
        </div>
      </div>
    </div>
  );
};
