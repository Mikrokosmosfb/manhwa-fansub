import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DAILY_STARTER_REWARDS } from '../types';
import { Gift, CheckCircle2, Lock, Sparkles, X, ChevronRight, Coins, CalendarDays, ShoppingBag, ShieldCheck } from 'lucide-react';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClose }) => {
  const { user, claimDailyCheckin, openAuthModal, setView } = useApp();
  const [claimStatus, setClaimStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  if (!isOpen) return null;

  const currentDay = user?.dailyCheckinDay || 0;
  const claimedDays = user?.claimedCheckinDays || (currentDay > 0 ? Array.from({ length: currentDay }, (_, i) => i + 1) : []);
  const today = new Date().toISOString().slice(0, 10);
  const isClaimedToday = user?.lastDailyCheckin === today;
  const isCompletedAll = currentDay >= 7;

  // Next claimable day is currentDay + 1 if not claimed today and not completed
  const nextClaimableDay = !isClaimedToday && !isCompletedAll ? currentDay + 1 : null;
  const nextReward = nextClaimableDay ? DAILY_STARTER_REWARDS.find(r => r.day === nextClaimableDay) : null;

  const handleClaim = () => {
    if (!user) {
      onClose();
      openAuthModal('login');
      return;
    }
    const res = claimDailyCheckin();
    if (res.success) {
      setClaimStatus({ type: 'success', message: res.message });
    } else {
      setClaimStatus({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-gray-950 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-amber-500/20 via-purple-600/20 to-transparent blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <CalendarDays size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">7 Günlük Hoş Geldin Takvimi</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Yeni Üye Hediyesi
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                İlk 7 gün boyunca her gün giriş yapın, toplam <span className="text-amber-300 font-bold">87 Cosmo-Puan</span> kazanın!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center border border-gray-700 transition cursor-pointer"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="relative z-10 p-6 overflow-y-auto space-y-5">
          {/* Status / Alert Banner */}
          {claimStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                claimStatus.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-lg shadow-emerald-950/50'
                  : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={claimStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} />
                <span>{claimStatus.message}</span>
              </div>
              <button
                onClick={() => setClaimStatus(null)}
                className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          )}

          {/* User Progress Summary */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center justify-center font-black text-sm">
                {currentDay}/7
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-bold block">İlerlemeniz</span>
                <span className="text-sm font-black text-white">
                  {isCompletedAll
                    ? '🎉 7 Günlük Takvim Tamamlandı!'
                    : `${currentDay}. Gün Tamamlandı (${7 - currentDay} Gün Kaldı)`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl w-full sm:w-auto justify-center">
              <Coins size={14} className="text-amber-400" />
              <span>
                Toplam Alınan:{' '}
                <strong className="text-white">
                  {DAILY_STARTER_REWARDS.filter(r => claimedDays.includes(r.day)).reduce((acc, curr) => acc + curr.points, 0)} CP
                </strong>
              </span>
            </div>
          </div>

          {/* 7 DAYS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DAILY_STARTER_REWARDS.map((item) => {
              const isClaimed = claimedDays.includes(item.day);
              const isTodayTarget = nextClaimableDay === item.day;
              const isLocked = !isClaimed && !isTodayTarget;
              const isFinalDay = item.day === 7;

              return (
                <div
                  key={item.day}
                  className={`relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between text-center gap-2 ${
                    isFinalDay ? 'col-span-2 sm:col-span-2' : ''
                  } ${
                    isClaimed
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-gray-400 opacity-90'
                      : isTodayTarget
                      ? 'bg-gradient-to-b from-amber-950/80 via-purple-950/80 to-gray-950 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/50 scale-[1.02]'
                      : 'bg-gray-900/60 border-gray-800 text-gray-500'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isTodayTarget ? 'text-amber-300' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                    {isClaimed ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-md border border-emerald-500/40">
                        <CheckCircle2 size={11} /> Alındı
                      </span>
                    ) : isTodayTarget ? (
                      <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-400/50 animate-pulse">
                        Şimdi Al
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5">
                        <Lock size={10} /> Kilitli
                      </span>
                    )}
                  </div>

                  {/* Icon & Points */}
                  <div className="my-1 flex flex-col items-center">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5 shadow-md ${
                        isClaimed
                          ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30'
                          : isTodayTarget
                          ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black shadow-amber-500/30 animate-bounce'
                          : isFinalDay
                          ? 'bg-gradient-to-tr from-amber-600/30 to-purple-600/30 text-amber-300 border border-amber-500/30'
                          : 'bg-gray-800/80 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {isFinalDay ? <Gift size={20} /> : <Coins size={20} />}
                    </div>
                    <span className={`text-base font-black ${isTodayTarget ? 'text-amber-300' : isClaimed ? 'text-emerald-300' : 'text-white'}`}>
                      +{item.points} <span className="text-xs font-bold text-amber-400">CP</span>
                    </span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                      {item.description}
                    </span>
                  </div>

                  {/* Bottom indicator */}
                  <div className="w-full pt-1">
                    {isClaimed ? (
                      <div className="w-full py-1 bg-emerald-950/60 rounded-xl text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                        ✓ Tamamlandı
                      </div>
                    ) : isTodayTarget ? (
                      <button
                        type="button"
                        onClick={handleClaim}
                        className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 border border-amber-300 transition active:scale-95 cursor-pointer"
                      >
                        Ödülü Al
                      </button>
                    ) : (
                      <div className="w-full py-1 bg-gray-950/60 rounded-xl text-[10px] font-semibold text-gray-500 border border-gray-800">
                        Beklemede
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Card about 7-Day Completion */}
          <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-start gap-3 text-xs text-purple-200/90 leading-relaxed">
            <ShieldCheck size={18} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold mb-0.5">Bilgilendirme & Mağaza:</strong>
              7 Günlük Hoş Geldin Takvimi yeni katılan tüm okuyucularımıza özel başlangıç hediyesidir. 7. günün ardından profil temaları, özel auralar ve rozetler için <span className="text-amber-300 font-bold">Mağaza</span> üzerinden dilediğiniz zaman Cosmo-Puan yükleyebilirsiniz.
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="relative z-10 p-5 bg-gray-900/90 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isCompletedAll ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                setView({ type: 'shop' });
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag size={18} />
              <span>Mağazayı Ziyaret Et (Tüm Paketler)</span>
            </button>
          ) : isClaimedToday ? (
            <div className="w-full py-3 bg-gray-800 text-gray-300 font-bold text-xs rounded-2xl text-center border border-gray-700 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Bugünkü Giriş Ödülünüz Alındı! Yarın {currentDay + 1}. Gün Ödülü için bekleriz.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Gift size={18} />
              <span>{nextReward ? `${nextReward.day}. Gün Ödülünü Al (+${nextReward.points} CP)` : 'Giriş Ödülünü Al'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
