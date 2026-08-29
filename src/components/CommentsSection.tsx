import React
, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_STYLES, SHOP_ITEMS, ShopItem, ChibiEmoji } from '../data/shopData';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { UserAvatar } from './UserAvatar';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  AlertOctagon,
  Send,
  Eye,
  EyeOff,
  Trash2,
  LogIn,
  LogOut,
  ShieldAlert,
  Smile,
  ShoppingBag,
  Coins,
  Lock,
  Sparkles,
  Check,
  Zap
} from 'lucide-react';
import { Comment } from '../types';

const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };


interface CommentsSectionProps {
  seriesId: string;
  chapterId?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ seriesId, chapterId }) => {
  const {
    comments,
    addComment,
    toggleLikeComment,
    toggleDislikeComment,
    deleteComment,
    reportComment,
    user,
    openAuthModal,
    logout,
    openShop,
    buyShopItem,
    showToast,
    openPublicProfile,
    themeStyles: appThemeStyles,
    shopItems: appShopItems
  } = useApp();

  const themeMap = appThemeStyles || THEME_STYLES;
  const currentShopItems = appShopItems || SHOP_ITEMS;

  const [commentText, setCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString || isoString === 'Az önce') return 'Az önce';
    
    // Parse the date. If it fails, fallback to original string
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHours < 24) return `${diffHours} sa önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  // Filter comments for this series and chapter
  const filteredComments = comments.filter(c => {
    if (chapterId) return c.seriesId === seriesId && c.chapterId === chapterId;
    return c.seriesId === seriesId;
  });

  const unlockedEmojiPacks = user?.unlockedEmojiPacks || [];
  const emojiPackItems = currentShopItems.filter(i => i.category === 'emoji_pack');
  const allKnownEmojis: ChibiEmoji[] = emojiPackItems.flatMap(p => p.emojis || []);

  const handleInstantUnlockPack = (pack: ShopItem) => {
    if (!user) {
      openAuthModal('login');
      showToast?.({
        title: 'Giriş Yapmalısınız 🔒',
        message: `"${pack.name}" emoji paketini açmak için lütfen önce giriş yapın.`,
        type: 'info'
      });
      return;
    }

    const res = buyShopItem(pack.id);
    if (res.success) {
      showToast?.({
        title: '🎉 Emoji Paketi Açıldı!',
        message: `"${pack.name}" artık kullanımınıza hazır! Keyifli yorumlar.`,
        type: 'success'
      });
    } else {
      showToast?.({
        title: 'Bakiye Yetersiz 🪙',
        message: res.message,
        type: 'error'
      });
      openShop();
    }
  };

  const handleInsertEmoji = (pack: ShopItem, em: ChibiEmoji) => {
    const isPackUnlocked = unlockedEmojiPacks.includes(pack.id);
    if (!isPackUnlocked) {
      handleInstantUnlockPack(pack);
      return;
    }

    // Insert shortcode or symbol into text area
    const token = em.code || em.symbol;
    setCommentText(prev => (prev ? prev + ' ' + token : token));
  };

  const renderCommentContent = (text: string) => {
    if (!text) return null;

    let parts: React.ReactNode[] = [text];

    allKnownEmojis.forEach(em => {
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const codeToken = em.code;
          if (codeToken && part.includes(codeToken)) {
            const split = part.split(codeToken);
            split.forEach((sub, sIdx) => {
              if (sub) newParts.push(sub);
              if (sIdx < split.length - 1) {
                newParts.push(
                  <span
                    key={`${em.code}-${sIdx}`}
                    className="inline-flex items-center gap-1 mx-1 my-0.5 align-middle select-none group"
                    title={em.label}
                  >
                    {em.imageUrl ? (
                      <img
                        src={em.imageUrl}
                        alt={em.label}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] transform hover:scale-130 transition-transform cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-500/30 rounded-lg text-purple-200 text-xs font-mono font-bold shadow-sm">
                        {em.symbol}
                      </span>
                    )}
                  </span>
                );
              }
            });
          } else {
            newParts.push(part);
          }
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return parts;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    addComment({
      seriesId,
      chapterId,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.avatar,
      text: commentText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      parentId: replyTo ? replyTo.id : null,
      isSpoiler
    });

    setCommentText('');
    setImageUrl('');
    setIsSpoiler(false);
    setReplyTo(null);
    setShowEmojiPicker(false);
  };

  const toggleSpoilerReveal = (commentId: string) => {
    setRevealedSpoilers(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Collect all replies in a thread (flat list in thread order)
  const getThreadReplies = (parentId: string): Comment[] => {
    const directReplies = filteredComments
      .filter(c => c.parentId === parentId)
      // Eskiden yeniye doğru (Eski yorumlar üstte, yeni yorumlar altta)
      .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return -1;
      if (isNaN(timeB)) return 1;
      return timeA - timeB;
    });
    let all: Comment[] = [];
    for (const r of directReplies) {
      all.push(r);
      const sub = getThreadReplies(r.id);
      all = all.concat(sub);
    }
    return all;
  };

  const renderSingleCard = (c: Comment, isReply = false, replyTargetName?: string, replyTargetId?: string) => {
    const isLiked = user ? c.likes.includes(user.uid) : false;
    const isDisliked = user ? c.dislikes.includes(user.uid) : false;
    const isOwner = user?.uid === c.userId;
    const isRevealed = revealedSpoilers[c.id];

    // Theme & Badge Styling Resolution
    const themeStyle = c.equippedTheme ? themeMap[c.equippedTheme] : null;
    const commentBadges: string[] = c.equippedBadges && c.equippedBadges.length > 0
      ? c.equippedBadges.slice(0, 5)
      : (c.equippedBadge ? [c.equippedBadge] : []);

    return (
      <div
        key={c.id}
        style={
          themeStyle?.cardBgImageUrl
            ? {
                backgroundImage: `url(${themeStyle.cardBgImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }
            : undefined
        }
        className={`relative rounded-2xl transition-all duration-300 shadow-lg overflow-hidden ${
          isReply ? 'p-3.5 sm:p-4 space-y-3' : 'p-4 sm:p-5 space-y-3.5'
        } ${
          themeStyle
            ? themeStyle.cardClass
            : isReply
            ? 'bg-gray-950/90 border border-purple-500/30'
            : 'bg-gray-900/90 border border-purple-500/20'
        }`}
      >
        {/* EXTREME ANIMATED AURA BACKGROUND EFFECT */}
        <ThemeBackgroundEffects effectOverlay={themeStyle?.effectOverlay} />

        {/* Theme Decorations (Chibis/PNGs) */}
        {themeStyle?.decorations?.map((dec, idx) => (
          <img
            key={dec.id || idx}
            src={dec.imageUrl}
            className="absolute pointer-events-none drop-shadow-lg"
            style={{
              top: formatDim(dec.top),
              bottom: formatDim(dec.bottom),
              left: formatDim(dec.left),
              right: formatDim(dec.right),
              width: formatDim(dec.width),
              transform: dec.rotation ? `rotate(${dec.rotation})` : undefined,
              zIndex: dec.zIndex !== undefined ? dec.zIndex : 20
            }}
            alt=""
          />
        ))}


        {/* Reply Tag Indicator if Replying to Someone */}
        {isReply && replyTargetName && (
          <div className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 bg-purple-950/60 backdrop-blur-md border border-purple-500/40 px-3 py-1 rounded-lg shadow-sm">
            <CornerDownRight size={12} className="text-purple-400 shrink-0" />
            <span className="text-gray-400 font-normal">Yanıtlanan:</span>
            <span className="font-bold text-purple-200 cursor-pointer hover:underline" onClick={() => replyTargetId && openPublicProfile(replyTargetId)}>@{replyTargetName}</span>
          </div>
        )}

        {/* Symmetrical User Info Header */}
        <div className="relative z-10 flex items-center justify-between gap-2.5">
          <div className="flex items-center min-w-0 gap-2 sm:gap-3">
            {/* Avatar Container in foreground */}
            <div className="relative z-20 shrink-0 cursor-pointer hover:opacity-80 transition" onClick={() => c.userId && openPublicProfile(c.userId)}>
              <UserAvatar
                avatar={c.userAvatar}
                name={c.userName}
                frameId={c.equippedFrame}
                themeBorderClass={themeStyle?.avatarBorderClass}
                size="md"
              />
            </div>

            {/* Name and Date Container */}
            <div
              className={`min-w-0 ${
                themeStyle?.cardBgImageUrl
                  ? 'bg-black/75 px-3 py-1 rounded-xl border border-white/10 shadow-sm z-10 inline-flex items-center'
                  : 'pl-1'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-xs sm:text-sm tracking-wide truncate cursor-pointer hover:underline ${
                    themeStyle ? themeStyle.nameClass : 'text-gray-100'
                  }`} onClick={() => c.userId && openPublicProfile(c.userId)}>{c.userName}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{formatTimeAgo(c.date)}</span>
              </div>
            </div>
          </div>

          {/* Right Action buttons (Report / Delete) */}
          <div className={`flex items-center gap-1 shrink-0 ${
            themeStyle?.cardBgImageUrl
              ? 'bg-black/70 p-1 rounded-xl border border-white/10 shadow-sm'
              : ''
          }`}>
            <button
              type="button"
              onClick={() => reportComment(c.id)}
              className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Şikayet Et"
            >
              <AlertOctagon size={15} />
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => deleteComment(c.id)}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Sil"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* VIP Titles / Badges (Compact, full-width responsive horizontal row) */}
        {commentBadges.length > 0 && (
          <div className="relative z-10 flex items-center gap-1.5 flex-wrap pt-0.5">
            {commentBadges.map((badgeText, idx) => {
              const badgeItem = currentShopItems.find(
                i => i.category === 'badge' && (i.badgeText === badgeText || i.name === badgeText)
              );
              const badgeClass = badgeItem?.badgeStyle || (themeStyle ? themeStyle.badgeBgClass : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black');
              return (
                <span
                  key={idx}
                  className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold tracking-tight shadow-sm border border-white/10 flex items-center gap-1 whitespace-nowrap leading-tight transition-transform hover:scale-105 ${badgeClass}`}
                >
                  <span>{badgeText}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Comment Text with Spoiler Blur & Word Wrapping */}
        <div className={`relative z-10 ${
          themeStyle?.cardBgImageUrl && !c.isSpoiler
            ? 'bg-black/75 p-3 rounded-xl border border-white/10 shadow-md'
            : ''
        }`}>
          {c.isSpoiler ? (
            <div
              onClick={() => toggleSpoilerReveal(c.id)}
              className="relative p-3.5 rounded-xl border border-purple-500/40 bg-purple-950/40 backdrop-blur-md cursor-pointer group hover:bg-purple-950/60 transition"
            >
              {!isRevealed ? (
                <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-amber-300">
                  <EyeOff size={16} />
                  <span>Spoiler İçerik! Görmek için tıklayın</span>
                </div>
              ) : (
                <div>
                  <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
                    {renderCommentContent(c.text)}
                  </div>
                  <div className="text-[10px] text-amber-400/90 mt-2 flex items-center gap-1 font-semibold">
                    <Eye size={12} />
                    <span>Spoiler Göründü</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
              {renderCommentContent(c.text)}
            </div>
          )}

          {/* Attached image if any */}
          {c.imageUrl && (
            <img
              src={c.imageUrl}
              alt="Görsel Eki"
              className="mt-3 rounded-xl max-h-52 object-cover border border-purple-500/20 shadow-md"
            />
          )}
        </div>

        {/* Action Bar (Likes / Dislikes / Reply) - Clean Symmetrical Footer */}
        <div className={`relative z-10 flex items-center justify-between ${
          themeStyle?.cardBgImageUrl
            ? 'pt-1'
            : 'border-t border-white/10 pt-2.5'
        } text-xs`}>
          <div className={`flex items-center gap-3.5 ${
            themeStyle?.cardBgImageUrl
              ? 'bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm'
              : ''
          }`}>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                toggleLikeComment(c.id, user.uid);
              }}
              className={`flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition cursor-pointer ${
                isLiked ? 'text-purple-400' : 'text-gray-400 hover:text-purple-300'
              }`}
            >
              <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
              <span>{c.likes.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                toggleDislikeComment(c.id, user.uid);
              }}
              className={`flex items-center gap-1.5 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition cursor-pointer ${
                isDisliked ? 'text-red-400' : 'text-gray-400 hover:text-red-300'
              }`}
            >
              <ThumbsDown size={14} className={isDisliked ? 'fill-current' : ''} />
              <span>{c.dislikes.length}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setReplyTo({ id: c.id, name: c.userName });
              }}
              className="flex items-center gap-1.5 text-gray-400 hover:text-purple-300 font-semibold px-2 py-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
            >
              <CornerDownRight size={14} />
              <span>Yanıtla</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const topLevelComments = filteredComments
    .filter(c => !c.parentId)
    // En yeni yorumlar üstte (Yeniden eskiye doğru)
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeB - timeA;
    });

  return (
    <div className="bg-gray-900/95 border border-purple-500/20 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6">
      
      {/* Title & Auth Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="text-purple-400" size={20} />
          Yorumlar ({filteredComments.length})
        </h3>

        <div className="flex items-center gap-2">
          {/* Shop Quick Shortcut Button */}
          <button
            type="button"
            onClick={openShop}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
          >
            <ShoppingBag size={14} className="stroke-[2.5]" />
            <span>Mağaza {user ? ((user.email?.toLowerCase() === 'aseleliyeva77@gmail.com' || user.email?.toLowerCase() === 'mikrokosmosfansub@gmail.com') ? '(∞ CP)' : `(${user.coins ?? 250} CP)`) : ''}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-800 px-3 py-1.5 rounded-xl text-xs">
              <UserAvatar
                avatar={user.avatar}
                name={user.name}
                frameId={user.equippedFrame}
                size="xs"
              />
              <span className="font-semibold text-purple-200">{user.name}</span>
              <button
                type="button"
                onClick={logout}
                className="ml-2 text-gray-400 hover:text-red-400 transition"
                title="Çıkış Yap"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <LogIn size={14} />
              Giriş Yap / Kayıt Ol
            </button>
          )}
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-purple-950/40 border border-purple-500/20 rounded-2xl p-4 text-xs text-purple-200 space-y-1">
        <span className="font-bold text-amber-300 block uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-amber-400" /> YORUM KURALLARIMIZ
        </span>
        <p>• Spoiler içeren yorumlarda mutlaka "Spoiler" kutucuğunu işaretleyiniz.</p>
        <p>• Saygılı ve nazik bir üslup kullanınız; hakaret ve küfür yasaktır.</p>
      </div>

      {/* Comment Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {replyTo && (
          <div className="bg-purple-900/40 border border-purple-500/30 p-2 rounded-xl text-xs text-purple-200 flex items-center justify-between">
            <span>@{replyTo.name} kişisine yanıt veriyorsunuz...</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-xs font-bold text-purple-400 hover:text-white"
            >
              İptal
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Düşüncelerini paylaş..."
            rows={3}
            className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-gray-500 text-xs sm:text-sm rounded-2xl p-3.5 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none shadow-inner"
          />
          {/* Quick Tag Bar & Chibi Emoji Picker Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 px-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
              <span className="text-[11px] text-gray-500 font-medium mr-1 shrink-0">Hızlı İfade:</span>
              {['Efsane!', 'Çok İyi', 'Teşekkürler', 'Harika Bölüm', 'Tavsiye Ederim'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCommentText(prev => (prev ? prev + ' ' + tag : tag))}
                  className="bg-gray-800/80 hover:bg-purple-900/60 border border-purple-500/20 text-xs px-2 py-0.5 rounded-lg text-purple-200 transition font-medium whitespace-nowrap shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap shrink-0 w-full sm:w-auto ${
                showEmojiPicker
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-purple-950/80 text-purple-300 border border-purple-800 hover:bg-purple-900'
              }`}
            >
              <Smile size={14} /> Chibi Emojiler {showEmojiPicker ? '▲' : '▼'}
            </button>
          </div>

          {/* CHIBI EMOJI DRAWER */}
          {showEmojiPicker && (
            <div className="mt-2 p-3 bg-gray-950 border border-purple-500/40 rounded-2xl space-y-3 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" /> Özel Chibi Emojiler
                </span>
                <button
                  type="button"
                  onClick={openShop}
                  className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                >
                  <ShoppingBag size={12} /> Mağazadan Yeni Paketler Aç
                </button>
              </div>

              {/* Basic Free Emojis */}
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Genel Okuyucu Emojileri
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['🔥', '✨', '💖', '😱', '😍', '😎', '👑', '🎉', '👏', '👀', '💯', '🚀'].map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCommentText(prev => prev + em)}
                      className="p-2 bg-gray-900 hover:bg-purple-900/60 border border-gray-800 hover:border-purple-500/50 rounded-xl text-base transition transform hover:scale-110"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chibi Emoji Packs */}
              {emojiPackItems.map(pack => {
                const isPackUnlocked = unlockedEmojiPacks.includes(pack.id);
                return (
                  <div key={pack.id} className="pt-2.5 border-t border-gray-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                        <span className="text-base">{pack.icon || '✨'}</span> {pack.name}
                      </span>
                      {isPackUnlocked ? (
                        <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Check size={10} /> Açık & Kullanıma Hazır
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInstantUnlockPack(pack)}
                          className="text-[10px] text-amber-300 bg-amber-950/90 border border-amber-500/50 hover:bg-amber-900 px-2.5 py-1 rounded-xl font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <Lock size={11} className="text-amber-400" />
                          Hemen Aç ({pack.price} CP)
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {pack.emojis?.map((em, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInsertEmoji(pack, em)}
                          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                            isPackUnlocked
                              ? 'bg-gray-900/90 hover:bg-purple-950/80 border-purple-500/30 hover:border-purple-500/70 text-purple-200 hover:scale-102 shadow-sm'
                              : 'bg-gray-950/80 border-gray-800 hover:border-amber-500/50 text-gray-400 hover:text-amber-300'
                          }`}
                          title={isPackUnlocked ? `${em.label} (${em.code})` : `${pack.name} paketini ${pack.price} CP ile açmak için tıkla`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:4px_4px] bg-black/60 flex items-center justify-center p-0.5 shrink-0 border border-gray-800">
                            {em.imageUrl ? (
                              <img
                                src={em.imageUrl}
                                alt={em.label}
                                className="max-w-full max-h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-xs font-bold text-amber-300">{em.symbol}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-gray-200 truncate">{em.label}</p>
                            <p className="text-[9px] text-purple-300 font-mono truncate">{em.code}</p>
                          </div>
                          {!isPackUnlocked && (
                            <Lock size={12} className="text-amber-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Controls: Spoiler Checkbox & Image Link */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 font-medium">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={e => setIsSpoiler(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-950 border-gray-700"
              />
              <span>Spoiler olarak gönder</span>
            </label>

            <input
              type="text"
              placeholder="Görsel URL ekle (opsiyonel)"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="bg-gray-950 border border-gray-800 text-white text-xs rounded-xl px-2.5 py-1.5 w-44 sm:w-56 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Spam ve Bot Korumalı
            </span>

            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Send size={15} />
              Gönder
            </button>
          </div>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-6 pt-4 border-t border-gray-800">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400 italic">
            İlk yorumu siz yapın!
          </div>
        ) : (
          topLevelComments.map(c => {
            const replies = getThreadReplies(c.id);
            return (
              <div key={c.id} className="space-y-2.5">
                {/* Main Top Comment Card */}
                {renderSingleCard(c, false)}

                {/* Flat Stacked Replies List */}
                {replies.length > 0 && (
                  <div className="ml-3 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-purple-500/30 space-y-2.5 pt-1">
                    {replies.map(reply => {
                      const target = comments.find(x => x.id === reply.parentId);
                      return renderSingleCard(reply, true, target?.userName, target?.userId);
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
