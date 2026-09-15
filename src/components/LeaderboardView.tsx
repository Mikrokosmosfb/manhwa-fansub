import React, { useState, useMemo } from 'react';
import { Trophy, Award, MessageSquare, Heart, Sparkles, Search, Crown, Flame, UserCheck, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';

interface RankedUser {
  uid: string;
  name: string;
  email?: string;
  avatar: string;
  commentCount: number;
  totalLikesReceived: number;
  coins?: number;
  equippedBadge?: string | null;
  equippedBadges?: string[];
  equippedFrame?: string | null;
  rank: number;
}

export const LeaderboardView: React.FC = () => {
  const { comments, knownUsers, user, openPublicProfile, setView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate Real-Time Top 50 Users based on Actual Comments
  const leaderboardData = useMemo(() => {
    const userStatsMap: Record<string, {
      uid: string;
      name: string;
      email?: string;
      avatar: string;
      commentCount: number;
      totalLikesReceived: number;
      equippedBadge?: string | null;
      equippedBadges?: string[];
      equippedFrame?: string | null;
      coins?: number;
    }> = {};

    // 1. Process all real comments posted in the application
    comments.forEach(c => {
      const key = c.userId || c.userName || 'guest';
      if (!userStatsMap[key]) {
        userStatsMap[key] = {
          uid: c.userId || `u-${c.userName}`,
          name: c.userName || 'Okuyucu',
          avatar: c.userAvatar || '',
          commentCount: 0,
          totalLikesReceived: 0,
          equippedBadge: c.equippedBadge,
          equippedBadges: c.equippedBadges,
          equippedFrame: c.equippedFrame,
        };
      }

      userStatsMap[key].commentCount += 1;
      userStatsMap[key].totalLikesReceived += (c.likes ? c.likes.length : 0);

      // Keep avatar and badges updated from latest comment
      if (c.userAvatar) userStatsMap[key].avatar = c.userAvatar;
      if (c.equippedBadge) userStatsMap[key].equippedBadge = c.equippedBadge;
      if (c.equippedBadges && c.equippedBadges.length) userStatsMap[key].equippedBadges = c.equippedBadges;
      if (c.equippedFrame) userStatsMap[key].equippedFrame = c.equippedFrame;
    });

    // 2. Blend with registered knownUsers (if any user registered but hasn't commented yet, they still exist)
    if (knownUsers && Array.isArray(knownUsers)) {
      knownUsers.forEach(ku => {
        const key = ku.uid || ku.email || ku.name;
        if (!userStatsMap[key]) {
          userStatsMap[key] = {
            uid: ku.uid,
            name: ku.name || 'Okuyucu',
            email: ku.email,
            avatar: ku.avatar || '',
            commentCount: 0,
            totalLikesReceived: 0,
            coins: ku.coins || 0,
            equippedBadge: ku.equippedBadge,
            equippedBadges: ku.equippedBadges,
            equippedFrame: ku.equippedFrame,
          };
        } else {
          userStatsMap[key].email = ku.email || userStatsMap[key].email;
          userStatsMap[key].coins = ku.coins || userStatsMap[key].coins;
          userStatsMap[key].equippedFrame = userStatsMap[key].equippedFrame || ku.equippedFrame;
          userStatsMap[key].equippedBadge = userStatsMap[key].equippedBadge || ku.equippedBadge;
        }
      });
    }

    // 3. Ensure currently logged-in user is present in stats
    if (user) {
      const key = user.uid || user.email || user.name;
      if (!userStatsMap[key]) {
        userStatsMap[key] = {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          commentCount: 0,
          totalLikesReceived: 0,
          coins: user.coins || 0,
          equippedBadge: user.equippedBadge,
          equippedBadges: user.equippedBadges,
          equippedFrame: user.equippedFrame,
        };
      } else {
        userStatsMap[key].name = user.name;
        userStatsMap[key].avatar = user.avatar;
        userStatsMap[key].email = user.email;
        userStatsMap[key].coins = user.coins || userStatsMap[key].coins;
        userStatsMap[key].equippedBadge = user.equippedBadge || userStatsMap[key].equippedBadge;
        userStatsMap[key].equippedBadges = user.equippedBadges || userStatsMap[key].equippedBadges;
        userStatsMap[key].equippedFrame = user.equippedFrame || userStatsMap[key].equippedFrame;
      }
    }

    // Convert map to array
    const sortedList = Object.values(userStatsMap)
      .filter(u => u.name && u.name.trim() !== '')
      .sort((a, b) => {
        // Sort by comment count descending
        if (b.commentCount !== a.commentCount) {
          return b.commentCount - a.commentCount;
        }
        // Tie-breaker: total likes received
        if (b.totalLikesReceived !== a.totalLikesReceived) {
          return b.totalLikesReceived - a.totalLikesReceived;
        }
        // Secondary tie-breaker: Cosmo-Points or Name
        return (b.coins || 0) - (a.coins || 0);
      });

    // Assign Ranks 1..N
    return sortedList.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [comments, knownUsers, user]);

  // Filtered by Search Term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return leaderboardData.slice(0, 50);
    const query = searchTerm.toLowerCase().trim();
    return leaderboardData
      .filter(u => u.name.toLowerCase().includes(query) || (u.email && u.email.toLowerCase().includes(query)))
      .slice(0, 50);
  }, [leaderboardData, searchTerm]);

  // Current logged in user's rank info
  const currentUserRankInfo = useMemo(() => {
    if (!user) return null;
    const found = leaderboardData.find(
      u => u.uid === user.uid || (u.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    if (!found) return null;

    // Find who is right ahead
    const aheadUser = leaderboardData.find(u => u.rank === found.rank - 1);
    const commentsToPass = aheadUser ? Math.max(1, aheadUser.commentCount - found.commentCount + 1) : 0;

    return {
      userRank: found,
      aheadUser,
      commentsToPass,
    };
  }, [user, leaderboardData]);

  const top1 = leaderboardData[0];
  const top2 = leaderboardData[1];
  const top3 = leaderboardData[2];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 animate-fadeIn text-white">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/90 via-gray-950 to-indigo-950 border border-purple-500/30 p-6 sm:p-10 shadow-2xl shadow-purple-950/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase">
              <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Mikrokosmos Top 50 Sıralaması</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-200">
              En Aktif Okuyucu Liderlik Tablosu
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl font-medium leading-relaxed">
              Topluluğumuzda en çok yorum yaparak serileri canlı tutan ilk 50 efsanevi okuyucumuz! 
              Yorum yaptıkça skorunuz anında yükselir ve zirveye tırmanırsınız.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-row md:flex-col gap-3 flex-shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-purple-900/40 border border-purple-500/30 backdrop-blur-md text-center md:text-right shadow-lg">
              <div className="text-[10px] uppercase font-bold text-purple-300/80">Toplam Yorum Sayısı</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                {comments.length.toLocaleString('tr-TR')}
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-indigo-900/40 border border-indigo-500/30 backdrop-blur-md text-center md:text-right shadow-lg">
              <div className="text-[10px] uppercase font-bold text-indigo-300/80">Aktif Yorumcu Okuyucular</div>
              <div className="text-xl sm:text-2xl font-black text-pink-400 font-mono flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
                <Flame className="w-4 h-4 text-pink-400" />
                {leaderboardData.length.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logged In User's Personal Rank Card */}
      {user && currentUserRankInfo && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-purple-950/70 border border-purple-400/50 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
            <div className="relative flex-shrink-0">
              <UserAvatar
                avatar={user.avatar}
                name={user.name}
                frameId={user.equippedFrame}
                size="lg"
              />
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[11px] font-black shadow z-20">
                #{currentUserRankInfo.userRank.rank}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Mevcut Sıralamanız
                </span>
                {user.equippedBadge && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    {user.equippedBadge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-white truncate mt-1">
                {user.name}
              </h3>
              <div className="flex items-center gap-4 mt-1 text-xs text-purple-200 font-medium">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {currentUserRankInfo.userRank.commentCount} Yorum
                </span>
                <span className="flex items-center gap-1 text-pink-300">
                  <Heart className="w-3.5 h-3.5" />
                  {currentUserRankInfo.userRank.totalLikesReceived} Beğeni
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex-shrink-0 text-center sm:text-right bg-black/30 p-3 rounded-xl border border-purple-500/20">
            {currentUserRankInfo.aheadUser ? (
              <div className="text-xs space-y-1">
                <p className="text-purple-200 font-medium">
                  Bir üst sıradaki <strong className="text-amber-300">{currentUserRankInfo.aheadUser.name}</strong> kullanıcısını geçmek için:
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {currentUserRankInfo.commentsToPass} yorum daha yapın!
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                Tebrikler! Liderlik Tablosunun Zirvesindesiniz! 🎉
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM CHAMPIONS SHOWCASE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        {/* TOP 2 (RUNNER-UP - SILVER) */}
        {top2 ? (
          <div
            onClick={() => openPublicProfile(top2.uid)}
            className="order-2 md:order-1 relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-gray-950 to-slate-950 border border-slate-400/40 p-5 sm:p-6 shadow-xl hover:border-slate-300 transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="absolute -top-4 px-3.5 py-1 rounded-full bg-slate-400 text-gray-950 text-xs font-black tracking-wider uppercase shadow-lg flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-gray-900" />
              2. SIRA (Gümüş)
            </div>

            <div className="relative mt-4 mb-3">
              <div className="absolute inset-0 rounded-full bg-slate-400/20 blur-xl group-hover:bg-slate-400/40 transition-all" />
              <UserAvatar
                avatar={top2.avatar}
                name={top2.name}
                frameId={top2.equippedFrame}
                size="xl"
              />
            </div>

            <h3 className="text-lg font-black text-white group-hover:text-slate-300 transition-colors truncate max-w-full">
              {top2.name}
            </h3>

            {top2.equippedBadge && (
              <span className="text-[10px] font-bold text-slate-300 bg-slate-400/15 px-2.5 py-0.5 rounded-full border border-slate-400/30 mt-1">
                {top2.equippedBadge}
              </span>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-around text-xs">
              <div>
                <div className="text-[10px] font-bold text-gray-400">Yorumlar</div>
                <div className="font-mono font-extrabold text-slate-200 text-sm flex items-center justify-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  {top2.commentCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400">Beğeniler</div>
                <div className="font-mono font-extrabold text-pink-400 text-sm flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  {top2.totalLikesReceived}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-2 md:order-1 rounded-3xl bg-gray-950/40 border border-gray-800 p-6 text-center text-xs text-gray-500">
            2. Sıra için aday bekleniyor...
          </div>
        )}

        {/* TOP 1 (CHAMPION - GOLD CROWN) */}
        {top1 ? (
          <div
            onClick={() => openPublicProfile(top1.uid)}
            className="order-1 md:order-2 relative rounded-3xl bg-gradient-to-b from-amber-950/80 via-purple-950/90 to-gray-950 border-2 border-amber-400 p-6 sm:p-7 shadow-2xl shadow-amber-500/20 hover:border-amber-300 transition-all transform md:-translate-y-3 hover:-translate-y-4 cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="absolute -top-5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950 text-xs font-black tracking-widest uppercase shadow-2xl shadow-amber-500/50 flex items-center gap-1.5 animate-pulse">
              <Crown className="w-4 h-4 text-gray-950 fill-current" />
              1. ŞAMPİYON
            </div>

            <div className="relative mt-5 mb-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 blur-2xl opacity-60 group-hover:opacity-100 transition-all animate-pulse" />
              <UserAvatar
                avatar={top1.avatar}
                name={top1.name}
                frameId={top1.equippedFrame}
                size="2xl"
              />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-amber-300 group-hover:text-amber-200 transition-colors truncate max-w-full drop-shadow-md">
              {top1.name}
            </h3>

            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-extrabold text-amber-950 bg-amber-400 px-3 py-0.5 rounded-full shadow">
                Efsanevi Yorumcu 👑
              </span>
            </div>

            <div className="mt-5 pt-4 border-t border-amber-500/20 w-full flex items-center justify-around text-xs">
              <div>
                <div className="text-[10px] font-bold text-amber-200/80">Toplam Yorum</div>
                <div className="font-mono font-black text-amber-300 text-base flex items-center justify-center gap-1">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  {top1.commentCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-200/80">Aldığı Beğeni</div>
                <div className="font-mono font-black text-pink-400 text-base flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4 text-pink-400 fill-current" />
                  {top1.totalLikesReceived}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-1 md:order-2 rounded-3xl bg-gray-950/40 border border-gray-800 p-6 text-center text-xs text-gray-500">
            Henüz 1. sırada yorumcu yok!
          </div>
        )}

        {/* TOP 3 (BRONZE) */}
        {top3 ? (
          <div
            onClick={() => openPublicProfile(top3.uid)}
            className="order-3 relative rounded-3xl bg-gradient-to-b from-amber-950/40 via-gray-950 to-orange-950/50 border border-amber-700/50 p-5 sm:p-6 shadow-xl hover:border-amber-600 transition-all transform hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center group"
          >
            <div className="absolute -top-4 px-3.5 py-1 rounded-full bg-amber-700 text-white text-xs font-black tracking-wider uppercase shadow-lg flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              3. SIRA (Bronz)
            </div>

            <div className="relative mt-4 mb-3">
              <div className="absolute inset-0 rounded-full bg-amber-700/20 blur-xl group-hover:bg-amber-700/40 transition-all" />
              <UserAvatar
                avatar={top3.avatar}
                name={top3.name}
                frameId={top3.equippedFrame}
                size="xl"
              />
            </div>

            <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors truncate max-w-full">
              {top3.name}
            </h3>

            {top3.equippedBadge && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-700/40 mt-1">
                {top3.equippedBadge}
              </span>
            )}

            <div className="mt-4 pt-3 border-t border-gray-800 w-full flex items-center justify-around text-xs">
              <div>
                <div className="text-[10px] font-bold text-gray-400">Yorumlar</div>
                <div className="font-mono font-extrabold text-amber-400 text-sm flex items-center justify-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  {top3.commentCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400">Beğeniler</div>
                <div className="font-mono font-extrabold text-pink-400 text-sm flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  {top3.totalLikesReceived}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="order-3 rounded-3xl bg-gray-950/40 border border-gray-800 p-6 text-center text-xs text-gray-500">
            3. Sıra için aday bekleniyor...
          </div>
        )}
      </div>

      {/* SEARCH & LEADERBOARD TABLE (Top 4 to Top 50) */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Sıralama Listesi (Top 50)
            </h2>
            <p className="text-xs text-purple-200/60 font-medium mt-0.5">
              Yorum yaptıkça skor tablosu anında güncellenir.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Okuyucu ara..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-950 border border-purple-500/30 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>
        </div>

        {/* List Table */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              Aranan kritere uygun okuyucu bulunamadı.
            </div>
          ) : (
            filteredUsers.map((item) => {
              const isCurrentUser = user && (user.uid === item.uid || user.email === item.email);
              const isTop10 = item.rank <= 10;

              return (
                <div
                  key={item.uid + item.rank}
                  onClick={() => openPublicProfile(item.uid)}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all cursor-pointer border group ${
                    isCurrentUser
                      ? 'bg-purple-950/70 border-purple-400 shadow-md shadow-purple-950/50'
                      : isTop10
                      ? 'bg-gray-950/80 hover:bg-purple-950/40 border-purple-500/30 hover:border-purple-400/60'
                      : 'bg-gray-950/40 hover:bg-gray-900/80 border-gray-800/80 hover:border-purple-500/20'
                  }`}
                >
                  {/* Left: Rank # & User Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center flex-shrink-0 shadow ${
                        item.rank === 1
                          ? 'bg-amber-400 text-gray-950 shadow-amber-500/50'
                          : item.rank === 2
                          ? 'bg-slate-300 text-gray-950'
                          : item.rank === 3
                          ? 'bg-amber-700 text-white'
                          : item.rank <= 10
                          ? 'bg-purple-900/80 text-purple-200 border border-purple-500/30'
                          : 'bg-gray-800/80 text-gray-400'
                      }`}
                    >
                      #{item.rank}
                    </span>

                    <UserAvatar
                      avatar={item.avatar}
                      name={item.name}
                      frameId={item.equippedFrame}
                      size="md"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={`text-xs sm:text-sm font-extrabold truncate ${isCurrentUser ? 'text-amber-300' : 'text-gray-100 group-hover:text-purple-300'}`}>
                          {item.name}
                        </h4>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500 text-white">
                            Siz
                          </span>
                        )}
                        {item.equippedBadge && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.2 rounded border border-amber-500/30">
                            {item.equippedBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1 font-bold text-amber-400/90">
                          <MessageSquare className="w-3 h-3 text-amber-400" />
                          {item.commentCount} Yorum
                        </span>
                        <span className="flex items-center gap-1 text-pink-300">
                          <Heart className="w-3 h-3 text-pink-400" />
                          {item.totalLikesReceived} Beğeni
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cosmo-Puan & Public Profile Link */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {typeof item.coins === 'number' && item.coins > 0 && (
                      <div className="hidden sm:block text-right">
                        <div className="text-[9px] uppercase font-bold text-gray-400">Cosmo-Puan</div>
                        <div className="text-xs font-mono font-extrabold text-amber-300">
                          ★ {item.coins.toLocaleString('tr-TR')}
                        </div>
                      </div>
                    )}

                    <div className="p-2 rounded-xl bg-purple-950/60 group-hover:bg-purple-600 text-purple-300 group-hover:text-white transition border border-purple-500/20">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
