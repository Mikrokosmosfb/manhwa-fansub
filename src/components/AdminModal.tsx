import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { downloadProjectZip } from '../utils/exportZip';
import { extractImageUrls } from '../utils/imageParser';
import { Series, SeriesType, SeriesStatus, Chapter } from '../types';
import { GENRE_LIST } from '../data/mockData';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  Download,
  FileCode,
  Check,
  UploadCloud,
  Zap,
  BarChart3,
  TrendingUp,
  Bookmark,
  MessageSquare,
  Award,
  Layers,
  FileArchive,
  Lock,
  Unlock,
  Key,
  LogOut,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Flame,
  Calendar,
  Megaphone,
  Globe,
  FileText,
  CheckCircle2,
  Sparkles,
  Database,
  Server,
  ShoppingBag,
  Palette,
  Edit3,
  Image as ImageIcon,
  PlusCircle,
  Sliders,
  X as CloseIcon,
  RotateCcw
} from 'lucide-react';
import { downloadCloudflareD1Sql } from '../utils/cloudflareD1Export';
import { ThemeBackgroundEffects } from './ThemeBackgroundEffects';
import { ShopItem, ThemeStyle } from '../data/shopData';

export const AdminModal: React.FC = () => {
  const {
    seriesList,
    addOrUpdateSeries,
    addBatchSeries,
    deleteSeries,
    setView,
    exportBackupData,
    readingHistory,
    bookmarks,
    comments,
    isAdminLoggedIn,
    verifyAdminPassword,
    changeAdminPassword,
    logoutAdmin,
    shopItems,
    themeStyles,
    updateShopItem,
    updateThemeStyle,
    addShopItemAndStyle,
    deleteShopItemAndStyle,
    resetShopToDefault
  } = useApp();

  const [activeTab, setActiveTab] = useState<'add-series' | 'add-chapter' | 'manage-series' | 'blogger-import' | 'cloudflare-d1' | 'shop-management'>('add-series');
  
  // Blogger Import State
  interface BloggerParsedPost {
    id: string;
    title: string;
    contentHtml: string;
    extractedImages: string[];
    publishedDate: string;
    tags: string[];
    selected: boolean;
    chapterNumber: number;
  }

  interface AutoDetectedBloggerSeries {
    id: string;
    seriesName: string;
    slug: string;
    type: SeriesType;
    coverImage: string;
    synopsis: string;
    projectPost?: BloggerParsedPost;
    chapterPosts: BloggerParsedPost[];
    selected: boolean;
  }

  const [bloggerRawXml, setBloggerRawXml] = useState('');
  const [bloggerParsedPosts, setBloggerParsedPosts] = useState<BloggerParsedPost[]>([]);
  const [autoDetectedSeries, setAutoDetectedSeries] = useState<AutoDetectedBloggerSeries[]>([]);
  const [bloggerTargetSeriesId, setBloggerTargetSeriesId] = useState<string>('');
  const [bloggerImportMode, setBloggerImportMode] = useState<'auto-smart' | 'existing-series' | 'new-series'>('auto-smart');
  const [bloggerNewSeriesTitle, setBloggerNewSeriesTitle] = useState('Blogger Aktarılan Seri');
  const [bloggerNewSeriesType, setBloggerNewSeriesType] = useState<SeriesType>('Manhwa');
  const [bloggerStatusMessage, setBloggerStatusMessage] = useState('');
  const [isParsingBlogger, setIsParsingBlogger] = useState(false);

  // Cloudflare D1 Live Inspection State
  const [d1StatusInfo, setD1StatusInfo] = useState<{
    dbConnected?: boolean;
    totalSeriesInD1?: number;
    series?: { id: string; title: string; type: string; chapterCount: number }[];
    message?: string;
  } | null>(null);
  const [isCheckingD1, setIsCheckingD1] = useState(false);

  const handleCheckD1Status = async () => {
    setIsCheckingD1(true);
    try {
      const res = await fetch('/api/d1-status');
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { dbConnected: false, message: `Sunucu geçersiz yanıt döndürdü (HTTP ${res.status})` };
      }
      setD1StatusInfo(data);
    } catch (e: any) {
      setD1StatusInfo({ dbConnected: false, message: 'Ağ hatası: ' + e.message });
    } finally {
      setIsCheckingD1(false);
    }
  };

  // Shop & Theme Management Admin State
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopCategoryFilter, setShopCategoryFilter] = useState<'all' | 'theme_photo' | 'theme_aura' | 'badge' | 'emoji_pack'>('all');
  const [editingShopItem, setEditingShopItem] = useState<ShopItem | null>(null);
  const [editingThemeStyle, setEditingThemeStyle] = useState<ThemeStyle | null>(null);
  const [showShopEditModal, setShowShopEditModal] = useState(false);
  const [shopAdminMessage, setShopAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const PRESET_BG_IMAGES = [
    {
      name: 'Crimson Moon Romance',
      url: '/src/assets/images/crimson_moon_romance_1786110942949.jpg'
    },
    {
      name: 'Sakura Cascade & Night Sky',
      url: 'https://images.unsplash.com/photo-1528164344705-475426879e0d?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Gece Sarayı & Fenerler',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Gök ve Ay Bahçesi',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Mor Ay Kelebekleri',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Kozmik Galaksi Nebula',
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Cyberpunk Gece Şehri',
      url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const handleOpenShopEdit = (item: ShopItem) => {
    setEditingShopItem({ ...item });
    if (item.category === 'theme' && themeStyles[item.id]) {
      setEditingThemeStyle({ ...themeStyles[item.id] });
    } else if (item.category === 'theme') {
      setEditingThemeStyle({
        id: item.id,
        name: item.name,
        cardClass: 'bg-gray-900 border border-purple-500/30',
        avatarBorderClass: 'ring-2 ring-purple-500',
        nameClass: 'text-purple-300 font-bold',
        badgeBgClass: 'bg-purple-600 text-white font-bold',
        glowColor: '#a855f7',
        accentText: 'text-purple-300',
        cardBgImageUrl: '',
        effectOverlay: 'saturn',
        themeType: item.themeType || 'aura'
      });
    } else {
      setEditingThemeStyle(null);
    }
    setShowShopEditModal(true);
  };

  const handleSaveShopEdit = () => {
    if (!editingShopItem) return;
    
    updateShopItem(editingShopItem.id, editingShopItem);

    if (editingShopItem.category === 'theme' && editingThemeStyle) {
      updateThemeStyle(editingShopItem.id, {
        ...editingThemeStyle,
        name: editingShopItem.name,
        themeType: editingShopItem.themeType
      });
    }

    setShopAdminMessage({ type: 'success', text: `"${editingShopItem.name}" başarıyla güncellendi!` });
    setShowShopEditModal(false);
    setTimeout(() => setShopAdminMessage(null), 4000);
  };

  const handleCreateNewTheme = () => {
    const newId = `theme_custom_${Date.now()}`;
    const newItem: ShopItem = {
      id: newId,
      name: 'Yeni Yönetici Teması',
      category: 'theme',
      themeType: 'photo',
      price: 300,
      description: 'Yönetici tarafından eklenen özel tema.',
      icon: '🖼️',
      rarity: 'Efsanevi'
    };
    const newStyle: ThemeStyle = {
      id: newId,
      name: 'Yeni Yönetici Teması',
      cardClass: 'bg-gray-900/90 border-2 border-amber-400/80 shadow-lg',
      avatarBorderClass: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black',
      nameClass: 'text-amber-300 font-black',
      badgeBgClass: 'bg-amber-500 text-black font-bold',
      glowColor: '#fbbf24',
      accentText: 'text-amber-300',
      cardBgImageUrl: 'https://images.unsplash.com/photo-1528164344705-475426879e0d?w=800&auto=format&fit=crop&q=80',
      effectOverlay: 'sakura_cascade',
      themeType: 'photo'
    };
    addShopItemAndStyle(newItem, newStyle);
    handleOpenShopEdit(newItem);
  };

  // Helper to build auto-detected series from Blogger tags using 2-pass tag matching
  const buildAutoDetectedSeries = (posts: BloggerParsedPost[]): AutoDetectedBloggerSeries[] => {
    const STRUCTURAL_SYSTEM_TAGS = [
      'chapter', 'chapter2', 'project', 'proje', 'series', 'seri', 'seriler',
      'guncel', 'güncel', 'featured', 'genişletilmiş', 'post', 'kind#post'
    ];

    const isSystemTag = (tag: string): boolean => {
      const lt = tag.toLowerCase().trim();
      if (STRUCTURAL_SYSTEM_TAGS.includes(lt)) return true;
      if (lt.includes('schemas.google.com') || lt.includes('kind#post')) return true;
      return false;
    };

    const determineTypeFromTags = (tags: string[], defaultFallback: SeriesType = 'Manhwa'): SeriesType => {
      const lowerTags = tags.map(t => t.toLowerCase().trim());
      if (lowerTags.includes('manga')) return 'Manga';
      if (lowerTags.includes('manhua')) return 'Manhua';
      if (lowerTags.includes('webtoon')) return 'Webtoon';
      if (lowerTags.includes('novel') || lowerTags.includes('web novel') || lowerTags.includes('chapter2')) return 'Web Novel';
      if (lowerTags.includes('manhwa')) return 'Manhwa';
      return defaultFallback;
    };

    // 1. Aşama: Series veya Seriler etiketine sahip tanıtım / ana seri gönderilerini tespit et
    const seriesIntroPosts: BloggerParsedPost[] = [];
    const chapterPosts: BloggerParsedPost[] = [];

    posts.forEach(post => {
      const lowerTags = post.tags.map(t => t.toLowerCase().trim());
      const isSeriesIntro = lowerTags.includes('series') || lowerTags.includes('seriler');
      const isChapter = lowerTags.includes('chapter') || lowerTags.includes('chapter2');

      if (isSeriesIntro && !isChapter) {
        seriesIntroPosts.push(post);
      } else {
        chapterPosts.push(post);
      }
    });

    interface SeriesGroup {
      id: string;
      seriesName: string;
      type: SeriesType;
      projectPost?: BloggerParsedPost;
      chapterPosts: BloggerParsedPost[];
      seriesIntroTags: string[];
    }

    const seriesIntroGroups: SeriesGroup[] = [];

    // 1. Aşama Bitiş: Seri sayfalarını kaydet
    seriesIntroPosts.forEach((post, idx) => {
      const nonSystemTags = post.tags.filter(t => !isSystemTag(t));
      const nonSystemLowerTags = nonSystemTags.map(t => t.toLowerCase().trim());

      // Seri adını Gönderi Başlığından temizle (örn: "Borderline - Tanıtım" -> "Borderline")
      let cleanTitle = post.title
        .replace(/(?:tanıtım|series|seriler|proje|project|\(.*?\))/gi, '')
        .replace(/[-–—:]+$/, '')
        .trim();

      let seriesName = cleanTitle;
      if (!seriesName) {
        seriesName = nonSystemTags.length > 0 ? nonSystemTags[0].trim() : 'Adsız Seri';
      }

      seriesIntroGroups.push({
        id: `intro-${idx}-${post.id}`,
        seriesName,
        type: determineTypeFromTags(post.tags, 'Manhwa'),
        projectPost: post,
        chapterPosts: [],
        seriesIntroTags: nonSystemLowerTags
      });
    });

    // 2 & 3. Aşama: Chapter / Chapter2 etiketli gönderileri tara ve sistem etiketlerini ele
    const standaloneSeriesMap: Record<string, SeriesGroup> = {};

    chapterPosts.forEach(post => {
      // Chapter'daki sistem etiketlerini ele -> Geride kalan etiket(ler) serinin orijinal etiketi
      const chapterSeriesTags = post.tags
        .filter(t => !isSystemTag(t))
        .map(t => t.toLowerCase().trim());

      // 3. Aşama: O etiketi Seriler / Series sayfalarındaki etiketlerle eşleştir
      let matchedIntroGroup: SeriesGroup | null = null;

      for (const group of seriesIntroGroups) {
        const hasMatch = chapterSeriesTags.some(cTag => group.seriesIntroTags.includes(cTag));
        if (hasMatch) {
          matchedIntroGroup = group;
          break;
        }
      }

      if (matchedIntroGroup) {
        // Eşleşti! Bu serinin bölümüdür.
        matchedIntroGroup.chapterPosts.push(post);

        // Bölümdeki tür bilgisini güncelle (Manga, Manhua, Webtoon, Novel)
        const chapterType = determineTypeFromTags(post.tags, matchedIntroGroup.type);
        if (chapterType !== 'Manhwa' || matchedIntroGroup.type === 'Manhwa') {
          matchedIntroGroup.type = chapterType;
        }
      } else {
        // Seriler/Series tanıtım sayfası bulunamayan bölümler için tekil grup
        const customTags = post.tags.filter(t => !isSystemTag(t));
        let fallbackName = customTags.length > 0 ? customTags[0].trim() : '';

        if (!fallbackName) {
          const titleClean = post.title.replace(/(?:bölüm|chapter|ch\.?|#)\s*\d+.*/i, '').replace(/bölüm.*/i, '').trim();
          fallbackName = (titleClean && titleClean.length > 1) ? titleClean : 'Diğer Seriler';
        }

        const key = fallbackName.toLowerCase();
        if (!standaloneSeriesMap[key]) {
          standaloneSeriesMap[key] = {
            id: `standalone-${key}`,
            seriesName: fallbackName,
            type: determineTypeFromTags(post.tags, 'Manhwa'),
            chapterPosts: [],
            seriesIntroTags: customTags.map(t => t.toLowerCase().trim())
          };
        }

        standaloneSeriesMap[key].chapterPosts.push(post);
      }
    });

    // Tüm grupları birleştir
    const allGroups = [...seriesIntroGroups, ...Object.values(standaloneSeriesMap)];

    // Çıktı formatına dönüştür
    return allGroups
      .filter(g => g.projectPost || g.chapterPosts.length > 0)
      .map((item, idx) => {
        const sortedChapters = [...item.chapterPosts].sort((a, b) => a.chapterNumber - b.chapterNumber);

        let cover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
        if (item.projectPost && item.projectPost.extractedImages.length > 0) {
          cover = item.projectPost.extractedImages[0];
        } else {
          const postWithImage = sortedChapters.find(c => c.extractedImages.length > 0);
          if (postWithImage && postWithImage.extractedImages.length > 0) {
            cover = postWithImage.extractedImages[0];
          }
        }

        let synopsis = `${item.seriesName} serisine ait bölümler. Blogger aktarımı ile otomatik eklenmiştir.`;
        if (item.projectPost) {
          const cleanText = item.projectPost.contentHtml
            .replace(/<img[^>]*>/gi, '')
            .replace(/<[^>]+>/g, '\n')
            .replace(/\n+/g, ' ')
            .trim();
          if (cleanText.length > 20) {
            synopsis = cleanText.slice(0, 350) + (cleanText.length > 350 ? '...' : '');
          }
        }

        let finalSeriesName = item.seriesName;
        if (!finalSeriesName || finalSeriesName.length < 2) {
          if (item.projectPost) {
            finalSeriesName = item.projectPost.title
              .replace(/(?:tanıtım|series|seriler|proje|project|\(.*?\))/gi, '')
              .trim() || item.projectPost.title;
          } else {
            finalSeriesName = 'Diğer Seriler';
          }
        }

        const slug = finalSeriesName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `s-blogger-${Date.now()}-${idx}`;

        return {
          id: `s-auto-${slug}`,
          seriesName: finalSeriesName,
          slug,
          type: item.type,
          coverImage: cover,
          synopsis,
          projectPost: item.projectPost,
          chapterPosts: sortedChapters,
          selected: true
        };
      });
  };

  // Parse Blogger XML / RSS / JSON
  const handleParseBloggerContent = (content: string) => {
    if (!content.trim()) return;
    setIsParsingBlogger(true);
    setBloggerStatusMessage('');

    try {
      const parsedPosts: BloggerParsedPost[] = [];
      const trimmed = content.trim();

      // JSON feed parsing
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const jsonObj = JSON.parse(trimmed);
          const entries = jsonObj.feed?.entry || jsonObj.items || (Array.isArray(jsonObj) ? jsonObj : []);
          entries.forEach((item: any, idx: number) => {
            const itemTitle = item.title?.$t || item.title || `Gönderi ${idx + 1}`;
            const itemContent = item.content?.$t || item.content || item.summary?.$t || '';
            const itemDate = (item.published?.$t || item.published || new Date().toISOString()).slice(0, 10);
            const imgs = extractImageUrls(itemContent);
            const tags = (item.category || []).map((c: any) => c.term || c.label || '').filter(Boolean);
            const numMatch = itemTitle.match(/(?:bölüm|chapter|ch\.?|#)\s*(\d+)/i) || itemTitle.match(/(\d+)\.?\s*bölüm/i) || itemTitle.match(/\b(\d+)\b/);
            const chapterNum = numMatch ? parseInt(numMatch[1], 10) : idx + 1;

            parsedPosts.push({
              id: `blogger-json-${Date.now()}-${idx}`,
              title: itemTitle,
              contentHtml: itemContent,
              extractedImages: imgs,
              publishedDate: itemDate,
              tags,
              selected: true,
              chapterNumber: chapterNum
            });
          });
        } catch (e) {
          console.error('JSON parse error:', e);
        }
      }

      // XML / Atom / RSS feed parsing
      if (parsedPosts.length === 0) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        let entries = Array.from(xmlDoc.getElementsByTagName('entry'));
        if (entries.length === 0) {
          entries = Array.from(xmlDoc.getElementsByTagNameNS('*', 'entry'));
        }
        if (entries.length === 0) {
          entries = Array.from(xmlDoc.getElementsByTagName('item'));
        }

        entries.forEach((entry, idx) => {
          const titleEl = entry.getElementsByTagName('title')[0];
          const contentEl = entry.getElementsByTagName('content')[0] || entry.getElementsByTagName('description')[0] || entry.getElementsByTagName('summary')[0];
          const publishedEl = entry.getElementsByTagName('published')[0] || entry.getElementsByTagName('pubDate')[0] || entry.getElementsByTagName('updated')[0];
          
          const rawTitle = titleEl?.textContent || (titleEl as any)?.text || `Gönderi ${idx + 1}`;
          const rawContent = contentEl?.textContent || (contentEl as any)?.text || '';
          const publishedRaw = publishedEl?.textContent || new Date().toISOString().slice(0, 10);
          const publishedDate = publishedRaw ? publishedRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);

          if (!rawTitle.trim() || rawTitle.includes('Settings')) return;

          const imgs = extractImageUrls(rawContent);
          const categories = Array.from(entry.getElementsByTagName('category'));
          const tags = categories
            .map(c => c.getAttribute('term') || c.getAttribute('label') || c.textContent || '')
            .filter(t => t && !t.includes('schemas.google.com') && !t.includes('kind#post'));

          const numMatch = rawTitle.match(/(?:bölüm|chapter|ch\.?|#)\s*(\d+)/i) || rawTitle.match(/(\d+)\.?\s*bölüm/i) || rawTitle.match(/\b(\d+)\b/);
          const chapterNum = numMatch ? parseInt(numMatch[1], 10) : idx + 1;

          parsedPosts.push({
            id: `blogger-xml-${Date.now()}-${idx}`,
            title: rawTitle.trim(),
            contentHtml: rawContent,
            extractedImages: imgs,
            publishedDate,
            tags,
            selected: true,
            chapterNumber: chapterNum
          });
        });
      }

      if (parsedPosts.length === 0) {
        setBloggerStatusMessage('Geçerli Blogger gönderisi bulunamadı. Lütfen Blogger .xml dosyasını veya feed içeriğini kontrol edin.');
        setAutoDetectedSeries([]);
      } else {
        setBloggerParsedPosts(parsedPosts);
        const autoSeries = buildAutoDetectedSeries(parsedPosts);
        setAutoDetectedSeries(autoSeries);
        setBloggerStatusMessage(`Başarılı! Toplam ${parsedPosts.length} gönderi içinden ${autoSeries.length} farklı seri ve bölümleri etiketlerine göre otomatik eşleştirildi.`);
      }
    } catch (err) {
      console.error(err);
      setBloggerStatusMessage('Dosya veya metin okunurken bir hata oluştu.');
    } finally {
      setIsParsingBlogger(false);
    }
  };

  const handleBloggerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (text) {
        setBloggerRawXml(text);
        handleParseBloggerContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBloggerImport = async () => {
    if (bloggerImportMode === 'auto-smart') {
      const selectedSeries = autoDetectedSeries.filter(s => s.selected);
      if (selectedSeries.length === 0) {
        alert('Lütfen aktarılacak en az bir seri seçin.');
        return;
      }

      let createdSeriesCount = 0;
      let totalImportedChapters = 0;
      const batchToSave: Series[] = [];

      selectedSeries.forEach((detSeries, sIdx) => {
        const existing = seriesList.find(s =>
          s.title.toLowerCase().trim() === detSeries.seriesName.toLowerCase().trim() ||
          s.slug === detSeries.slug
        );

        const newChapters: Chapter[] = detSeries.chapterPosts.map((post, cIdx) => {
          const cleanContent = post.contentHtml
            .replace(/<img[^>]*>/gi, '')
            .replace(/<[^>]+>/g, '\n')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

          return {
            id: `c-blogger-${Date.now()}-${sIdx}-${cIdx}`,
            number: post.chapterNumber || (cIdx + 1),
            title: post.title,
            publishedDate: post.publishedDate,
            createdAt: Date.now() - (detSeries.chapterPosts.length - cIdx) * 1000,
            isNew: true,
            images: post.extractedImages.length > 0 ? post.extractedImages : undefined,
            content: cleanContent.length > 30 ? cleanContent : undefined,
            notice: post.tags.length > 0 ? `Blogger Etiketleri: ${post.tags.join(', ')}` : undefined
          };
        });

        let targetSeriesToSave: Series;

        if (existing) {
          const existingChapterNumbers = new Set(existing.chapters.map(c => c.number));
          const filteredNewChapters = newChapters.filter(c => !existingChapterNumbers.has(c.number));

          targetSeriesToSave = {
            ...existing,
            chapters: [...existing.chapters, ...filteredNewChapters],
            updatedAt: new Date().toISOString().slice(0, 10)
          };
          totalImportedChapters += filteredNewChapters.length;
        } else {
          targetSeriesToSave = {
            id: `s-blogger-${Date.now()}-${sIdx}`,
            slug: detSeries.slug,
            title: detSeries.seriesName,
            type: detSeries.type,
            status: 'Devam Ediyor',
            coverImage: detSeries.coverImage,
            rating: 9.5,
            synopsis: detSeries.synopsis,
            author: 'Blogger',
            artist: 'Blogger',
            releaseYear: new Date().getFullYear().toString(),
            translator: 'Mikrokosmos Fansub',
            genres: detSeries.type === 'Web Novel' ? ['Web Novel', 'Fantastik', 'Aksiyon'] : ['Aksiyon', 'Fantastik', 'Macera'],
            releaseDay: 'Düzensiz',
            isGuncel: true,
            updatedAt: new Date().toISOString().slice(0, 10),
            chapters: newChapters
          };
          createdSeriesCount++;
          totalImportedChapters += newChapters.length;
        }

        batchToSave.push(targetSeriesToSave);
      });

      setBloggerStatusMessage('Cloudflare D1 veritabanına yazılıyor...');
      const res = await addBatchSeries(batchToSave);

      if (res && res.success) {
        alert(`🎉 Mükemmel! Toplam ${selectedSeries.length} seri (${createdSeriesCount} yeni seri, ${totalImportedChapters} bölüm) Cloudflare D1 veritabanınıza başarıyla aktarıldı!`);
      } else {
        alert(`⚠️ Seriler yerel tarayıcı hafızasına eklendi, ancak Cloudflare D1 yanıtı: ${res?.message || res?.error || 'D1 Sunucusu yanıt vermedi'}`);
      }

      setBloggerParsedPosts([]);
      setAutoDetectedSeries([]);
      setBloggerRawXml('');
      setBloggerStatusMessage('');
      setActiveTab('manage-series');
      return;
    }

    // Manual mode (existing or single new series)
    const selectedPosts = bloggerParsedPosts.filter(p => p.selected);
    if (selectedPosts.length === 0) {
      alert('Lütfen aktarılacak en az bir gönderi seçin.');
      return;
    }

    let targetSeries: Series | undefined;

    if (bloggerImportMode === 'existing-series') {
      targetSeries = seriesList.find(s => s.id === bloggerTargetSeriesId);
      if (!targetSeries) {
        alert('Lütfen bölümlerin ekleneceği hedef seriyi seçin.');
        return;
      }
    } else {
      const newSeriesId = `s-blogger-${Date.now()}`;
      const seriesTitleStr = bloggerNewSeriesTitle.trim() || 'Blogger Aktarılan Seri';
      targetSeries = {
        id: newSeriesId,
        slug: seriesTitleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'blogger-seri',
        title: seriesTitleStr,
        type: bloggerNewSeriesType,
        status: 'Devam Ediyor',
        coverImage: selectedPosts.find(p => p.extractedImages.length > 0)?.extractedImages[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        rating: 9.5,
        synopsis: 'Blogger aktarımı ile oluşturulmuş seridir.',
        author: 'Blogger',
        artist: 'Blogger',
        releaseYear: new Date().getFullYear().toString(),
        translator: 'Mikrokosmos Fansub',
        genres: ['Aksiyon', 'Fantastik'],
        releaseDay: 'Düzensiz',
        isGuncel: true,
        updatedAt: new Date().toISOString().slice(0, 10),
        chapters: []
      };
    }

    const newChapters: Chapter[] = selectedPosts.map((post, index) => {
      const cleanContent = post.contentHtml
        .replace(/<img[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      return {
        id: `c-blogger-${Date.now()}-${index}`,
        number: post.chapterNumber || (targetSeries!.chapters.length + index + 1),
        title: post.title,
        publishedDate: post.publishedDate,
        createdAt: Date.now() - (selectedPosts.length - index) * 1000,
        isNew: true,
        images: post.extractedImages.length > 0 ? post.extractedImages : undefined,
        content: cleanContent.length > 30 ? cleanContent : undefined,
        notice: post.tags.length > 0 ? `Blogger Etiketleri: ${post.tags.join(', ')}` : undefined
      };
    });

    const updatedSeries: Series = {
      ...targetSeries,
      chapters: [...targetSeries.chapters, ...newChapters],
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    setBloggerStatusMessage('Cloudflare D1 veritabanına yazılıyor...');
    const res = await addOrUpdateSeries(updatedSeries);

    if (res && res.success) {
      alert(`Başarılı! "${targetSeries.title}" serisine ${newChapters.length} adet Blogger gönderisi/bölümü eklendi ve D1'e kaydedildi!`);
    } else {
      alert(`⚠️ Bölümler yerel hafızaya eklendi, ancak Cloudflare D1 yanıtı: ${res?.message || res?.error || 'D1 Sunucusu yanıt vermedi'}`);
    }

    setBloggerParsedPosts([]);
    setAutoDetectedSeries([]);
    setBloggerRawXml('');
    setBloggerStatusMessage('');
    setActiveTab('manage-series');
  };
  
  // Admin Login & Password Management State
  const [inputPassword, setInputPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassSuccess, setChangePassSuccess] = useState('');

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (!inputPassword.trim()) {
      setPassError('Lütfen yönetici şifrenizi girin.');
      return;
    }
    const success = verifyAdminPassword(inputPassword);
    if (!success) {
      setPassError('Hatalı yönetici şifresi! Lütfen tekrar deneyin.');
    } else {
      setInputPassword('');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassSuccess('');
    setPassError('');

    if (newPassInput.trim().length < 3) {
      setPassError('Yeni şifre en az 3 karakter olmalıdır.');
      return;
    }

    if (newPassInput.trim() !== confirmPassInput.trim()) {
      setPassError('Şifreler eşleşmiyor!');
      return;
    }

    changeAdminPassword(newPassInput.trim());
    setChangePassSuccess('Yönetici şifreniz başarıyla değiştirildi!');
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => {
      setIsChangePassOpen(false);
      setChangePassSuccess('');
    }, 2000);
  };
  
  // New Series Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SeriesType>('Manhwa');
  const [status, setStatus] = useState<SeriesStatus>('Devam Ediyor');
  const [coverImage, setCoverImage] = useState('');
  const [rating, setRating] = useState('9.5');
  const [synopsis, setSynopsis] = useState('');
  const [author, setAuthor] = useState('');
  const [artist, setArtist] = useState('');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [customBadgesInput, setCustomBadgesInput] = useState('');
  const [translator, setTranslator] = useState('Mikrokosmos Fansub');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Aksiyon', 'Fantastik']);
  const [releaseDay, setReleaseDay] = useState<Series['releaseDay']>('Pazartesi');
  const [releaseTime, setReleaseTime] = useState('18:00');
  const [notice, setNotice] = useState('');
  const [is18Plus, setIs18Plus] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isGuncel, setIsGuncel] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleZipDownload = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip();
    } catch (err) {
      console.error(err);
      alert('ZIP indirilirken bir hata oluştu.');
    } finally {
      setIsZipping(false);
    }
  };

  // New Chapter Form
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterSpecialTag, setChapterSpecialTag] = useState('');
  const [bulkSpecialTag, setBulkSpecialTag] = useState('');
  const [chapterImages, setChapterImages] = useState(''); // newline separated URLs
  const [chapterContent, setChapterContent] = useState(''); // for web novels
  const [chapterNotice, setChapterNotice] = useState('');

  // Drag & Drop image files
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Bulk Chapters Form
  const [bulkSeriesId, setBulkSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [bulkStartNum, setBulkStartNum] = useState<number>(1);
  const [bulkEndNum, setBulkEndNum] = useState<number>(10);
  const [bulkTitlePattern, setBulkTitlePattern] = useState<string>('Bölüm {n}');
  const [bulkNotice, setBulkNotice] = useState<string>('');
  const [bulkImages, setBulkImages] = useState<string>('');
  const [bulkContent, setBulkContent] = useState<string>('');

  // Editing Existing Series State
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [editingBadgesText, setEditingBadgesText] = useState('');

  // Chapter Management & Edit State
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [editingChapterSeriesId, setEditingChapterSeriesId] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingChapterImagesText, setEditingChapterImagesText] = useState('');
  const [editingChapterContentText, setEditingChapterContentText] = useState('');

  const PRESET_BADGES = ['Renkli', 'Sansürsüz', 'Popüler', 'Sezon Finali', 'HD', 'Yetişkin', 'Efsane', 'Yeni'];

  const handleAddBadgeToInput = (badge: string, isEditMode: boolean) => {
    if (isEditMode) {
      const current = editingBadgesText.trim();
      if (!current) {
        setEditingBadgesText(badge);
      } else if (!current.includes(badge)) {
        setEditingBadgesText(`${current}, ${badge}`);
      }
    } else {
      const current = customBadgesInput.trim();
      if (!current) {
        setCustomBadgesInput(badge);
      } else if (!current.includes(badge)) {
        setCustomBadgesInput(`${current}, ${badge}`);
      }
    }
  };

  // Drag & Drop Image Files Handler for Manhwa Chapters
  const handleProcessImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsUploadingFiles(true);
    const readUrls: string[] = [];
    let completedCount = 0;

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          readUrls.push(e.target.result as string);
        }
        completedCount++;
        if (completedCount === fileArray.length) {
          setIsUploadingFiles(false);
          setChapterImages(prev => {
            const existing = prev.trim();
            const newBlock = readUrls.join('\n');
            return existing ? `${existing}\n${newBlock}` : newBlock;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDropImages = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessImageFiles(e.dataTransfer.files);
    }
  };

  const handleSelectImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessImageFiles(e.target.files);
    }
  };

  const handleRemoveImageAt = (index: number) => {
    setChapterImages(prev => {
      const list = prev.split('\n').filter(Boolean);
      list.splice(index, 1);
      return list.join('\n');
    });
  };

  // Execute Bulk Chapter Generation
  const handleBulkCreateChapters = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSeries = seriesList.find(s => s.id === bulkSeriesId);
    if (!targetSeries) {
      alert('Lütfen geçerli bir seri seçin.');
      return;
    }

    if (bulkEndNum < bulkStartNum) {
      alert('Bitiş bölüm numarası başlangıç numarasından küçük olamaz.');
      return;
    }

    const createdChapters: Chapter[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const bulkExtracted = extractImageUrls(bulkImages);
    const parsedBulkImages = bulkExtracted.length > 0 ? bulkExtracted : undefined;
    const parsedBulkContent = bulkContent.trim() || undefined;

    for (let num = bulkStartNum; num <= bulkEndNum; num++) {
      const title = bulkTitlePattern.replace('{n}', num.toString());
      createdChapters.push({
        id: `c-${Date.now()}-${num}`,
        number: num,
        title,
        publishedDate: today,
        createdAt: Date.now() - (bulkEndNum - num) * 1000,
        isNew: true,
        images: parsedBulkImages,
        content: parsedBulkContent,
        notice: bulkNotice.trim() || undefined
      });
    }

    const updatedSeries: Series = {
      ...targetSeries,
      chapters: [...targetSeries.chapters, ...createdChapters],
      updatedAt: today
    };

    addOrUpdateSeries(updatedSeries);
    alert(`"${targetSeries.title}" serisine ${createdChapters.length} adet yeni bölüm toplu olarak eklendi!`);
    setBulkImages('');
    setBulkContent('');
    setActiveTab('manage-series');
  };

  const startEditingSeries = (s: Series) => {
    setEditingSeries(s);
    setEditingBadgesText(s.customBadges ? s.customBadges.join(', ') : '');
  };

  const startEditingChapter = (seriesId: string, chapter: Chapter) => {
    setEditingChapterSeriesId(seriesId);
    setEditingChapter({ ...chapter });
    setEditingChapterImagesText(chapter.images ? chapter.images.join('\n') : '');
    setEditingChapterContentText(chapter.content || '');
  };

  const handleSaveChapterEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapterSeriesId || !editingChapter) return;
    const targetSeries = seriesList.find(s => s.id === editingChapterSeriesId);
    if (!targetSeries) return;

    const extractedImages = extractImageUrls(editingChapterImagesText);
    const parsedImages = extractedImages.length > 0 ? extractedImages : undefined;

    const updatedChapter: Chapter = {
      ...editingChapter,
      images: parsedImages,
      content: editingChapterContentText.trim() || undefined
    };

    const updatedChapters = targetSeries.chapters.map(c =>
      c.id === editingChapter.id ? updatedChapter : c
    );

    addOrUpdateSeries({
      ...targetSeries,
      chapters: updatedChapters
    });

    alert(`"${updatedChapter.title}" (Bölüm ${updatedChapter.number}) başarıyla güncellendi!`);
    setEditingChapter(null);
    setEditingChapterSeriesId(null);
  };

  const handleDeleteChapter = (seriesId: string, chapterId: string, chapterNumber: number) => {
    const targetSeries = seriesList.find(s => s.id === seriesId);
    if (!targetSeries) return;

    if (confirm(`Bölüm ${chapterNumber} silinecektir. Emin misiniz?`)) {
      const updatedChapters = targetSeries.chapters.filter(c => c.id !== chapterId);
      addOrUpdateSeries({
        ...targetSeries,
        chapters: updatedChapters
      });
      alert(`Bölüm ${chapterNumber} silindi.`);
    }
  };

  const handleToggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
    );
  };

  const handleCopyMockDataCode = () => {
    const tsCode = `import { Series, Announcement } from '../types';\n\nexport const INITIAL_ANNOUNCEMENT: Announcement = {\n  id: 'ann-1',\n  title: 'Yeni Sezon Bölümleri Yüklendi!',\n  text: 'Tüm manhwa ve web novellerimiz haftalık güncellenmektedir. Keyifli okumalar dileriz!',\n  type: 'announcement',\n  active: true\n};\n\nexport const GENRE_LIST = [\n  'Aksiyon', 'Fantastik', 'Macera', 'Dram', 'Romantik', 'Komedisi', \n  'Reenkarnasyon', 'Sistem', 'İsekai', 'Büyü', 'Dövüş Sanatları', \n  'Gerilim', 'Gizem', 'Bilim Kurgu', 'Tarihi', 'Web Novel', 'Manhwa', '18+'\n];\n\nexport const INITIAL_SERIES: Series[] = ${JSON.stringify(seriesList, null, 2)};\n`;

    navigator.clipboard.writeText(tsCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    alert('Güncellenmiş "mockData.ts" kodu kopyalandı! Projenizdeki src/data/mockData.ts dosyasına yapıştırabilirsiniz.');
  };

  const handleCreateSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImage.trim()) {
      alert('Lütfen başlık ve kapak resmi URL\'sini doldurun.');
      return;
    }

    const parsedBadges = customBadgesInput
      .split(',')
      .map(b => b.trim())
      .filter(Boolean);

    const newSeries: Series = {
      id: 's-' + Date.now(),
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      coverImage: coverImage.trim(),
      type,
      status,
      rating: parseFloat(rating) || 9.0,
      synopsis: synopsis.trim() || 'Açıklama girilmedi.',
      author: author.trim() || 'Bilinmiyor',
      artist: artist.trim() || undefined,
      releaseYear: releaseYear.trim() || undefined,
      customBadges: parsedBadges.length > 0 ? parsedBadges : undefined,
      translator: translator.trim() || 'Mikrokosmos Fansub',
      genres: is18Plus && !selectedGenres.includes('18+') ? [...selectedGenres, '18+'] : selectedGenres,
      chapters: [],
      updatedAt: new Date().toISOString().slice(0, 10),
      releaseDay: releaseDay || undefined,
      releaseTime: releaseTime || undefined,
      notice: notice.trim() || undefined,
      isHot,
      isNew,
      isGuncel,
      is18Plus
    };

    addOrUpdateSeries(newSeries);
    alert(`"${newSeries.title}" serisi başarıyla eklendi!`);
    
    // Reset form
    setTitle('');
    setCoverImage('');
    setSynopsis('');
    setAuthor('');
    setArtist('');
    setReleaseYear('2024');
    setCustomBadgesInput('');
    setNotice('');
    setIs18Plus(false);
    setIsHot(false);
    setIsNew(false);
    setIsGuncel(true);
    setActiveTab('add-chapter');
    setSelectedSeriesId(newSeries.id);
  };

  const handleSaveEditSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries) return;

    const parsedBadges = editingBadgesText
      .split(',')
      .map(b => b.trim())
      .filter(Boolean);

    const updatedSeries: Series = {
      ...editingSeries,
      customBadges: parsedBadges.length > 0 ? parsedBadges : undefined
    };

    addOrUpdateSeries(updatedSeries);
    alert(`"${updatedSeries.title}" serisi güncellendi!`);
    setEditingSeries(null);
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSeries = seriesList.find(s => s.id === selectedSeriesId);
    if (!targetSeries) {
      alert('Lütfen geçerli bir seri seçin.');
      return;
    }

    const num = parseInt(chapterNumber, 10) || targetSeries.chapters.length + 1;
    const cTitle = chapterTitle.trim() || `Bölüm ${num}`;

    const extractedImages = extractImageUrls(chapterImages);

    const newChapter: Chapter = {
      id: 'c-' + Date.now(),
      number: num,
      title: cTitle,
      publishedDate: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
      isNew: true,
      specialTag: chapterSpecialTag.trim() || undefined,
      images: extractedImages.length > 0 ? extractedImages : undefined,
      content: chapterContent.trim() || undefined,
      notice: chapterNotice.trim() || undefined
    };

    const updatedSeries: Series = {
      ...targetSeries,
      chapters: [...targetSeries.chapters, newChapter],
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    addOrUpdateSeries(updatedSeries);
    alert(`"${cTitle}" bölümü "${targetSeries.title}" serisine eklendi!`);

    setChapterNumber('');
    setChapterTitle('');
    setChapterImages('');
    setChapterContent('');
    setChapterNotice('');
  };

  // Analytics calculations
  const totalSeriesCount = seriesList.length;
  const totalChaptersCount = seriesList.reduce((acc, s) => acc + s.chapters.length, 0);
  const totalBookmarksCount = Object.keys(bookmarks).length;
  const totalCommentsCount = comments.length;

  const sortedSeriesByStats = [...seriesList].sort((a, b) => {
    const scoreA = a.chapters.length * 10 + a.rating * 5;
    const scoreB = b.chapters.length * 10 + b.rating * 5;
    return scoreB - scoreA;
  });

  // If not logged in as Admin, show the password login screen
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 py-8">
        <div className="bg-gray-900 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
          {/* Subtle glowing backdrop */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center shadow-lg">
            <Lock size={32} className="text-amber-200" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Yönetici Paneli Girişi</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
              Bu alan sadece site sahibine / yöneticisine özeldir. Lütfen devam etmek için yönetici şifrenizi girin.
            </p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Yönetici Şifresi / PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                  placeholder="Şifrenizi girin..."
                  className="w-full bg-gray-950 border border-purple-500/40 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white transition"
                  title={showPassword ? 'Gizle' : 'Göster'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {passError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm py-3 rounded-xl shadow-xl flex items-center justify-center gap-2 transition transform hover:scale-[1.02]"
            >
              <Key size={18} />
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/80 p-4 sm:p-5 rounded-3xl border border-purple-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Edit2 className="text-purple-400" size={24} />
              İçerik & Seri Yönetim Paneli
            </h1>
            <span className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} className="text-amber-400" />
              Yönetici
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Yeni Manhwa / Novel serisi ekleyin, bölümler yayınlayın ve verilerinizi indirin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              setIsChangePassOpen(!isChangePassOpen);
              setPassError('');
              setChangePassSuccess('');
            }}
            className="bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
            title="Yönetici Şifrenizi Değiştirin"
          >
            <Key size={14} className="text-amber-400" />
            Şifre Değiştir
          </button>

          <button
            onClick={logoutAdmin}
            className="bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
            title="Yönetici Oturumunu Kapat"
          >
            <LogOut size={14} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Change Password Modal / Sub-section */}
      {isChangePassOpen && (
        <div className="bg-purple-950/90 border-2 border-purple-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-purple-800 pb-2">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Key className="text-amber-400" size={18} />
              Yönetici Şifresini Değiştir
            </h3>
            <button
              onClick={() => setIsChangePassOpen(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Kapat ✕
            </button>
          </div>

          <form onSubmit={handleChangePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-300 font-bold mb-1">Yeni Yönetici Şifresi</label>
              <input
                type="password"
                value={newPassInput}
                onChange={e => setNewPassInput(e.target.value)}
                placeholder="Örn: gizliSifre2026"
                className="w-full bg-gray-950 border border-purple-500/40 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-bold mb-1">Şifre Tekrarı</label>
              <input
                type="password"
                value={confirmPassInput}
                onChange={e => setConfirmPassInput(e.target.value)}
                placeholder="Şifreyi tekrar yazın..."
                className="w-full bg-gray-950 border border-purple-500/40 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {passError && (
              <div className="sm:col-span-2 text-xs text-red-300 bg-red-950/80 p-2 rounded-lg border border-red-500/40 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-red-400" />
                {passError}
              </div>
            )}

            {changePassSuccess && (
              <div className="sm:col-span-2 text-xs text-emerald-300 bg-emerald-950/80 p-2 rounded-lg border border-emerald-500/40 font-bold flex items-center gap-1.5">
                <Check size={16} />
                {changePassSuccess}
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
              >
                <Save size={14} />
                Yeni Şifreyi Kaydet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-900/60 p-3 rounded-2xl border border-gray-800">
        <button
          onClick={handleZipDownload}
          disabled={isZipping}
          className="bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
          title="Tüm React & TypeScript kaynak kodlarını ZIP olarak indirir"
        >
          <FileArchive size={14} />
          {isZipping ? '...' : 'Kaynak Kod ZIP İndir'}
        </button>
        <button
          onClick={handleCopyMockDataCode}
          className="bg-orange-700 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
          title="mockData.ts dosyasını kopyalar"
        >
          <FileCode size={15} />
          {copiedCode ? '✓ Kopyalandı!' : 'src/data/mockData.ts Kopyala'}
        </button>
        <button
          onClick={exportBackupData}
          className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
          title="JSON verisi indirir"
        >
          <Download size={15} />
          Yedekle (JSON)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('add-series')}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'add-series'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          + Yeni Seri Ekle
        </button>
        <button
          onClick={() => setActiveTab('add-chapter')}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'add-chapter'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          + Yeni Bölüm Yayınla
        </button>
        <button
          onClick={() => setActiveTab('manage-series')}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'manage-series'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Mevcut Seriler ({seriesList.length})
        </button>
        <button
          onClick={() => setActiveTab('blogger-import')}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1 text-orange-300 ${
            activeTab === 'blogger-import'
              ? 'border-orange-400 text-orange-300'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Globe size={15} />
          Blogger Aktarımı
        </button>
        <button
          onClick={() => setActiveTab('cloudflare-d1')}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1 text-cyan-300 ${
            activeTab === 'cloudflare-d1'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Database size={15} />
          Cloudflare D1 Veritabanı
        </button>
        <button
          onClick={() => setActiveTab('shop-management')}
          className={`pb-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1 text-amber-300 ${
            activeTab === 'shop-management'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingBag size={15} />
          🛍️ Mağaza & Tema Yönetimi
        </button>
      </div>

      {/* Add Series Form */}
      {activeTab === 'add-series' && (
        <form onSubmit={handleCreateSeries} className="bg-gray-900/95 border border-purple-500/20 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-purple-300 font-bold mb-1">Seri Başlığı *</label>
              <input
                type="text"
                required
                placeholder="Örn: Solo Leveling"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Kapak Resmi URL *</label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Format / Tür</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as SeriesType)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                <option value="Manhwa">Manhwa</option>
                <option value="Web Novel">Web Novel</option>
                <option value="Webtoon">Webtoon</option>
                <option value="Manga">Manga</option>
                <option value="Manhua">Manhua</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Yayın Durumu</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as SeriesStatus)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                <option value="Devam Ediyor">Devam Ediyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Güncel">Güncel</option>
                <option value="Yakında">Yakında</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Yayın Günü (Takvim İçin)</label>
              <select
                value={releaseDay || ''}
                onChange={e => setReleaseDay(e.target.value as Series['releaseDay'])}
                className="w-full bg-gray-950 border border-purple-500/30 text-amber-300 font-bold rounded-xl p-3 focus:outline-none"
              >
                <option value="Pazartesi">Pazartesi</option>
                <option value="Salı">Salı</option>
                <option value="Çarşamba">Çarşamba</option>
                <option value="Perşembe">Perşembe</option>
                <option value="Cuma">Cuma</option>
                <option value="Cumartesi">Cumartesi</option>
                <option value="Pazar">Pazar</option>
                <option value="Düzensiz">Düzensiz</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Yayın Saati (Örn: 18:00)</label>
              <input
                type="text"
                placeholder="Örn: 18:00 veya 20:30"
                value={releaseTime}
                onChange={e => setReleaseTime(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Yazar</label>
              <input
                type="text"
                placeholder="Yazar adı"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Çizer (Artist)</label>
              <input
                type="text"
                placeholder="Çizer / Sanatçı adı"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Yayın Yılı</label>
              <input
                type="text"
                placeholder="Örn: 2024"
                value={releaseYear}
                onChange={e => setReleaseYear(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Puan (1.0 - 10.0)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={rating}
                onChange={e => setRating(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Badges / Extra Tags Input */}
          <div>
            <label className="block text-purple-300 font-bold text-xs mb-1">
              Ek Özel Etiketler (Virgülle ayırarak yazabilir veya aşağıdaki butonlara basabilirsiniz)
            </label>
            <input
              type="text"
              placeholder="Örn: Renkli, Sansürsüz, Popüler, Sezon Finali, HD"
              value={customBadgesInput}
              onChange={e => setCustomBadgesInput(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none"
            />
            {/* Quick Badge Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400 self-center">Hızlı Ekle:</span>
              {PRESET_BADGES.map(badge => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => handleAddBadgeToInput(badge, false)}
                  className="bg-purple-950 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-[11px] font-semibold px-2 py-0.5 rounded-lg transition"
                >
                  + {badge}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Bu etiketler seri kartında ve detay sayfasında ışıltılı rozet olarak görünecektir.</p>
          </div>

          {/* Series Status & Feature Badges (Güncel, Sıcak, Yeni, 18+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Güncel Badge Checkbox */}
            <div className="bg-cyan-950/40 border border-cyan-800/50 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin-slow" /> GÜNCEL
                </span>
                <div>
                  <h4 className="text-xs font-bold text-cyan-200">Güncel Seri Etiketi</h4>
                  <p className="text-[10px] text-gray-400">Yeni çıkan bölümleri düzenli yayınlanan seri.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isGuncel}
                onChange={e => setIsGuncel(e.target.checked)}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            {/* Hot / Sıcak Badge Checkbox */}
            <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Flame size={12} /> SICAK
                </span>
                <div>
                  <h4 className="text-xs font-bold text-red-200">Sıcak / Popüler Etiketi</h4>
                  <p className="text-[10px] text-gray-400">Trendlerde üst sırada gösterilir.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isHot}
                onChange={e => setIsHot(e.target.checked)}
                className="w-5 h-5 accent-red-500 rounded cursor-pointer"
              />
            </div>

            {/* New / Yeni Badge Checkbox */}
            <div className="bg-purple-950/40 border border-purple-800/50 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap size={12} /> YENİ
                </span>
                <div>
                  <h4 className="text-xs font-bold text-purple-200">Yeni Seri Etiketi</h4>
                  <p className="text-[10px] text-gray-400">Yeni eklenen seri rozeti.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isNew}
                onChange={e => setIsNew(e.target.checked)}
                className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
              />
            </div>

            {/* 18+ Adult Content Checkbox */}
            <div className="bg-rose-950/40 border border-rose-800/50 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldAlert size={12} /> 18+
                </span>
                <div>
                  <h4 className="text-xs font-bold text-rose-200">18+ Yetişkin Etiketi</h4>
                  <p className="text-[10px] text-gray-400">Yaş sınırı uyarısı ekler.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={is18Plus}
                onChange={e => setIs18Plus(e.target.checked)}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Series Notice / Announcement */}
          <div>
            <label className="block text-purple-300 font-bold text-xs mb-1">
              Seri Özel Duyurusu / Çevirmen Notu (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Örn: Yeni bölümler her hafta Cuma günü 20:00'de yüklenecektir."
              value={notice}
              onChange={e => setNotice(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-bold text-xs mb-1">Özet (Synopsis)</label>
            <textarea
              rows={3}
              placeholder="Seri konusu..."
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-purple-300 font-bold text-xs mb-2">Türler (Kategoriler)</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {GENRE_LIST.map(g => {
                const isSel = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleToggleGenre(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      isSel ? 'bg-purple-600 text-white' : 'bg-gray-950 text-gray-400 border border-gray-800'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Save size={18} />
            Seriyi Kaydet
          </button>
        </form>
      )}

      {/* Add Chapter Form */}
      {activeTab === 'add-chapter' && (
        <form onSubmit={handleAddChapter} className="bg-gray-900/95 border border-purple-500/20 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-purple-300 font-bold mb-1">Seri Seçin *</label>
              <select
                value={selectedSeriesId}
                onChange={e => setSelectedSeriesId(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                {seriesList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Bölüm Numarası</label>
              <input
                type="number"
                placeholder="Örn: 1"
                value={chapterNumber}
                onChange={e => setChapterNumber(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-purple-300 font-bold text-xs mb-1">Bölüm Başlığı</label>
            <input
              type="text"
              placeholder="Örn: Bölüm 1: Yeni Bir Başlangıç"
              value={chapterTitle}
              onChange={e => setChapterTitle(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none"
            />
          </div>

          {/* Chapter Special Tag Selection */}
          <div className="bg-purple-950/40 border border-purple-800/50 rounded-2xl p-3.5 space-y-2">
            <label className="block text-purple-300 font-bold text-xs">
              Özel Bölüm Etiketi (Sezon Finali, Final, Ekstra, Yan Bölüm, Özel vb.)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Özel etiket yazın veya aşağıdaki hızlı butonlara tıklayın..."
                value={chapterSpecialTag}
                onChange={e => setChapterSpecialTag(e.target.value)}
                className="flex-1 bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-gray-400 self-center">Hızlı Seç:</span>
              {['Sezon Finali', 'Final', 'Ekstra', 'Yan Bölüm', 'Özel'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setChapterSpecialTag(tag)}
                  className={`border text-[11px] font-bold px-2 py-0.5 rounded-lg transition ${
                    chapterSpecialTag === tag
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-purple-950/80 text-purple-200 border-purple-700/50 hover:bg-purple-800'
                  }`}
                >
                  + {tag}
                </button>
              ))}
              {chapterSpecialTag && (
                <button
                  type="button"
                  onClick={() => setChapterSpecialTag('')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 underline ml-2 font-bold"
                >
                  Etiketi Kaldır ✕
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-purple-300 font-bold text-xs mb-1">
              Bölüm Özel Duyurusu / Notu (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Örn: UYARI: Bu bölümde heyecanlı dövüş sahneleri mevcuttur."
              value={chapterNotice}
              onChange={e => setChapterNotice(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none"
            />
          </div>

          {/* Manhwa comic images OR Novel text content */}
          <div className="space-y-4 pt-2 border-t border-gray-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-purple-300 font-bold text-xs">
                  Manhwa / Webtoon Görselleri (Sürükle-Bırak Toplu Yükleyici)
                </label>
                {chapterImages.trim() && (
                  <span className="text-[11px] bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded font-bold">
                    Yüklendi: {chapterImages.split('\n').filter(Boolean).length} Görsel
                  </span>
                )}
              </div>

              {/* Drag and Drop Zone Box */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDropImages}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isDragging
                    ? 'border-purple-400 bg-purple-950/80'
                    : 'border-purple-500/40 bg-gray-950/60 hover:bg-gray-950 hover:border-purple-400'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleSelectImageFiles}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <UploadCloud size={32} className="text-purple-400 animate-bounce" />
                <div>
                  <p className="text-xs font-bold text-purple-200">
                    Görsel Dosyalarını Buraya Sürükleyip Bırakın
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    veya Bilgisayarınızdan Resimleri Seçin (Çoklu Dosya Desteklenir)
                  </p>
                </div>
                {isUploadingFiles && (
                  <p className="text-xs font-bold text-amber-300 animate-pulse">
                    Görseller işleniyor ve dönüştürülüyor...
                  </p>
                )}
              </div>

              {/* Textarea for manual URLs, HTML embed tags, or batch list */}
              <div className="mt-3">
                <label className="block text-gray-400 text-[11px] font-semibold mb-1">
                  Harici Görsel Linkleri, HTML Embed (&lt;img src="..."&gt;, &lt;iframe...&gt;) veya URL Listesi:
                </label>
                <textarea
                  rows={4}
                  placeholder="Linkler, HTML embed kodları (&lt;img src=...&gt;) veya BBCode ([img]...[/img]) yapıştırabilirsiniz."
                  value={chapterImages}
                  onChange={e => setChapterImages(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none font-mono resize-none"
                />
              </div>

              {/* Uploaded / Extracted Image Gallery Grid Preview */}
              {extractImageUrls(chapterImages).length > 0 && (
                <div className="mt-4 bg-gray-950/80 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                      Tespit Edilen Görseller ({extractImageUrls(chapterImages).length} Adet)
                    </span>
                    <button
                      type="button"
                      onClick={() => setChapterImages('')}
                      className="text-[10px] bg-red-950 text-red-400 border border-red-800/60 px-2 py-0.5 rounded hover:bg-red-900 transition font-bold"
                    >
                      Tümünü Temizle
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Aşağıda metinden / HTML embed kodlarından otomatik olarak çıkarılan görseller listelenmektedir.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {extractImageUrls(chapterImages).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group bg-gray-900 border border-purple-500/30 rounded-xl overflow-hidden aspect-[3/4] flex flex-col justify-between shadow"
                      >
                        <img
                          src={imgUrl}
                          alt={`Sayfa ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                        <span className="absolute top-1 left-1 bg-black/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-purple-300 font-bold text-xs mb-1">
                Web Novel Metin İçeriği (Romanlar için)
              </label>
              <textarea
                rows={6}
                placeholder="Paragraflar halinde roman metnini buraya yapıştırın..."
                value={chapterContent}
                onChange={e => setChapterContent(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} />
            Bölümü Yayınla
          </button>
        </form>
      )}

      {/* Manage Series */}
      {activeTab === 'manage-series' && (
        <div className="space-y-4">
          
          {/* Search bar for series */}
          <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl p-3 flex items-center gap-3 shadow">
            <input
              type="text"
              placeholder="Seri adı ile hızlı arama yapın..."
              value={manageSearchQuery}
              onChange={e => setManageSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
            {manageSearchQuery && (
              <button
                onClick={() => setManageSearchQuery('')}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded-lg"
              >
                Temizle
              </button>
            )}
          </div>

          {/* Chapter Edit Modal / Drawer */}
          {editingChapter && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <form onSubmit={handleSaveChapterEdit} className="bg-gray-900 border-2 border-purple-500 rounded-3xl p-6 shadow-2xl space-y-4 max-w-2xl w-full my-8 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-purple-800 pb-3">
                  <h3 className="font-extrabold text-base text-purple-200 flex items-center gap-2">
                    <Edit2 size={18} className="text-purple-400" />
                    Bölüm Düzenle: {editingChapter.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChapter(null);
                      setEditingChapterSeriesId(null);
                    }}
                    className="text-xs bg-gray-800 text-gray-300 hover:text-white px-3 py-1 rounded-xl border border-gray-700"
                  >
                    Kapat
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-purple-300 font-bold mb-1">Bölüm Numarası</label>
                    <input
                      type="number"
                      required
                      value={editingChapter.number}
                      onChange={e => setEditingChapter({ ...editingChapter, number: Number(e.target.value) })}
                      className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 font-bold mb-1">Bölüm Başlığı</label>
                    <input
                      type="text"
                      required
                      value={editingChapter.title}
                      onChange={e => setEditingChapter({ ...editingChapter, title: e.target.value })}
                      className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 font-bold text-xs mb-1">
                    Özel Bölüm Etiketi (Sezon Finali, Final, Ekstra, Yan Bölüm, Özel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Sezon Finali, Final, Ekstra, Yan Bölüm"
                    value={editingChapter.specialTag || ''}
                    onChange={e => setEditingChapter({ ...editingChapter, specialTag: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Sezon Finali', 'Final', 'Ekstra', 'Yan Bölüm', 'Özel'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setEditingChapter({ ...editingChapter, specialTag: tag })}
                        className="bg-purple-950 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-[10px] font-bold px-2 py-0.5 rounded transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 font-bold text-xs mb-1">
                    Bölüm Özel Duyurusu / Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Telif hakları sebebiyle güncellenmiştir."
                    value={editingChapter.notice || ''}
                    onChange={e => setEditingChapter({ ...editingChapter, notice: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold text-xs mb-1">
                    Manhwa / Çizgi Roman Resim Linkleri (Her satıra 1 URL)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="https://image1.jpg&#10;https://image2.jpg"
                    value={editingChapterImagesText}
                    onChange={e => setEditingChapterImagesText(e.target.value)}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none font-mono resize-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold text-xs mb-1">
                    Web Novel Roman Metni (Roman Bölümleri İçin)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Roman paragraf içeriği..."
                    value={editingChapterContentText}
                    onChange={e => setEditingChapterContentText(e.target.value)}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <Save size={16} />
                    Bölüm Değişikliklerini Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChapter(null);
                      setEditingChapterSeriesId(null);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-3 rounded-xl text-xs"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Inline Edit Series Form Modal / Panel */}
          {editingSeries && (
            <form onSubmit={handleSaveEditSeries} className="bg-purple-950/90 border-2 border-purple-500 rounded-3xl p-6 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-purple-800/80 pb-3">
                <h3 className="font-extrabold text-base text-purple-200 flex items-center gap-2">
                  <Edit2 size={18} className="text-purple-400" />
                  "{editingSeries.title}" Serisini Düzenle
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingSeries(null)}
                  className="text-xs bg-gray-900 text-gray-400 hover:text-white px-3 py-1 rounded-xl border border-gray-700"
                >
                  İptal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-purple-300 font-bold mb-1">Seri Başlığı</label>
                  <input
                    type="text"
                    required
                    value={editingSeries.title}
                    onChange={e => setEditingSeries({ ...editingSeries, title: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                {/* Cover Image URL with Live Thumbnail Preview */}
                <div className="sm:col-span-2">
                  <label className="block text-purple-300 font-bold mb-1">Kapak Resmi URL'si (Resim Bağlantısı / Imgur / Discord)</label>
                  <div className="flex items-center gap-3">
                    {editingSeries.coverImage && (
                      <img
                        src={editingSeries.coverImage}
                        alt="Kapak Önizleme"
                        className="w-12 h-16 object-cover rounded-xl border border-purple-500/40 flex-shrink-0 shadow-md"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    )}
                    <input
                      type="text"
                      required
                      placeholder="https://..."
                      value={editingSeries.coverImage || ''}
                      onChange={e => setEditingSeries({ ...editingSeries, coverImage: e.target.value })}
                      className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Banner / Header Image URL */}
                <div className="sm:col-span-2">
                  <label className="block text-purple-300 font-bold mb-1">Arka Plan / Banner Resmi URL'si (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingSeries.bannerImage || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, bannerImage: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                {/* Summary / Synopsis */}
                <div className="sm:col-span-2">
                  <label className="block text-purple-300 font-bold mb-1">Seri Özeti / Hikaye Açıklaması</label>
                  <textarea
                    rows={4}
                    placeholder="Seri konusunu buraya yazın..."
                    value={editingSeries.summary || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, summary: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Yayın Günü (Takvim)</label>
                  <select
                    value={editingSeries.releaseDay || 'Pazartesi'}
                    onChange={e => setEditingSeries({ ...editingSeries, releaseDay: e.target.value as Series['releaseDay'] })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-amber-300 font-bold rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="Pazartesi">Pazartesi</option>
                    <option value="Salı">Salı</option>
                    <option value="Çarşamba">Çarşamba</option>
                    <option value="Perşembe">Perşembe</option>
                    <option value="Cuma">Cuma</option>
                    <option value="Cumartesi">Cumartesi</option>
                    <option value="Pazar">Pazar</option>
                    <option value="Düzensiz">Düzensiz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Yayın Saati</label>
                  <input
                    type="text"
                    placeholder="Örn: 18:00"
                    value={editingSeries.releaseTime || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, releaseTime: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Yazar</label>
                  <input
                    type="text"
                    value={editingSeries.author || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, author: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Çizer (Artist)</label>
                  <input
                    type="text"
                    placeholder="Çizer adı"
                    value={editingSeries.artist || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, artist: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Çeviri Grubu / Fansub (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Çevirmen veya grup adı"
                    value={editingSeries.translator || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, translator: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Yayın Yılı</label>
                  <input
                    type="text"
                    placeholder="Örn: 2024"
                    value={editingSeries.releaseYear || ''}
                    onChange={e => setEditingSeries({ ...editingSeries, releaseYear: e.target.value })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 font-bold mb-1">Yayın Durumu</label>
                  <select
                    value={editingSeries.status}
                    onChange={e => setEditingSeries({ ...editingSeries, status: e.target.value as SeriesStatus })}
                    className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="Devam Ediyor">Devam Ediyor</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="Güncel">Güncel</option>
                    <option value="Yakında">Yakında</option>
                    <option value="Bıraktıldı">Bıraktıldı</option>
                  </select>
                </div>
              </div>

              {/* Custom Badges for editing */}
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1">
                  Ek Özel Etiketler (Virgülle ayırarak yazabilir veya butonlara basabilirsiniz)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Renkli, Sansürsüz, Popüler"
                  value={editingBadgesText}
                  onChange={e => setEditingBadgesText(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-400 self-center">Hızlı Ekle:</span>
                  {PRESET_BADGES.map(badge => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => handleAddBadgeToInput(badge, true)}
                      className="bg-purple-950 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-[11px] font-semibold px-2 py-0.5 rounded-lg transition"
                    >
                      + {badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* 18+ Adult Checkbox */}
              <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldAlert size={12} /> 18+
                  </span>
                  <span className="text-xs font-bold text-rose-200">18+ Yetişkin İçerik Etiketi</span>
                </div>
                <input
                  type="checkbox"
                  checked={editingSeries.is18Plus || false}
                  onChange={e => setEditingSeries({ ...editingSeries, is18Plus: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              {/* Notice */}
              <div>
                <label className="block text-purple-300 font-bold text-xs mb-1">
                  Seri Özel Duyurusu / Çevirmen Notu
                </label>
                <input
                  type="text"
                  placeholder="Örn: Bu hafta sağlık izni sebebiyle bölüm ertelenmiştir."
                  value={editingSeries.notice || ''}
                  onChange={e => setEditingSeries({ ...editingSeries, notice: e.target.value })}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl shadow transition text-xs flex items-center justify-center gap-1.5"
                >
                  <Save size={15} />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          )}

          {seriesList
            .filter(s => manageSearchQuery ? s.title.toLowerCase().includes(manageSearchQuery.toLowerCase()) : true)
            .map(s => {
              const isExpanded = expandedSeriesId === s.id;
              const sortedChapters = [...s.chapters].sort((a, b) => b.number - a.number);

              return (
                <div
                  key={s.id}
                  className="bg-gray-900/90 border border-purple-500/20 rounded-2xl p-4 space-y-3 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={s.coverImage}
                        alt={s.title}
                        className="w-12 h-16 object-cover rounded-xl border border-purple-500/30 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white truncate">{s.title}</h4>
                          {s.releaseDay && (
                            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                              <Calendar size={10} /> {s.releaseDay} {s.releaseTime || ''}
                            </span>
                          )}
                          {s.is18Plus && (
                            <span className="text-[10px] bg-rose-900 text-rose-200 font-black px-1.5 py-0.2 rounded">
                              18+
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          <span>{s.type}</span> • <span className="text-purple-300 font-bold">{s.chapters.length} Bölüm</span> • <span>{s.status}</span>
                        </div>
                        {s.notice && (
                          <p className="text-[11px] text-amber-300 font-medium truncate mt-1 flex items-center gap-1">
                            <Megaphone size={12} className="flex-shrink-0" />
                            <span>{s.notice}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                      <button
                        onClick={() => setExpandedSeriesId(isExpanded ? null : s.id)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border transition ${
                          isExpanded
                            ? 'bg-amber-900/80 border-amber-600 text-amber-200'
                            : 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-700 text-indigo-200'
                        }`}
                      >
                        <Layers size={13} />
                        {isExpanded ? 'Bölümleri Gizle' : `Bölümleri Yönet (${s.chapters.length})`}
                      </button>

                      <button
                        onClick={() => startEditingSeries(s)}
                        className="bg-purple-800 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-purple-600"
                      >
                        <Edit2 size={13} />
                        Düzenle
                      </button>

                      <button
                        onClick={() => setView({ type: 'series-detail', seriesId: s.id })}
                        className="bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs px-3 py-1.5 rounded-xl border border-purple-800"
                      >
                        Görüntüle
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`"${s.title}" serisini silmek istediğinizden emin misiniz?`)) {
                            deleteSeries(s.id);
                          }
                        }}
                        className="bg-red-950/80 hover:bg-red-900 text-red-300 p-2 rounded-xl border border-red-800"
                        title="Seriyi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Chapter List */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-purple-800/40 bg-gray-950/80 rounded-xl p-3 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300 pb-1 border-b border-gray-800">
                        <span>"{s.title}" Bölüm Listesi ({s.chapters.length} Bölüm)</span>
                        <span className="text-[10px] text-gray-400">Herhangi bir bölümü düzenleyebilir veya silebilirsiniz.</span>
                      </div>

                      {sortedChapters.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">Bu seride henüz yayınlanmış bölüm bulunmamaktadır.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {sortedChapters.map(ch => (
                            <div
                              key={ch.id}
                              className="bg-gray-900 hover:bg-purple-950/40 border border-gray-800 hover:border-purple-600/40 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs transition"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="bg-purple-950 border border-purple-700/50 text-purple-200 font-extrabold text-[11px] px-2 py-0.5 rounded">
                                  Bölüm {ch.number}
                                </span>
                                <span className="font-bold text-gray-200 truncate">{ch.title}</span>
                                {ch.notice && (
                                  <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded truncate flex items-center gap-1">
                                    <MessageSquare size={10} />
                                    <span>{ch.notice}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => startEditingChapter(s.id, ch)}
                                  className="bg-purple-900/80 hover:bg-purple-800 text-purple-100 text-[11px] font-bold px-2.5 py-1 rounded-md border border-purple-600/50 flex items-center gap-1 transition"
                                >
                                  <Edit2 size={12} />
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => handleDeleteChapter(s.id, ch.id, ch.number)}
                                  className="bg-red-950 hover:bg-red-900 text-red-300 text-[11px] font-bold p-1 rounded-md border border-red-800 transition"
                                  title="Bölümü Sil"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Blogger Import Section */}
      {activeTab === 'blogger-import' && (
        <div className="bg-gray-900/95 border border-orange-500/30 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
          {/* Information & Instructions Banner */}
          <div className="bg-gradient-to-r from-orange-950/60 to-amber-950/60 border border-orange-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Globe size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">Blogger (.xml / Feed) Otomatik İçerik Aktarımı</h2>
                <p className="text-xs text-orange-200/80">Eski Blogger sitenizdeki gönderileri, görselleri ve metinleri tek tıkla Manhwa/Novel bölümlerine dönüştürün.</p>
              </div>
            </div>

            <div className="bg-gray-950/70 border border-orange-500/20 rounded-xl p-3 text-xs text-gray-300 space-y-1.5 leading-relaxed">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Blogger'dan Nasıl Yedek Alınır?
              </p>
              <p className="text-gray-400">
                1. Blogger panelinize girin &rarr; <strong>Ayarlar</strong> &rarr; <strong>İçeriği Yedekle</strong> butonuna tıklayarak <code>.xml</code> dosyasını indirin.
              </p>
              <p className="text-gray-400">
                2. Aşağıdaki dosya seçici ile indirilen <code>.xml</code> dosyasını yükleyin veya metin kutusuna yapıştırıp <strong>Ayrıştır</strong>'a tıklayın.
              </p>
              <p className="text-gray-400">
                3. Sistem tüm görsel bağlantılarını, metinleri ve bölüm numaralarını otomatik çıkaracaktır.
              </p>
            </div>

            {/* Storage Info Box */}
            <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="font-extrabold text-white block mb-0.5">Kalıcı Kayıt & İçerik Yönetimi:</strong>
                <span>
                  Aktarılan gönderiler ve bölümler doğrudan sitenizin ana veritabanına ve seri listenize eklenir. Tüm içerikleriniz güvenle saklanır, istediğiniz zaman düzenleyebilir ve okuyucularınıza anında sunabilirsiniz.
                </span>
              </div>
            </div>
          </div>

          {/* File Upload / Content Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-orange-500/40 hover:border-orange-400 bg-orange-950/20 rounded-2xl p-6 text-center space-y-3 transition">
              <UploadCloud size={36} className="mx-auto text-orange-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Blogger .xml / RSS Dosyası Yükleyin</h3>
                <p className="text-xs text-gray-400 mt-1">Bilgisayarınızdaki Blogger yedek (.xml veya .json) dosyasını seçin</p>
              </div>
              <label className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-lg transition">
                Dosya Seç (.xml / .json)
                <input
                  type="file"
                  accept=".xml,.json,.rss,.atom"
                  onChange={handleBloggerFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Raw XML / RSS Text Area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-orange-300">
                Veya Blogger XML / Feed Metnini Buraya Yapıştırın:
              </label>
              <textarea
                value={bloggerRawXml}
                onChange={e => setBloggerRawXml(e.target.value)}
                placeholder="<feed xmlns='http://www.w3.org/2005/Atom'> ... </feed>"
                rows={4}
                className="w-full bg-gray-950 border border-orange-500/30 text-white placeholder-gray-600 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
              />
              <button
                type="button"
                onClick={() => handleParseBloggerContent(bloggerRawXml)}
                disabled={isParsingBlogger || !bloggerRawXml.trim()}
                className="w-full bg-orange-800 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                {isParsingBlogger ? 'Ayrıştırılıyor...' : 'Yapıştırılan Metni Ayrıştır'}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {bloggerStatusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              bloggerStatusMessage.includes('Başarılı')
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-amber-950/80 border-amber-500/50 text-amber-200'
            }`}>
              <Sparkles size={16} className="flex-shrink-0" />
              <span>{bloggerStatusMessage}</span>
            </div>
          )}

          {/* Parsed Posts & Import Setup */}
          {bloggerParsedPosts.length > 0 && (
            <div className="space-y-5 pt-4 border-t border-gray-800 animate-fadeIn">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                Aktarım Ayarları & İçerik Önizleme
              </h3>

              {/* Import Mode Selector */}
              <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-extrabold text-purple-300">
                  Aktarım Yöntemi Seçin:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                    bloggerImportMode === 'auto-smart'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-200 font-bold'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="bloggerMode"
                      checked={bloggerImportMode === 'auto-smart'}
                      onChange={() => setBloggerImportMode('auto-smart')}
                      className="accent-amber-500"
                    />
                    <div className="min-w-0">
                      <span className="block font-black text-amber-300 flex items-center gap-1">
                        <Sparkles size={13} /> Akıllı Otomatik Eşleştirme
                      </span>
                      <span className="text-[10px] text-gray-400">Etiketlere göre serileri ve bölümleri otomatik gruplar</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                    bloggerImportMode === 'existing-series'
                      ? 'bg-purple-950/90 border-purple-500 text-white font-bold'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="bloggerMode"
                      checked={bloggerImportMode === 'existing-series'}
                      onChange={() => setBloggerImportMode('existing-series')}
                      className="accent-purple-500"
                    />
                    <div className="min-w-0">
                      <span className="block font-bold">Mevcut Bir Seriye Ekle</span>
                      <span className="text-[10px] text-gray-400">Tüm bölümleri seçilen tek seriye aktarır</span>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                    bloggerImportMode === 'new-series'
                      ? 'bg-purple-950/90 border-purple-500 text-white font-bold'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="bloggerMode"
                      checked={bloggerImportMode === 'new-series'}
                      onChange={() => setBloggerImportMode('new-series')}
                      className="accent-purple-500"
                    />
                    <div className="min-w-0">
                      <span className="block font-bold">Manuel Yeni Seri Oluştur</span>
                      <span className="text-[10px] text-gray-400">Yeni bir tek seri adı girip aktarır</span>
                    </div>
                  </label>
                </div>

                {/* Target Series Dropdown if Existing */}
                {bloggerImportMode === 'existing-series' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-300 mb-1">Hedef Seri Seçin *</label>
                    <select
                      value={bloggerTargetSeriesId}
                      onChange={e => setBloggerTargetSeriesId(e.target.value)}
                      className="w-full bg-gray-900 border border-purple-500/40 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="">-- Seri Seçin --</option>
                      {seriesList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.type} - {s.chapters.length} Bölüm)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* New Series Form if New */}
                {bloggerImportMode === 'new-series' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">Yeni Seri Başlığı *</label>
                      <input
                        type="text"
                        value={bloggerNewSeriesTitle}
                        onChange={e => setBloggerNewSeriesTitle(e.target.value)}
                        placeholder="Örn: Blogger Seri Başlığı"
                        className="w-full bg-gray-900 border border-purple-500/40 text-white rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">Seri Türü *</label>
                      <select
                        value={bloggerNewSeriesType}
                        onChange={e => setBloggerNewSeriesType(e.target.value as SeriesType)}
                        className="w-full bg-gray-900 border border-purple-500/40 text-white rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="Manhwa">Manhwa</option>
                        <option value="Manga">Manga</option>
                        <option value="Manhua">Manhua</option>
                        <option value="Novel">Novel (Metin)</option>
                        <option value="Çizgi Roman">Çizgi Roman</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Detected Series View (if auto-smart mode) */}
              {bloggerImportMode === 'auto-smart' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-bold px-1">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Sparkles size={15} />
                      Otomatik Algılanan Seriler ({autoDetectedSeries.filter(s => s.selected).length} / {autoDetectedSeries.length} seçili)
                    </span>
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAutoDetectedSeries(prev => prev.map(s => ({ ...s, selected: true })))}
                        className="text-amber-400 hover:underline font-bold"
                      >
                        Tümünü Seç
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setAutoDetectedSeries(prev => prev.map(s => ({ ...s, selected: false })))}
                        className="text-gray-400 hover:underline"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>

                  {autoDetectedSeries.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center bg-gray-950/50 rounded-xl border border-gray-800">
                      Henüz otomatik eşleşen seri bulunamadı. Lütfen üstten Blogger XML / feed dosyanızı veya metninizi yükleyin.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {autoDetectedSeries.map((det, index) => (
                        <div
                          key={det.id}
                          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
                            det.selected
                              ? 'bg-gradient-to-r from-amber-950/40 to-purple-950/40 border-amber-500/50 text-white'
                              : 'bg-gray-950/50 border-gray-800 opacity-60 text-gray-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={det.selected}
                            onChange={e => {
                              const checked = e.target.checked;
                              setAutoDetectedSeries(prev =>
                                prev.map((s, i) => (i === index ? { ...s, selected: checked } : s))
                              );
                            }}
                            className="accent-amber-500 w-4 h-4 rounded mt-1 flex-shrink-0 cursor-pointer"
                          />

                          <img
                            src={det.coverImage}
                            alt={det.seriesName}
                            className="w-14 h-20 object-cover rounded-xl border border-purple-500/30 flex-shrink-0 shadow-md"
                          />

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-extrabold text-xs text-amber-200 truncate">{det.seriesName}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                det.type === 'Web Novel' ? 'bg-amber-900 text-amber-200 border border-amber-700' : 'bg-purple-900 text-purple-200 border border-purple-700'
                              }`}>
                                {det.type}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-300 font-semibold flex items-center gap-2">
                              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-extrabold">
                                {det.chapterPosts.length} Bölüm
                              </span>
                              {det.projectPost && (
                                <span className="bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 text-[10px]">
                                  Tanıtım Gönderisi Var
                                </span>
                              )}
                            </p>

                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                              {det.synopsis}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Items List (If manual mode) */}
              {bloggerImportMode !== 'auto-smart' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-300 font-bold px-1">
                    <span>Ayrıştırılan Gönderiler ({bloggerParsedPosts.filter(p => p.selected).length} / {bloggerParsedPosts.length} seçili)</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBloggerParsedPosts(prev => prev.map(p => ({ ...p, selected: true })))}
                        className="text-purple-400 hover:underline"
                      >
                        Tümünü Seç
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setBloggerParsedPosts(prev => prev.map(p => ({ ...p, selected: false })))}
                        className="text-gray-400 hover:underline"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {bloggerParsedPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          post.selected
                            ? 'bg-purple-950/50 border-purple-500/40 text-white'
                            : 'bg-gray-950/50 border-gray-800 text-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={post.selected}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              setBloggerParsedPosts(prev =>
                                prev.map((p, i) => (i === index ? { ...p, selected: isChecked } : p))
                              );
                            }}
                            className="accent-purple-500 w-4 h-4 rounded"
                          />
                          <div className="min-w-0">
                            <p className="font-bold truncate">{post.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              <span>Bölüm No: {post.chapterNumber}</span>
                              <span>•</span>
                              <span>Tarih: {post.publishedDate}</span>
                              <span>•</span>
                              <span className="text-amber-300 font-bold">{post.extractedImages.length} Görsel Bulundu</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-[10px]">
                          {post.extractedImages.length > 0 ? (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                              Resimli
                            </span>
                          ) : (
                            <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">
                              Metin / Novel
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Action Button */}
              <button
                type="button"
                onClick={handleExecuteBloggerImport}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition transform hover:scale-[1.01]"
              >
                <UploadCloud size={20} />
                Seçili {bloggerParsedPosts.filter(p => p.selected).length} Gönderiyi Sisteme Aktar ve Kaydet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cloudflare D1 Tab */}
      {activeTab === 'cloudflare-d1' && (
        <div className="bg-gray-900/95 border border-cyan-500/30 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Database size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Cloudflare D1 Veritabanı & Otomatik Depolama</h2>
                <p className="text-xs text-cyan-200/80">Siteniz %100 otomatik Cloudflare D1 SQL veritabanı mimarisine sahiptir.</p>
              </div>
            </div>

            <div className="bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Otomatik Senkronizasyon Aktif</span>
            </div>
          </div>

          {/* Zero-Code Automatic Sync Banner */}
          <div className="bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white">Siz Kodla Veya Terminalle Uğraşmazsınız!</h3>
                <p className="text-xs text-cyan-100/90 leading-relaxed">
                  Admin panelinden yeni bir seri eklediğinizde, Blogger yedeği aktardığınızda veya <strong>bir seriyi sildiğinizde</strong>, sistem otomatik olarak Cloudflare D1 veritabanından o seriyi siler veya günceller.
                </p>
                <p className="text-[11px] text-amber-300/90 italic pt-1">
                  💡 <strong>Önemli Bilgi:</strong> Cloudflare Paneli (Dashboard) üzerindeki "Storage (53.25 KB)" grafik göstergesi 24 saatte bir güncellenir. Eklenen verinin anında D1'de olup olmadığını aşağıdaki canlı sorgu butonuyla doğrudan doğrulayabilirsiniz.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  let successCount = 0;
                  for (const s of seriesList) {
                    try {
                      await fetch('/api/series', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ series: s })
                      });
                      successCount++;
                    } catch (e) {}
                  }
                  alert(`Tüm verileriniz (${successCount}/${seriesList.length} seri) Cloudflare D1 veritabanına başarıyla eşitlendi!`);
                  handleCheckD1Status();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <RefreshCw size={15} />
                Tüm Verileri D1 ile Eşitle
              </button>

              <button
                type="button"
                onClick={handleCheckD1Status}
                disabled={isCheckingD1}
                className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Database size={15} />
                {isCheckingD1 ? 'D1 Sorgulanıyor...' : 'D1 Canlı Veritabanı Durumunu Kontrol Et'}
              </button>
            </div>
          </div>

          {/* D1 Live Status Output Widget */}
          {d1StatusInfo && (
            <div className="bg-gray-950/90 border border-cyan-500/40 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <span className="text-xs font-black text-cyan-300 flex items-center gap-2">
                  <Database size={16} /> Cloudflare D1 Veritabanı Canlı Tablo Raporu
                </span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  d1StatusInfo.dbConnected ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
                }`}>
                  {d1StatusInfo.dbConnected ? 'D1 Bağlantısı Aktif ✅' : 'D1 Bağlantısı Yok ❌'}
                </span>
              </div>

              {d1StatusInfo.dbConnected ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-300">
                    Cloudflare D1 SQL veritabanınızda şu anda toplam <strong>{d1StatusInfo.totalSeriesInD1}</strong> adet kayıtlı seri bulunuyor:
                  </p>
                  
                  {d1StatusInfo.series && d1StatusInfo.series.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {d1StatusInfo.series.map(s => (
                        <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-white truncate">{s.title}</span>
                            <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-md flex-shrink-0">
                              {s.type}
                            </span>
                          </div>
                          <span className="text-emerald-400 font-extrabold text-[11px] flex-shrink-0">
                            {s.chapterCount} Bölüm D1'de Kayıtlı
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-xs text-amber-200">
                      D1 veritabanında henüz seri kaydı bulunmuyor. "Tüm Verileri D1 ile Eşitle" butonuna tıklayarak ilk senkronizasyonu başlatabilirsiniz.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-200 leading-relaxed space-y-1">
                  <p className="font-bold">⚠️ Cloudflare D1 Bağlantı Hatası:</p>
                  <p>{d1StatusInfo.message}</p>
                </div>
              )}
            </div>
          )}

          {/* D1 vs R2 Simple Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-950/80 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-black text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                <Database size={15} /> Cloudflare D1 (Veritabanınız)
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                Manhwa isimleri, bölümler, metinler, yorumlar ve duyurular gibi tüm metin verilerinin saklandığı ana veritabanıdır. Ücretsizdir, çok hızlıdır ve tüm okuyucularınıza anında sunulur.
              </p>
            </div>

            <div className="bg-gray-950/80 border border-purple-500/30 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-black text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                <Server size={15} /> Cloudflare R2 (Resim Deposu)
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                Bölüm resimlerini ve kapakları doğrudan kendi sunucunuza yüklemek isterseniz kullanılan depolama alanıdır. Blogger ve harici resim linkleriniz olduğu gibi D1'de saklanır ve ek ücret çıkarmaz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download D1 SQL Button */}
            <div className="bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Download size={16} /> Manuel SQL Yedeği Al
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {seriesList.length} Seri + {comments.length} Yorum
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Sitedeki tüm verilerinizi bilgisayarınıza yedeklemek isterseniz tek tıkla <code>.sql</code> formatında indirebilirsiniz.
              </p>
              <button
                type="button"
                onClick={() => downloadCloudflareD1Sql(seriesList, comments, shopItems, themeStyles)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Database size={16} />
                Cloudflare D1 SQL Yedeğini İndir (.sql)
              </button>
            </div>

            {/* Cloudflare Pages Zip Button */}
            <div className="bg-gradient-to-br from-purple-950/80 to-indigo-950/80 border border-purple-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileArchive size={16} /> Cloudflare Pages Hazır ZIP
                </span>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  Tek Tık Dağıtım
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Tüm site dosyalarını ve ayarları bilgisayarınıza ZIP olarak indirin.
              </p>
              <button
                type="button"
                onClick={downloadProjectZip}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <FileArchive size={16} />
                Tüm Sitemi Cloudflare ZIP Olarak İndir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop & Theme Management Tab */}
      {activeTab === 'shop-management' && (
        <div className="bg-gray-900/95 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Mağaza & Tema Yönetimi</span>
                  <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Admin Özel
                  </span>
                </h2>
                <p className="text-xs text-amber-200/80">
                  Mağazadaki tüm temaları düzenleyin, arka plan görsellerini değiştirin, yeni temalar ekleyin veya fiyatları ayarlayın.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNewTheme}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition transform hover:scale-105"
              >
                <PlusCircle size={16} />
                + Yeni Özel Tema Ekle
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tüm mağaza ürünleri ve temalar orijinal varsayılan ayarlara döndürülsün mü?')) {
                    resetShopToDefault();
                  }
                }}
                className="bg-gray-800 hover:bg-red-950/80 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-500/50 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                title="Varsayılana Sıfırla"
              >
                <RotateCcw size={15} />
                Sıfırla
              </button>
            </div>
          </div>

          {shopAdminMessage && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              shopAdminMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/90 border-red-500/50 text-red-300'
            }`}>
              <CheckCircle2 size={16} />
              <span>{shopAdminMessage.text}</span>
            </div>
          )}

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-950/80 p-3 rounded-2xl border border-amber-500/20">
            <input
              type="text"
              placeholder="Ürün adı veya ID ara..."
              value={shopSearchQuery}
              onChange={e => setShopSearchQuery(e.target.value)}
              className="w-full sm:w-72 bg-gray-900 border border-gray-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setShopCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                  shopCategoryFilter === 'all'
                    ? 'bg-amber-400 text-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                Tümü ({shopItems.length})
              </button>
              <button
                type="button"
                onClick={() => setShopCategoryFilter('theme_photo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                  shopCategoryFilter === 'theme_photo'
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-900 text-rose-300 hover:text-white'
                }`}
              >
                🖼️ Görsel Temalar ({shopItems.filter(i => i.category === 'theme' && i.themeType === 'photo').length})
              </button>
              <button
                type="button"
                onClick={() => setShopCategoryFilter('theme_aura')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                  shopCategoryFilter === 'theme_aura'
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-900 text-amber-300 hover:text-white'
                }`}
              >
                ✨ Aura Temaları ({shopItems.filter(i => i.category === 'theme' && i.themeType !== 'photo').length})
              </button>
              <button
                type="button"
                onClick={() => setShopCategoryFilter('badge')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                  shopCategoryFilter === 'badge'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                ⭐ Unvanlar ({shopItems.filter(i => i.category === 'badge').length})
              </button>
              <button
                type="button"
                onClick={() => setShopCategoryFilter('emoji_pack')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition ${
                  shopCategoryFilter === 'emoji_pack'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                😊 Emojiler ({shopItems.filter(i => i.category === 'emoji_pack').length})
              </button>
            </div>
          </div>

          {/* Shop Item Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shopItems
              .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(shopSearchQuery.toLowerCase()) ||
                  item.id.toLowerCase().includes(shopSearchQuery.toLowerCase());
                if (!matchesSearch) return false;
                if (shopCategoryFilter === 'all') return true;
                if (shopCategoryFilter === 'theme_photo') return item.category === 'theme' && item.themeType === 'photo';
                if (shopCategoryFilter === 'theme_aura') return item.category === 'theme' && item.themeType !== 'photo';
                return item.category === shopCategoryFilter;
              })
              .map(item => {
                const style = item.category === 'theme' ? themeStyles[item.id] : null;

                return (
                  <div
                    key={item.id}
                    className="relative bg-gray-950 border border-gray-800 hover:border-amber-500/50 rounded-2xl p-4 transition shadow-lg flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Top badges & actions */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition line-clamp-1">
                              {item.name}
                            </h3>
                            <span className="text-[10px] text-gray-400 font-mono">{item.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                            {item.price} CP
                          </span>
                          <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.rarity}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{item.description}</p>

                      {/* Preview for Themes */}
                      {item.category === 'theme' && style && (
                        <div className="relative rounded-xl overflow-hidden p-3 border border-gray-800 bg-gray-900 my-2">
                          {style.cardBgImageUrl && (
                            <div
                              className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-80"
                              style={{ backgroundImage: `url(${style.cardBgImageUrl})` }}
                            />
                          )}
                          <ThemeBackgroundEffects effectOverlay={style.effectOverlay} />

                          <div className="relative z-10 space-y-1.5">
                            <div className={`flex items-center gap-2 w-fit ${
                              style.cardBgImageUrl ? 'bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10' : ''
                            }`}>
                              <span className={`text-xs ${style.nameClass || 'text-amber-300 font-bold'}`}>
                                Okuyucu Yorum Kartı
                              </span>
                              {style.themeType === 'photo' ? (
                                <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.2 rounded">
                                  Görsel Fonlu
                                </span>
                              ) : (
                                <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded">
                                  Aura
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] text-gray-200 ${
                              style.cardBgImageUrl ? 'bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10' : ''
                            }`}>
                              "Örnek yorum metni ve arka plan canlı önizlemesi."
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-900">
                      <button
                        type="button"
                        onClick={() => handleOpenShopEdit(item)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Edit3 size={14} />
                        Düzenle & Arka Plan Değiştir
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`)) {
                            deleteShopItemAndStyle(item.id);
                          }
                        }}
                        className="bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-red-400 p-2 rounded-xl border border-gray-800 transition shrink-0"
                        title="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SHOP ITEM & THEME EDIT MODAL */}
      {showShopEditModal && editingShopItem && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="relative bg-gray-900 border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                  <Palette size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingShopItem.name} Düzenle
                  </h3>
                  <p className="text-[11px] text-gray-400">Ürün özelliklerini ve temanın arka plan görselini güncelleyin.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShopEditModal(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-gray-800 transition"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-amber-300 font-bold mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  value={editingShopItem.name}
                  onChange={e => setEditingShopItem({ ...editingShopItem, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1">Fiyat (Cosmo-Puan CP) *</label>
                <input
                  type="number"
                  value={editingShopItem.price}
                  onChange={e => setEditingShopItem({ ...editingShopItem, price: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1">Ürün Simgesi (Emoji) *</label>
                <input
                  type="text"
                  value={editingShopItem.icon}
                  onChange={e => setEditingShopItem({ ...editingShopItem, icon: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-amber-300 font-bold mb-1">Nadirlik Seviyesi</label>
                <select
                  value={editingShopItem.rarity}
                  onChange={e => setEditingShopItem({ ...editingShopItem, rarity: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="Yaygın">Yaygın</option>
                  <option value="Nadir">Nadir</option>
                  <option value="Destansı">Destansı</option>
                  <option value="Efsanevi">Efsanevi</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-amber-300 font-bold mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  value={editingShopItem.description}
                  onChange={e => setEditingShopItem({ ...editingShopItem, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            {/* Theme Style Specific Settings */}
            {editingShopItem.category === 'theme' && editingThemeStyle && (
              <div className="space-y-4 pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} /> Tema Arka Plan Görseli & Efekt Ayarları
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="text-gray-300 font-bold">Tema Tipi:</label>
                    <select
                      value={editingShopItem.themeType || 'photo'}
                      onChange={e => {
                        const newType = e.target.value as 'aura' | 'photo';
                        setEditingShopItem({ ...editingShopItem, themeType: newType });
                        setEditingThemeStyle({ ...editingThemeStyle, themeType: newType });
                      }}
                      className="bg-gray-950 border border-gray-700 text-amber-300 rounded-lg p-1 text-xs"
                    >
                      <option value="photo">🖼️ Görsel Fonlu Tema</option>
                      <option value="aura">✨ Aura / Işıltı Teması</option>
                    </select>
                  </div>
                </div>

                {/* Arka Plan Görsel URL Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">
                    🖼️ Arka Plan Görsel Linki (Image URL - HD Görsel)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-... veya resim URL'si"
                      value={editingThemeStyle.cardBgImageUrl || ''}
                      onChange={e => setEditingThemeStyle({ ...editingThemeStyle, cardBgImageUrl: e.target.value })}
                      className="w-full bg-gray-950 border border-amber-500/40 text-amber-200 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    {editingThemeStyle.cardBgImageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingThemeStyle({ ...editingThemeStyle, cardBgImageUrl: '' })}
                        className="bg-gray-800 text-gray-400 hover:text-red-400 p-2.5 rounded-xl text-xs border border-gray-700"
                        title="Resmi Kaldır"
                      >
                        <CloseIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Preset Background Images */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400">⚡ Hazır Örnek HD Arka Planlar:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_BG_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingThemeStyle({ ...editingThemeStyle, cardBgImageUrl: preset.url })}
                        className="group relative rounded-xl overflow-hidden h-14 border border-gray-700 hover:border-amber-400 text-left transition p-1.5 flex flex-col justify-end"
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition duration-300"
                          style={{ backgroundImage: `url(${preset.url})` }}
                        />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition" />
                        <span className="relative z-10 text-[9px] font-extrabold text-white truncate drop-shadow">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effect Overlay Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Aura Efekti / Animasyonu</label>
                    <select
                      value={editingThemeStyle.effectOverlay || 'saturn'}
                      onChange={e => setEditingThemeStyle({ ...editingThemeStyle, effectOverlay: e.target.value as any })}
                      className="w-full bg-gray-950 border border-gray-700 text-white rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                    >
                      <option value="saturn">🪐 Saturn Rings</option>
                      <option value="shooting_star">☄️ Shooting Stars</option>
                      <option value="nebula">🌌 Galaxy Nebula</option>
                      <option value="supernova">💥 Supernova Blast</option>
                      <option value="divine_wings">🪽 Divine Angel Wings</option>
                      <option value="stardust">✨ Celestial Stardust</option>
                      <option value="dragon_fire">🔥 Dragon Flame</option>
                      <option value="frost_crystal">❄️ Frost Crystal</option>
                      <option value="void_portal">🌀 Void Portal</option>
                      <option value="lightning_plasma">⚡ Lightning Plasma</option>
                      <option value="sakura_bloom">🌸 Sakura Petals</option>
                      <option value="golden_crown">👑 Golden Crown</option>
                      <option value="emerald_poison">💚 Emerald Flame</option>
                      <option value="moon_stars">🌙 Moon & Stars</option>
                      <option value="night_lotus">🪷 Night Lotus</option>
                      <option value="moon_furin">🎐 Moon Furin</option>
                      <option value="purple_moon_butterfly">🦋 Purple Butterfly</option>
                      <option value="night_lanterns">🏮 Palace Lanterns</option>
                      <option value="sakura_cascade">🌸 Sakura Cascade</option>
                      <option value="crimson_moon_romance">🌙 Crimson Moon Romance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Işıltı Rengi (Glow Color Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingThemeStyle.glowColor || '#fbbf24'}
                        onChange={e => setEditingThemeStyle({ ...editingThemeStyle, glowColor: e.target.value })}
                        className="w-10 h-10 rounded-xl bg-gray-950 border border-gray-700 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={editingThemeStyle.glowColor || '#fbbf24'}
                        onChange={e => setEditingThemeStyle({ ...editingThemeStyle, glowColor: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-amber-300">
                    👁️ Canlı Yorum Kartı Önizlemesi (Live Comment Card Preview):
                  </label>

                  <div className={`relative rounded-2xl overflow-hidden p-4 border border-purple-500/30 bg-gray-950 shadow-xl space-y-3 ${editingThemeStyle.cardClass || ''}`}>
                    {editingThemeStyle.cardBgImageUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-90"
                        style={{ backgroundImage: `url(${editingThemeStyle.cardBgImageUrl})` }}
                      />
                    )}

                    <ThemeBackgroundEffects effectOverlay={editingThemeStyle.effectOverlay} />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className={`flex items-center gap-2.5 w-fit ${
                        editingThemeStyle.cardBgImageUrl ? 'bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-md' : ''
                      }`}>
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                          alt="preview avatar"
                          className={`w-7 h-7 rounded-full object-cover ${editingThemeStyle.avatarBorderClass || 'ring-2 ring-amber-400'}`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs ${editingThemeStyle.nameClass || 'text-amber-300 font-bold'}`}>
                              Admin Okuyucu
                            </span>
                            <span className="text-[9px] bg-amber-400 text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                              Yönetici
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block">Şimdi</span>
                        </div>
                      </div>
                    </div>

                    <p className={`relative z-10 text-xs text-gray-100 ${
                      editingThemeStyle.cardBgImageUrl ? 'bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-md' : ''
                    }`}>
                      "Bu tema harika görünüyor! Arka plan resmi tam olarak istediğim gibi yorum kartına uygulandı. 🔥✨"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowShopEditModal(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveShopEdit}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 transition transform hover:scale-105"
              >
                <Save size={16} />
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
