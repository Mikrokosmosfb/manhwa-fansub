const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

const oldShopBtn = `{/* Shop Action Button (Prominent) */}
            <button
              onClick={() => {
                setView({ type: 'shop' });
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-transform active:scale-95 border border-amber-400/50"
              title="Kozmetik Mağazası"
            >
              <ShoppingBag size={16} className="text-white" />
              <span className="text-[11px] sm:text-xs font-black hidden sm:block">Mağaza</span>
            </button>`;

const newShopBtn = `{/* Shop Action Button (Prominent) */}
            <button
              onClick={() => {
                setView({ type: 'shop' });
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.6)] transition-transform active:scale-95 border border-amber-300/50 relative overflow-hidden group"
              title="Kozmetik Mağazası"
            >
              <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
              <ShoppingBag size={18} className="text-white drop-shadow-md relative z-10" />
              <span className="text-[11px] sm:text-xs font-black hidden sm:block tracking-wide drop-shadow-md relative z-10">MAĞAZA</span>
            </button>`;

if (code.includes('Shop Action Button (Prominent)')) {
    code = code.replace(oldShopBtn, newShopBtn);
    fs.writeFileSync('src/components/Header.tsx', code);
    console.log('Patched Header.tsx for a better shop button');
} else {
    console.log('Could not find the shop button string');
}
