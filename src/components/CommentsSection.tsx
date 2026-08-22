import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_STYLES, SHOP_ITEMS } from '../data/shopData';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
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
  Sparkles
} from 'lucide-react';
import { Comment } from '../types';

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
    loginWithGoogle,
    logout,
    openShop,
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

  // Filter comments for this series and chapter
  const filteredComments = comments.filter(c => {
    if (chapterId) return c.seriesId === seriesId && c.chapterId === chapterId;
    return c.seriesId === seriesId;
  });

  const unlockedEmojiPacks = user?.unlockedEmojiPacks || [];
  const emojiPackItems = currentShopItems.filter(i => i.category === 'emoji_pack');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      alert('Yorum yapmak için lütfen Google ile giriş yapın veya misafir profilinizi onaylayın.');
      loginWithGoogle();
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
    const directReplies = filteredComments.filter(c => c.parentId === parentId);
    let all: Comment[] = [];
    for (const r of directReplies) {
      all.push(r);
      const sub = getThreadReplies(r.id);
      all = all.concat(sub);
    }
    return all;
  };

  const renderSingleCard = (c: Comment, isReply = false, replyTargetName?: string) => {
    const isLiked = user ? c.likes.includes(user.uid) : false;
    const isDisliked = user ? c.dislikes.includes(user.uid) : false;
    const isOwner = user?.uid === c.userId;
    const isRevealed = revealedSpoilers[c.id];

    // Theme & Badge Styling Resolution
    const themeStyle = c.equippedTheme ? themeMap[c.equippedTheme] : null;

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
          isReply ? 'p-3.5 space-y-2' : 'p-4 space-y-3'
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

        {/* Reply Tag Indicator if Replying to Someone */}
        {isReply && replyTargetName && (
          <div className="relative z-10 inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 bg-black/70 backdrop-blur-md border border-purple-500/40 px-2.5 py-0.5 rounded-lg shadow">
            <CornerDownRight size={12} className="text-purple-400 shrink-0" />
            <span className="text-gray-400 font-normal">Yanıtlanan:</span>
            <span className="font-bold text-purple-200">@{replyTargetName}</span>
          </div>
        )}

        {/* User Info Header */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className={`flex items-center gap-2.5 w-fit ${
            themeStyle?.cardBgImageUrl
              ? 'bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-md'
              : ''
          }`}>
            {/* Avatar Container */}
            <div className="relative flex items-center shrink-0">
              <img
                src={c.userAvatar}
                alt={c.userName}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover bg-purple-950 ${
                  themeStyle ? themeStyle.avatarBorderClass : 'border border-purple-400/30'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-bold text-xs sm:text-sm block ${
                    themeStyle ? themeStyle.nameClass : 'text-gray-100'
                  }`}
                >
                  {c.userName}
                </span>

                {/* VIP Badge Tag */}
                {c.equippedBadge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-black shadow-sm ${
                      themeStyle
                        ? themeStyle.badgeBgClass
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                    }`}
                  >
                    {c.equippedBadge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400 block">{c.date}</span>
            </div>
          </div>

          <div className={`flex items-center gap-1 ${
            themeStyle?.cardBgImageUrl
              ? 'bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-md'
              : ''
          }`}>
            <button
              onClick={() => reportComment(c.id)}
              className="text-gray-300 hover:text-amber-400 p-1 text-xs transition"
              title="Şikayet Et"
            >
              <AlertOctagon size={14} />
            </button>

            {isOwner && (
              <button
                onClick={() => deleteComment(c.id)}
                className="text-gray-300 hover:text-red-400 p-1 text-xs transition"
                title="Sil"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Comment Text with Spoiler Blur & Word Wrapping */}
        <div className={`relative z-10 ${
          themeStyle?.cardBgImageUrl && !c.isSpoiler
            ? 'bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-md'
            : ''
        }`}>
          {c.isSpoiler ? (
            <div
              onClick={() => toggleSpoilerReveal(c.id)}
              className={`relative p-3 rounded-xl border cursor-pointer group ${
                themeStyle?.cardBgImageUrl
                  ? 'bg-black/75 backdrop-blur-md border-purple-500/40'
                  : 'bg-purple-950/40 border-purple-500/30'
              }`}
            >
              {!isRevealed ? (
                <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-amber-300">
                  <EyeOff size={16} />
                  <span>Spoiler İçerik! Görmek için tıklayın</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
                    {c.text}
                  </p>
                  <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1 font-semibold">
                    <Eye size={12} />
                    <span>Spoiler Göründü</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words break-all [overflow-wrap:anywhere]">
              {c.text}
            </p>
          )}

          {/* Attached image if any */}
          {c.imageUrl && (
            <img
              src={c.imageUrl}
              alt="Görsel Eki"
              className="mt-2 rounded-xl max-h-48 object-cover border border-purple-500/20"
            />
          )}
        </div>

        {/* Action Bar (Likes / Dislikes / Reply) */}
        <div className={`relative z-10 flex items-center gap-4 text-xs ${
          themeStyle?.cardBgImageUrl
            ? 'bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-md w-fit'
            : 'pt-1 border-t border-gray-800/80'
        }`}>
          <button
            onClick={() => user && toggleLikeComment(c.id, user.uid)}
            className={`flex items-center gap-1 font-semibold transition ${
              isLiked ? 'text-purple-400' : 'text-gray-400 hover:text-purple-300'
            }`}
          >
            <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
            <span>{c.likes.length}</span>
          </button>

          <button
            onClick={() => user && toggleDislikeComment(c.id, user.uid)}
            className={`flex items-center gap-1 font-semibold transition ${
              isDisliked ? 'text-red-400' : 'text-gray-400 hover:text-red-300'
            }`}
          >
            <ThumbsDown size={14} className={isDisliked ? 'fill-current' : ''} />
            <span>{c.dislikes.length}</span>
          </button>

          <button
            onClick={() => setReplyTo({ id: c.id, name: c.userName })}
            className="flex items-center gap-1 text-gray-400 hover:text-purple-300 font-semibold transition"
          >
            <CornerDownRight size={14} />
            <span>Yanıtla</span>
          </button>
        </div>
      </div>
    );
  };

  const topLevelComments = filteredComments.filter(c => !c.parentId);

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
            <span>Mağaza ({user?.email?.toLowerCase() === 'aseleliyeva77@gmail.com' ? '∞ CP' : `${user?.coins ?? 250} CP`})</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-800 px-3 py-1.5 rounded-xl text-xs">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
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
              onClick={loginWithGoogle}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <LogIn size={14} />
              Google ile Giriş Yap
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
          <div className="flex items-center justify-between gap-2 mt-1.5 px-1 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-medium mr-1">Hızlı İfade:</span>
              {['Efsane!', 'Çok İyi', 'Teşekkürler', 'Harika Bölüm', 'Tavsiye Ederim'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCommentText(prev => (prev ? prev + ' ' + tag : tag))}
                  className="bg-gray-800/80 hover:bg-purple-900/60 border border-purple-500/20 text-xs px-2 py-0.5 rounded-lg text-purple-200 transition font-medium whitespace-nowrap"
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
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
                  <div key={pack.id} className="pt-2 border-t border-gray-900">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                        <span>{pack.icon}</span> {pack.name}
                      </span>
                      {isPackUnlocked ? (
                        <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          Açık
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={openShop}
                          className="text-[10px] text-amber-300 bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900 px-2 py-0.5 rounded font-bold flex items-center gap-1"
                        >
                          <Lock size={10} /> Kilidi Aç ({pack.price} CP)
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {pack.emojis?.map((em, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={!isPackUnlocked}
                          onClick={() => {
                            if (isPackUnlocked) {
                              setCommentText(prev => prev + ' ' + em.symbol);
                            } else {
                              openShop();
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono transition flex items-center gap-1.5 ${
                            isPackUnlocked
                              ? 'bg-purple-950/60 hover:bg-purple-800/80 border-purple-500/40 text-purple-200 hover:scale-105'
                              : 'bg-gray-900/50 border-gray-800 text-gray-500 cursor-not-allowed opacity-60'
                          }`}
                          title={isPackUnlocked ? em.label : 'Kilidi açmak için tıklayın'}
                        >
                          <span className="text-sm">{em.symbol}</span>
                          <span className="text-[10px] opacity-70">{em.code}</span>
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
                      return renderSingleCard(reply, true, target?.userName);
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
