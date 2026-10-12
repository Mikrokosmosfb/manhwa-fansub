import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_STYLES, SHOP_ITEMS, ShopItem, ChibiEmoji } from '../data/shopData';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { UserAvatar } from './UserAvatar';
import { normalizeShopInventory, formatRemainingDuration } from '../utils/shopExpiration';
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
  Zap,
  Quote,
  Edit3,
  X
} from 'lucide-react';
import { Comment, isAuthorizedAdmin } from '../types';
import { TeamBadges } from './TeamBadge';

const formatDim = (v?: string | number | null) => { if (!v && v !== 0) return undefined; const trim = String(v).trim(); return (trim && !isNaN(Number(trim))) ? `${trim}px` : trim; };

const REACTION_OPTIONS = [
  { id: 'love', emoji: '🫠', label: 'Kalbim Çıktı', sub: 'Düştüm kaldırın' },
  { id: 'fire', emoji: '🛐', label: 'Tam Şaheser', sub: 'Saygıyla eğildim' },
  { id: 'funny', emoji: '😂', label: 'Haykırdım', sub: 'Gülmekten öldüm' },
  { id: 'shock', emoji: '🤯', label: 'Beynim Yandı', sub: 'Kaos & Şoktayım' },
  { id: 'sad', emoji: '😭', label: 'Mendil Getirin', sub: 'Gözyaşı sel oldu' }
] as const;


interface CommentsSectionProps {
  seriesId: string;
  chapterId?: string;
  isParagraphMode?: boolean;
  paragraphLookup?: Record<string, { text: string; index: number }>;
  sceneImages?: string[];
  onJumpToParagraph?: (paraKey: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  seriesId,
  chapterId,
  isParagraphMode = false,
  paragraphLookup,
  sceneImages,
  onJumpToParagraph
}) => {
  const {
    comments,
    addComment,
    editComment,
    toggleLikeComment,
    toggleDislikeComment,
    deleteComment,
    reportComment,
    user,
    isAdminLoggedIn,
    openAuthModal,
    logout,
    openShop,
    buyShopItem,
    showToast,
    openPublicProfile,
    getUserTeamRoles,
    knownUsers,
    themeStyles: appThemeStyles,
    shopItems: appShopItems
  } = useApp();

  const themeMap = appThemeStyles || THEME_STYLES;
  const currentShopItems = appShopItems || SHOP_ITEMS;

  const [commentText, setCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyIsSpoiler, setReplyIsSpoiler] = useState(false);
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [reportReason, setReportReason] = useState('Küfür / Hakaret / Zorbalık');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingIsSpoiler, setEditingIsSpoiler] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');

  // Series / Chapter 5-Emoji Reactions State
  const reactionTargetKey = chapterId ? `${seriesId}:${chapterId}` : `${seriesId}:series`;
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem('mk_reactions_map');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [userReactions, setUserReactions] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('mk_user_reactions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    fetch('/api/reactions', { cache: 'no-store' })
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success && resData.data && typeof resData.data === 'object') {
          setReactionsMap(prev => {
            const merged = { ...prev, ...resData.data };
            try {
              localStorage.setItem('mk_reactions_map', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [reactionTargetKey]);

  const currentReactions = reactionsMap[reactionTargetKey] || {};
  const selectedReactionId = userReactions[reactionTargetKey] || null;
  const totalReactionVotes = REACTION_OPTIONS.reduce(
    (sum, opt) => sum + (Number(currentReactions[opt.id]) || 0),
    0
  );

  const handleToggleReaction = (reactionId: string) => {
    const prevSelected = userReactions[reactionTargetKey] || null;
    const currentTargetCounts = { ...(reactionsMap[reactionTargetKey] || {}) };

    let nextSelected: string | null = reactionId;
    if (prevSelected === reactionId) {
      // Unselect existing reaction
      nextSelected = null;
      currentTargetCounts[reactionId] = Math.max(0, (Number(currentTargetCounts[reactionId]) || 1) - 1);
    } else {
      if (prevSelected) {
        currentTargetCounts[prevSelected] = Math.max(0, (Number(currentTargetCounts[prevSelected]) || 1) - 1);
      }
      currentTargetCounts[reactionId] = (Number(currentTargetCounts[reactionId]) || 0) + 1;
    }

    const nextMap = {
      ...reactionsMap,
      [reactionTargetKey]: currentTargetCounts
    };
    const nextUserReactions = { ...userReactions };
    if (nextSelected) {
      nextUserReactions[reactionTargetKey] = nextSelected;
    } else {
      delete nextUserReactions[reactionTargetKey];
    }

    setReactionsMap(nextMap);
    setUserReactions(nextUserReactions);

    try {
      localStorage.setItem('mk_reactions_map', JSON.stringify(nextMap));
      localStorage.setItem('mk_user_reactions', JSON.stringify(nextUserReactions));
    } catch (e) {}

    fetch('/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetKey: reactionTargetKey,
        targetCounts: currentTargetCounts
      }),
      keepalive: true
    }).catch(() => {});
  };

  const handleConfirmReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingComment || isSubmittingReport) return;
    setIsSubmittingReport(true);
    await reportComment(reportingComment.id, reportReason, reportDetails.trim());
    setIsSubmittingReport(false);
    setReportingComment(null);
    setReportDetails('');
    showToast?.({
      title: 'Yorum Bildirildi 🚨',
      message: 'Şikayetiniz ilgili yorum detayıyla birlikte mikrokosmosfansub@gmail.com adresine iletildi.',
      type: 'success'
    });
  };

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
  // - In paragraph drawer mode: show only comments for that specific paragraph key
  // - In chapter bottom mode: show both general chapter comments AND all paragraph comments of this chapter
  // - In series detail mode: show general series comments (exclude paragraph-specific comments)
  const filteredComments = comments.filter(c => {
    if (chapterId) {
      if (isParagraphMode) {
        return c.seriesId === seriesId && c.chapterId === chapterId;
      }
      const rawChId = String(c.chapterId || '');
      return (
        c.seriesId === seriesId &&
        (rawChId === chapterId || rawChId.startsWith(`${chapterId}__p__`))
      );
    }
    return c.seriesId === seriesId && !String(c.chapterId || '').includes('__p__');
  });

  const normalizedEmojiInv = normalizeShopInventory(
    [user?.unlockedEmojiPacks, user?.inventory],
    user?.inventoryExpiresAt
  );
  const unlockedEmojiPacks = normalizedEmojiInv.activeInventory;
  const emojiExpiresAtMap = normalizedEmojiInv.expiresAtMap;
  const emojiPackItems = currentShopItems.filter(i => i.category === 'emoji_pack');
  const ownedEmojiPacks = emojiPackItems.filter(p => unlockedEmojiPacks.includes(p.id));
  const lockedEmojiPacks = emojiPackItems.filter(p => !unlockedEmojiPacks.includes(p.id));
  const allKnownEmojis: ChibiEmoji[] = emojiPackItems.flatMap(p => p.emojis || []);

  const handleInstantUnlockPack = (
    pack: ShopItem,
    emojiToInsert?: ChibiEmoji,
    target: 'main' | 'reply' = 'main'
  ) => {
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
      if (emojiToInsert) {
        const token = emojiToInsert.code || emojiToInsert.symbol;
        if (target === 'reply') {
          setReplyText(prev => (prev ? prev + ' ' + token : token));
        } else {
          setCommentText(prev => (prev ? prev + ' ' + token : token));
        }
      }
      showToast?.({
        title: '🎉 Emoji Paketi Açıldı!',
        message: `"${pack.name}" artık kullanımınıza hazır! Keyifli yorumlar.`,
        type: 'success'
      });
    } else {
      const isInsufficient = res.message.toLowerCase().includes('yetersiz');
      showToast?.({
        title: isInsufficient ? 'Bakiye Yetersiz 🪙' : 'Bilgi',
        message: res.message,
        type: isInsufficient ? 'error' : 'info'
      });
      if (isInsufficient) {
        openShop();
      }
    }
  };

  const handleInsertEmoji = (pack: ShopItem, em: ChibiEmoji, target: 'main' | 'reply' = 'main') => {
    const isPackUnlocked = unlockedEmojiPacks.includes(pack.id);
    if (!isPackUnlocked) {
      handleInstantUnlockPack(pack, em, target);
      return;
    }

    // Insert shortcode or symbol into text area
    const token = em.code || em.symbol;
    if (target === 'reply') {
      setReplyText(prev => (prev ? prev + ' ' + token : token));
    } else {
      setCommentText(prev => (prev ? prev + ' ' + token : token));
    }
  };

  const renderEmojiPickerDrawer = (target: 'main' | 'reply') => (
    <div className="mt-2 p-3.5 bg-gray-950 border border-purple-500/40 rounded-2xl space-y-4 animate-fadeIn shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
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

      {/* 1. PURCHASED / OWNED CHIBIS SECTION (SEPARATE AT VERY TOP) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-gray-900/95 to-gray-950 border border-emerald-500/40 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black text-emerald-300 flex items-center gap-1.5">
              <Check size={14} className="text-emerald-400 stroke-[3]" />
              Satın Alınan Chibilerim
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {ownedEmojiPacks.length} Paket • {ownedEmojiPacks.reduce((acc, p) => acc + (p.emojis?.length || 0), 0)} Chibi
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/90 font-bold">
            Tıkla & Yorumuna Ekle ✨
          </span>
        </div>

        {ownedEmojiPacks.length > 0 ? (
          <div className="space-y-3">
            {ownedEmojiPacks.map(pack => (
              <div key={pack.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <span className="text-sm">{pack.icon || '✨'}</span> {pack.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Check size={10} /> Açık • ⏳ {formatRemainingDuration(emojiExpiresAtMap[pack.id])}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {pack.emojis?.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertEmoji(pack, em, target)}
                      className="group p-2 rounded-xl bg-gray-900/95 hover:bg-purple-950/80 border border-emerald-500/30 hover:border-amber-400/70 transition flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.03]"
                      title={`${em.label} ekle`}
                    >
                      <div className="w-11 h-11 rounded-lg bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:4px_4px] bg-black/60 flex items-center justify-center p-1 shrink-0 border border-gray-800">
                        {em.imageUrl ? (
                          <img
                            src={em.imageUrl}
                            alt={em.label}
                            className="max-w-full max-h-full object-contain drop-shadow group-hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-sm font-bold text-amber-300">{em.symbol}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-100 truncate w-full">{em.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3 px-2 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-400">
            Henüz satın aldığınız bir Chibi paketi bulunmuyor. Aşağıdaki paketlerden dilediğinizi tek tıkla açabilirsiniz!
          </div>
        )}
      </div>

      {/* 2. BASIC FREE EMOJIS */}
      <div className="pt-1">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
          Genel Okuyucu Emojileri (Ücretsiz)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {['🔥', '✨', '💖', '😱', '😍', '😎', '👑', '🎉', '👏', '👀', '💯', '🚀'].map((em, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                target === 'reply'
                  ? setReplyText(prev => prev + em)
                  : setCommentText(prev => prev + em)
              }
              className="p-2 bg-gray-900 hover:bg-purple-900/60 border border-gray-800 hover:border-purple-500/50 rounded-xl text-base transition transform hover:scale-110"
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* 3. LOCKED / UNPURCHASED CHIBI PACKS SECTION */}
      {lockedEmojiPacks.length > 0 && (
        <div className="pt-3 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-300/90 uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={12} className="text-amber-400" />
              Mağazadaki Diğer Chibi Paketleri ({lockedEmojiPacks.length} Paket)
            </span>
          </div>

          {lockedEmojiPacks.map(pack => (
            <div key={pack.id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800/90 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <span className="text-base">{pack.icon || '✨'}</span> {pack.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleInstantUnlockPack(pack, undefined, target)}
                  className="text-[10px] text-amber-300 bg-amber-950/90 border border-amber-500/50 hover:bg-amber-900 px-2.5 py-1 rounded-xl font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Lock size={11} className="text-amber-400" />
                  Hemen Aç ({pack.price} CP • 1 Ay)
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {pack.emojis?.map((em, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertEmoji(pack, em, target)}
                    className="p-2 rounded-xl bg-gray-950/80 border border-gray-800 hover:border-amber-500/50 text-gray-400 hover:text-amber-300 transition flex flex-col items-center justify-center text-center gap-1 cursor-pointer relative group"
                    title={`${pack.name} paketini ${pack.price} CP ile açmak için tıkla`}
                  >
                    <Lock size={10} className="text-amber-400/80 absolute top-1.5 right-1.5" />
                    <div className="w-10 h-10 rounded-lg bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:4px_4px] bg-black/60 flex items-center justify-center p-1 shrink-0 border border-gray-800 opacity-85 group-hover:opacity-100">
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
                    <span className="text-[10px] font-bold text-gray-300 truncate w-full">{em.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

    const userTeamRoles = getUserTeamRoles(user);
    addComment({
      seriesId,
      chapterId,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.avatar,
      text: commentText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      parentId: null,
      isSpoiler,
      teamRoles: userTeamRoles,
      teamRole: userTeamRoles[0] || null
    });

    setCommentText('');
    setImageUrl('');
    setIsSpoiler(false);
    setShowEmojiPicker(false);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo || !replyText.trim()) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    const parentComment = comments.find(cm => cm.id === replyTo.id);
    const effectiveChapterId = parentComment?.chapterId || chapterId;
    const userTeamRoles = getUserTeamRoles(user);

    addComment({
      seriesId,
      chapterId: effectiveChapterId,
      userId: user.uid,
      userName: user.name,
      userAvatar: user.avatar,
      text: replyText.trim(),
      imageUrl: replyImageUrl.trim() || undefined,
      parentId: replyTo.id,
      isSpoiler: replyIsSpoiler,
      teamRoles: userTeamRoles,
      teamRole: userTeamRoles[0] || null
    });

    setReplyText('');
    setReplyImageUrl('');
    setReplyIsSpoiler(false);
    setReplyTo(null);
    setShowReplyEmojiPicker(false);
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
    const isOwner = Boolean(
      (user && (user.uid === c.userId || isAuthorizedAdmin(user.email))) || isAdminLoggedIn
    );
    const isRevealed = revealedSpoilers[c.id];

    // Theme & Badge Styling Resolution
    const themeStyle = c.equippedTheme ? themeMap[c.equippedTheme] : null;

    // Resolve all active / purchased badges for this comment author
    const getCommentAuthorBadges = (): string[] => {
      let rawBadges: string[] = [];

      const isCurrentUser = Boolean(
        user && (
          (c.userId && c.userId === user.uid) ||
          (c.userName && user.name && c.userName.toLowerCase().trim() === user.name.toLowerCase().trim()) ||
          (c.userId && user.email && c.userId.toLowerCase().trim() === user.email.toLowerCase().trim())
        )
      );

      if (isCurrentUser && user) {
        const equipped = user.equippedBadges && user.equippedBadges.length > 0
          ? user.equippedBadges
          : (user.equippedBadge ? [user.equippedBadge] : []);
        
        const normalizedInv = normalizeShopInventory(
          [user.inventory, user.unlockedEmojiPacks],
          user.inventoryExpiresAt
        ).activeInventory;

        const purchasedBadgeItems = currentShopItems.filter(
          i => i.category === 'badge' && normalizedInv.includes(i.id)
        );
        const purchasedBadgeTexts = purchasedBadgeItems.map(i => i.badgeText || i.name);

        rawBadges = Array.from(new Set([...equipped, ...purchasedBadgeTexts]));
      } else {
        const matchedKnown = (knownUsers || []).find(k => 
          (c.userId && k.uid === c.userId) ||
          (c.userName && k.name && k.name.toLowerCase().trim() === c.userName.toLowerCase().trim()) ||
          (c.userId && k.email && c.userId.toLowerCase().trim() === k.email.toLowerCase().trim())
        );

        if (matchedKnown) {
          const knownEquipped = matchedKnown.equippedBadges && matchedKnown.equippedBadges.length > 0
            ? matchedKnown.equippedBadges
            : (matchedKnown.equippedBadge ? [matchedKnown.equippedBadge] : []);
          rawBadges = knownEquipped;
        }

        if (rawBadges.length === 0) {
          if (c.equippedBadges && c.equippedBadges.length > 0) {
            rawBadges = c.equippedBadges;
          } else if (c.equippedBadge) {
            rawBadges = [c.equippedBadge];
          }
        }
      }

      return Array.from(new Set(rawBadges));
    };

    const authorBadges = getCommentAuthorBadges();

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
        <div className="relative z-10 flex items-start justify-between gap-2.5">
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

            {/* Name, Team Roles and Purchased Badges Container */}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              {/* Name, Team Roles and Date Box */}
              <div
                className={`min-w-0 max-w-fit ${
                  themeStyle?.cardBgImageUrl
                    ? 'bg-black/75 px-3 py-1 rounded-xl border border-white/10 shadow-sm z-10'
                    : 'pl-0.5'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-xs sm:text-sm tracking-wide truncate cursor-pointer hover:underline ${
                      themeStyle ? themeStyle.nameClass : 'text-gray-100'
                    }`} onClick={() => c.userId && openPublicProfile(c.userId)}>{c.userName}</span>
                  <TeamBadges roles={getUserTeamRoles(c)} size="xs" />
                  <span className="text-[10px] text-gray-400 shrink-0">{formatTimeAgo(c.date)}</span>
                </div>
              </div>

              {/* Purchased Badges / Etiketler (Displayed SEPARATELY under the username box) */}
              {authorBadges.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 z-10">
                  {authorBadges.map((badgeText, idx) => {
                    const badgeItem = currentShopItems.find(
                      i => i.category === 'badge' && (i.badgeText === badgeText || i.name === badgeText)
                    );
                    const badgeClass = badgeItem?.badgeStyle || (themeStyle ? themeStyle.badgeBgClass : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-extrabold');
                    return (
                      <span
                        key={idx}
                        className={`text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-md font-black tracking-tight shadow-sm border border-white/10 flex items-center gap-1 whitespace-nowrap leading-tight transition-transform hover:scale-105 ${badgeClass}`}
                      >
                        <span>{badgeText}</span>
                      </span>
                    );
                  })}
                </div>
              )}
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
              onClick={() => {
                setReportingComment(c);
                setReportReason('Küfür / Hakaret / Zorbalık');
                setReportDetails('');
              }}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer flex items-center gap-1 ${
                c.reported ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'
              }`}
              title="Yorumu Bildir / Şikayet Et"
            >
              <AlertOctagon size={15} />
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (editingCommentId === c.id) {
                      setEditingCommentId(null);
                    } else {
                      setEditingCommentId(c.id);
                      setEditingText(c.text);
                      setEditingIsSpoiler(Boolean(c.isSpoiler));
                      setEditingImageUrl(c.imageUrl || '');
                    }
                  }}
                  className="text-gray-400 hover:text-purple-300 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Yorumu Düzenle"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (replyTo?.id === c.id) setReplyTo(null);
                    deleteComment(c.id);
                    showToast?.({
                      title: 'Yorum Silindi 🗑️',
                      message: 'Yorum hem ekrandan hem de veritabanından kalıcı olarak kaldırıldı.',
                      type: 'info'
                    });
                  }}
                  className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Sil"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quoted Paragraph / Manhwa Scene Box (Shown in Bottom Chapter Comments) */}
        {!isParagraphMode && !isReply && String(c.chapterId || '').includes('__p__') && (() => {
          const paraKey = String(c.chapterId || '').split('__p__')[1] || '';
          if (paraKey.startsWith('scene_')) {
            const parts = paraKey.split('_');
            const imgIdx = Math.max(0, parseInt(parts[1] || '0', 10) || 0);
            const yPct = Math.min(100, Math.max(0, parseInt(parts[2] || '50', 10) || 0));
            const sceneImgUrl = sceneImages && sceneImages[imgIdx] ? sceneImages[imgIdx] : '';

            return (
              <button
                type="button"
                onClick={() => onJumpToParagraph?.(paraKey)}
                className="relative z-10 group/quote rounded-2xl overflow-hidden border-2 border-purple-400/50 hover:border-amber-400 transition-all duration-200 shadow-xl cursor-pointer inline-block max-w-fit"
                title="Bölümdeki bu sahneye gitmek için tıklayın"
              >
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 aspect-square bg-black">
                  {sceneImgUrl ? (
                    <img
                      src={sceneImgUrl}
                      alt={`${imgIdx + 1}. Şerit Sahnesi`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/quote:scale-105 transition-transform duration-300 select-none"
                      style={{ objectPosition: `50% ${yPct}%` }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                      Görsel Yok
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2.5 py-2 flex items-center justify-between text-xs">
                    <span className="font-black text-amber-300 drop-shadow flex items-center gap-1 text-[11px] sm:text-xs">
                      📸 {imgIdx + 1}. Şerit (%{yPct})
                    </span>
                    <span className="font-extrabold text-white text-[10px] sm:text-[11px] bg-purple-600 hover:bg-purple-500 px-2.5 py-0.5 rounded-lg border border-white/25 shadow-sm flex items-center gap-1 transition">
                      Git ↑
                    </span>
                  </div>
                </div>
              </button>
            );
          }

          const paraInfo = paraKey && paragraphLookup ? paragraphLookup[paraKey] : undefined;
          return (
            <button
              type="button"
              onClick={() => paraKey && onJumpToParagraph?.(paraKey)}
              className="relative z-10 w-fit max-w-full sm:max-w-xl text-left group/quote rounded-xl bg-purple-950/65 hover:bg-purple-900/75 border border-purple-400/35 hover:border-amber-400/60 px-3.5 py-2.5 transition-all duration-200 flex items-start gap-2.5 shadow-inner cursor-pointer"
              title="Bu cümlenin metindeki yerine gitmek için tıklayın"
            >
              <Quote
                size={15}
                className="text-amber-300 shrink-0 mt-0.5 opacity-90 group-hover/quote:scale-110 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <span>
                      {paraInfo ? `${paraInfo.index}. Paragraf Alıntısı` : 'Alıntılanan Paragraf'}
                    </span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-200 group-hover/quote:text-amber-200 flex items-center gap-1 shrink-0">
                    <span>Cümleye Git ↑</span>
                  </span>
                </div>
                {paraInfo?.text ? (
                  <p className="text-xs text-purple-100/95 italic line-clamp-2 leading-relaxed">
                    “{paraInfo.text}”
                  </p>
                ) : (
                  <p className="text-xs text-purple-200/75 italic">
                    Bölüm içindeki bir paragrafa yapılan satır içi yorum
                  </p>
                )}
              </div>
            </button>
          );
        })()}

        {/* Comment Text OR Inline Editing Box */}
        {editingCommentId === c.id ? (
          <div className="relative z-10 p-3.5 bg-black/90 border border-purple-500/50 rounded-2xl space-y-3 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span className="flex items-center gap-1.5">
                <Edit3 size={14} className="text-fuchsia-400" /> Yorumu Düzenle
              </span>
              <button
                type="button"
                onClick={() => setEditingCommentId(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <textarea
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              rows={3}
              className="w-full bg-gray-900/90 border border-purple-500/30 focus:border-fuchsia-400 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none transition resize-none placeholder:text-gray-500"
              placeholder="Yorumunuzu güncelleyin..."
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingIsSpoiler}
                  onChange={e => setEditingIsSpoiler(e.target.checked)}
                  className="rounded border-purple-500/40 text-purple-600 focus:ring-purple-500"
                />
                <span>Spoiler İçerik</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCommentId(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingText.trim()) return;
                    editComment(c.id, editingText.trim(), editingIsSpoiler, editingImageUrl.trim());
                    setEditingCommentId(null);
                    showToast?.({
                      title: 'Yorum Güncellendi ✨',
                      message: 'Değişiklikleriniz kaydedildi.',
                      type: 'success'
                    });
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} /> Kaydet
                </button>
              </div>
            </div>
          </div>
        ) : (
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
        )}

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
                if (replyTo?.id === c.id) {
                  setReplyTo(null);
                  setShowReplyEmojiPicker(false);
                } else {
                  setReplyTo({ id: c.id, name: c.userName });
                  setReplyText('');
                  setReplyIsSpoiler(false);
                  setReplyImageUrl('');
                  setShowReplyEmojiPicker(false);
                }
              }}
              className={`flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                replyTo?.id === c.id
                  ? 'bg-purple-600/30 text-amber-300 border border-amber-400/50'
                  : 'text-gray-400 hover:text-purple-300 hover:bg-white/5'
              }`}
            >
              <CornerDownRight size={14} />
              <span>{replyTo?.id === c.id ? 'Yanıtı Kapat' : 'Yanıtla'}</span>
            </button>
          </div>
        </div>

        {/* INLINE REPLY BOX (Opens directly under the comment being replied to) */}
        {replyTo?.id === c.id && (
          <form
            onSubmit={handleReplySubmit}
            className="relative z-20 mt-3 pt-3 border-t border-purple-500/40 bg-gray-950/95 p-3.5 rounded-2xl border space-y-3 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-purple-200">
              <span className="flex items-center gap-1.5 font-bold">
                <CornerDownRight size={14} className="text-amber-400 shrink-0" />
                <span>
                  <strong className="text-amber-300">@{c.userName}</strong> kişisine yanıt yazıyorsunuz
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setShowReplyEmojiPicker(false);
                }}
                className="text-xs font-bold text-gray-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                İptal ✕
              </button>
            </div>

            <textarea
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`@${c.userName} kişisine yanıtınızı yazın...`}
              rows={3}
              className="w-full bg-gray-900 border border-purple-500/40 text-white placeholder-gray-500 text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none shadow-inner"
            />

            {/* Quick Tag Bar & Chibi Emoji Picker Toggle for Reply */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full">
                <span className="text-[11px] text-gray-400 font-medium mr-1 shrink-0">Hızlı İfade:</span>
                {['Katılıyorum!', 'Kesinlikle', 'Teşekkürler', 'Çok Doğru', '😂'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setReplyText(prev => (prev ? prev + ' ' + tag : tag))}
                    className="bg-gray-800/90 hover:bg-purple-900/60 border border-purple-500/20 text-[11px] px-2 py-0.5 rounded-lg text-purple-200 transition font-medium whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap shrink-0 w-full sm:w-auto cursor-pointer ${
                  showReplyEmojiPicker
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-purple-950/90 text-purple-300 border border-purple-700 hover:bg-purple-900'
                }`}
              >
                <Smile size={14} /> Chibi Emojiler {showReplyEmojiPicker ? '▲' : '▼'}
              </button>
            </div>

            {showReplyEmojiPicker && renderEmojiPickerDrawer('reply')}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 font-medium">
                  <input
                    type="checkbox"
                    checked={replyIsSpoiler}
                    onChange={e => setReplyIsSpoiler(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-900 border-gray-700"
                  />
                  <span>Spoiler içeriyor</span>
                </label>

                <input
                  type="text"
                  placeholder="Görsel URL ekle (opsiyonel)"
                  value={replyImageUrl}
                  onChange={e => setReplyImageUrl(e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-white text-xs rounded-xl px-2.5 py-1.5 w-44 sm:w-52 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setShowReplyEmojiPicker(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send size={13} />
                  Yanıtı Gönder
                </button>
              </div>
            </div>
          </form>
        )}
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
    <div
      className={
        isParagraphMode
          ? 'space-y-4'
          : 'bg-gray-900/95 border border-purple-500/20 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6'
      }
    >
      {/* 5-Emoji Reaction Bar (Chapter vs Series - Hidden in Paragraph Drawer Mode) */}
      {!isParagraphMode && (
        <div className="bg-gradient-to-br from-purple-950/60 via-gray-950/90 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles size={17} className="text-amber-400" />
              {chapterId ? 'Sizce bu bölüm nasıldı?' : 'Sizce bu seri nasıl?'}
            </h4>
            <p className="text-[11px] text-purple-300/80 mt-0.5">
              {chapterId
                ? 'Bölüm hakkındaki hislerinizi tek tıkla tepki bırakarak paylaşın!'
                : 'Bu seri hakkındaki genel düşüncenizi tepki bırakarak gösterin!'}
            </p>
          </div>
          <span className="text-[11px] font-bold text-purple-200 bg-purple-900/50 border border-purple-500/30 px-3 py-1 rounded-full self-start sm:self-auto">
            Toplam {totalReactionVotes} Tepki
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {REACTION_OPTIONS.map((item, idx) => {
            const count = Number(currentReactions[item.id]) || 0;
            const isSelected = selectedReactionId === item.id;
            const percent = totalReactionVotes > 0 ? Math.round((count / totalReactionVotes) * 100) : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleReaction(item.id)}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                  idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isSelected
                    ? 'bg-purple-600/30 border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.3)] scale-[1.03]'
                    : 'bg-gray-900/80 hover:bg-purple-900/40 border-purple-500/20 hover:border-purple-400/50 hover:scale-[1.02]'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1 transform group-hover:scale-125 transition-transform duration-200">
                  {item.emoji}
                </span>
                <span className={`text-[11px] sm:text-xs font-extrabold tracking-tight text-center leading-tight ${
                  isSelected ? 'text-amber-300' : 'text-gray-100'
                }`}>
                  {item.label}
                </span>
                <span className="text-[9px] text-purple-300/75 font-medium text-center leading-tight mt-0.5">
                  {item.sub}
                </span>
                <div className="flex items-center gap-1 mt-1.5 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                  <span className={`text-[11px] font-black ${isSelected ? 'text-amber-300' : 'text-purple-200'}`}>
                    {count}
                  </span>
                  {totalReactionVotes > 0 && (
                    <span className="text-[9px] text-gray-400 font-semibold">
                      ({percent}%)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      )}

      {/* Title & Auth Header (Compact in Paragraph Mode) */}
      {!isParagraphMode && (
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
      )}

      {/* Rules Notice */}
      {!isParagraphMode && (
        <div className="bg-purple-950/40 border border-purple-500/20 rounded-2xl p-4 text-xs text-purple-200 space-y-1">
          <span className="font-bold text-amber-300 block uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-amber-400" /> YORUM KURALLARIMIZ
          </span>
          <p>• Spoiler içeren yorumlarda mutlaka "Spoiler" kutucuğunu işaretleyiniz.</p>
          <p>• Saygılı ve nazik bir üslup kullanınız; hakaret ve küfür yasaktır.</p>
        </div>
      )}

      {/* Comment Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
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
          {showEmojiPicker && renderEmojiPickerDrawer('main')}
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

      {/* Comment Report Modal */}
      {reportingComment && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isSubmittingReport && setReportingComment(null)}
        >
          <div
            className="bg-gray-900 border border-red-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                  <AlertOctagon size={18} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">Yorumu Bildir</h4>
                  <p className="text-[11px] text-gray-400">Bildirim doğrudan yönetici ekibine iletilir</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportingComment(null)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-gray-800"
              >
                Kapat
              </button>
            </div>

            {/* Preview of Which Comment is Being Reported */}
            <div className="bg-gray-950/90 border-l-4 border-red-500 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-bold text-purple-300">@{reportingComment.userName}</span>
                <span>{formatTimeAgo(reportingComment.date)}</span>
              </div>
              <p className="text-xs text-gray-200 line-clamp-3 break-words whitespace-pre-wrap">
                {reportingComment.text}
              </p>
            </div>

            <form onSubmit={handleConfirmReport} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">
                  Bildirim Nedeni
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                >
                  <option value="Küfür / Hakaret / Zorbalık">Küfür / Hakaret / Zorbalık</option>
                  <option value="İşaretlenmemiş Spoiler">İşaretlenmemiş Spoiler</option>
                  <option value="Spam / Reklam / Link">Spam / Reklam / Link</option>
                  <option value="Uygunsuz / Rahatsız Edici İçerik">Uygunsuz / Rahatsız Edici İçerik</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-300 mb-1.5">
                  Ek Açıklama <span className="text-gray-500 font-normal">(İsteğe bağlı)</span>
                </label>
                <textarea
                  rows={2}
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  placeholder="Eklemek istediğiniz bir not varsa yazabilirsiniz..."
                  className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingComment(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition"
                >
                  <Send size={13} />
                  {isSubmittingReport ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
