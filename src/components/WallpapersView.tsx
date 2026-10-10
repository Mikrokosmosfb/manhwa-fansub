import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { WallpaperItem, WallpaperCategory, isAuthorizedAdmin, isSeries18Plus } from '../types';
import { getOptimizedImageUrl, handleImageError } from '../utils/imageUtils';
import {
  Search,
  Sparkles,
  Download,
  Heart,
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Square,
  ExternalLink,
  BookOpen,
  Upload,
  Link as LinkIcon,
  Check,
  Filter,
  SlidersHorizontal,
  Share2,
  ZoomIn,
  ChevronDown,
  Layers,
  RefreshCw,
  FolderPlus
} from 'lucide-react';

interface WallpapersViewProps {
  initialSeriesId?: string;
  isAdminPanel?: boolean;
}

const normalizeSearchText = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
};

export const WallpapersView: React.FC<WallpapersViewProps> = ({
  initialSeriesId,
  isAdminPanel = false
}) => {
  const { seriesList, user, isAdminLoggedIn, setView, showToast, showNsfw } = useApp();

  const isAdmin = isAuthorizedAdmin(user?.email) || isAdminLoggedIn;
  // Wallpaper yükleme işlemleri SADECE Yönetim Paneli (Admin Panel) içinden yapılabilir
  const canUploadInAdminPanel = Boolean(isAdmin && isAdminPanel);

  // Wallpapers state with localStorage cache + D1 backend sync
  const [wallpapers, setWallpapers] = useState<WallpaperItem[]>(() => {
    try {
      const cached = localStorage.getItem('mk_wallpapers_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed.filter((w: any) => !String(w?.id || '').startsWith('series-'));
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('mk_wallpapers_v1');
    } catch {
      return true;
    }
  });

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mk_liked_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(initialSeriesId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | WallpaperCategory>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'downloads' | 'az'>('newest');

  // Series Selector Dropdown inside Filter Bar
  const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
  const [seriesDropdownSearch, setSeriesDropdownSearch] = useState('');
  const seriesDropdownRef = useRef<HTMLDivElement>(null);

  // Lightbox Modal state
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperItem | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);

  // Admin Upload Modal state (only active inside Admin Panel)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(isAdminPanel);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [uploadSeriesId, setUploadSeriesId] = useState<string>(initialSeriesId || '');
  const [uploadSeriesSearch, setUploadSeriesSearch] = useState('');
  const [customSeriesTitle, setCustomSeriesTitle] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'auto' | WallpaperCategory>('auto');
  const [uploadTagsInput, setUploadTagsInput] = useState('');
  const [uploadUrlText, setUploadUrlText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ file: File; previewUrl: string; detectedCategory: WallpaperCategory }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSeriesId) {
      setSelectedSeriesId(initialSeriesId);
      setUploadSeriesId(initialSeriesId);
    }
  }, [initialSeriesId]);

  // Close series dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (seriesDropdownRef.current && !seriesDropdownRef.current.contains(e.target as Node)) {
        setIsSeriesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe fetch helper that handles non-JSON / HTML responses gracefully (e.g. in local Vite preview)
  const safeFetchWallpapersJson = async <T = any>(url: string, init?: RequestInit): Promise<T | null> => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        return null;
      }
      const text = await res.text();
      if (!text || !text.trim()) return null;
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  };

  // Fetch wallpapers from Cloudflare D1 API
  const fetchWallpapers = async () => {
    try {
      const data = await safeFetchWallpapersJson<{ success?: boolean; wallpapers?: WallpaperItem[] }>('/api/wallpapers');
      if (data && Array.isArray(data.wallpapers)) {
        const cleanWallpapers = data.wallpapers.filter(w => !String(w.id || '').startsWith('series-'));
        setWallpapers(cleanWallpapers);
        try {
          localStorage.setItem('mk_wallpapers_v1', JSON.stringify(cleanWallpapers));
        } catch {}
      }
    } catch {
      // Quietly fallback to localStorage cache when API is unavailable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallpapers();
    const handleSync = () => fetchWallpapers();
    window.addEventListener('mk-wallpapers-updated', handleSync);
    return () => window.removeEventListener('mk-wallpapers-updated', handleSync);
  }, []);

  const visibleSeries = useMemo(() => {
    return showNsfw ? seriesList : seriesList.filter(s => !isSeries18Plus(s));
  }, [seriesList, showNsfw]);

  // Sadece yönetim panelinden yüklenen gerçek wallpaperlar gösterilir (seri kapakları/bannerları dahil edilmez)
  const allDisplayWallpapers = useMemo(() => {
    const nsIdSet = new Set(
      seriesList.filter(s => !showNsfw && isSeries18Plus(s)).map(s => s.id)
    );

    return wallpapers.filter(w => {
      if (String(w.id || '').startsWith('series-')) return false;
      if (!showNsfw && w.seriesId && nsIdSet.has(w.seriesId)) return false;
      return true;
    });
  }, [wallpapers, showNsfw, seriesList]);

  // Count wallpapers per series
  const wallpaperCountBySeries = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of allDisplayWallpapers) {
      if (w.seriesId) {
        counts[w.seriesId] = (counts[w.seriesId] || 0) + 1;
      } else if (w.seriesTitle) {
        const matched = seriesList.find(
          s => normalizeSearchText(s.title) === normalizeSearchText(w.seriesTitle)
        );
        if (matched) {
          counts[matched.id] = (counts[matched.id] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allDisplayWallpapers, seriesList]);

  // Filtered and sorted wallpapers
  const filteredWallpapers = useMemo(() => {
    const q = normalizeSearchText(searchQuery);

    const list = allDisplayWallpapers.filter(w => {
      if (selectedSeriesId !== 'all') {
        const matchesId = w.seriesId === selectedSeriesId;
        const selectedSeriesObj = visibleSeries.find(s => s.id === selectedSeriesId);
        const matchesTitle =
          selectedSeriesObj &&
          normalizeSearchText(w.seriesTitle) === normalizeSearchText(selectedSeriesObj.title);
        if (!matchesId && !matchesTitle) return false;
      }

      if (selectedCategory !== 'all' && w.category !== selectedCategory) {
        return false;
      }

      if (q) {
        const titleMatch = normalizeSearchText(w.title).includes(q);
        const seriesMatch = normalizeSearchText(w.seriesTitle).includes(q);
        const tagMatch = (w.tags || []).some(t => normalizeSearchText(t).includes(q));
        if (!titleMatch && !seriesMatch && !tagMatch) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'az') return (a.seriesTitle || a.title).localeCompare(b.seriesTitle || b.title, 'tr');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [allDisplayWallpapers, searchQuery, selectedSeriesId, selectedCategory, sortBy, visibleSeries]);

  const activeSeriesObj = useMemo(() => {
    if (selectedSeriesId === 'all') return null;
    return visibleSeries.find(s => s.id === selectedSeriesId) || null;
  }, [selectedSeriesId, visibleSeries]);

  const filteredDropdownSeries = useMemo(() => {
    const q = normalizeSearchText(seriesDropdownSearch);
    if (!q) return visibleSeries;
    return visibleSeries.filter(s => normalizeSearchText(s.title).includes(q));
  }, [visibleSeries, seriesDropdownSearch]);

  const filteredUploadSeries = useMemo(() => {
    const q = normalizeSearchText(uploadSeriesSearch);
    if (!q) return seriesList;
    return seriesList.filter(s => normalizeSearchText(s.title).includes(q));
  }, [seriesList, uploadSeriesSearch]);

  // Like a wallpaper
  const handleToggleLike = async (w: WallpaperItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isLiked = likedIds.includes(w.id);
    const nextLiked = isLiked ? likedIds.filter(id => id !== w.id) : [...likedIds, w.id];
    setLikedIds(nextLiked);
    try {
      localStorage.setItem('mk_liked_wallpapers', JSON.stringify(nextLiked));
    } catch {}

    const delta = isLiked ? -1 : 1;
    setWallpapers(prev => {
      const updated = prev.map(item =>
        item.id === w.id ? { ...item, likes: Math.max(0, (item.likes || 0) + delta) } : item
      );
      try {
        localStorage.setItem('mk_wallpapers_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activeWallpaper?.id === w.id) {
      setActiveWallpaper(prev =>
        prev ? { ...prev, likes: Math.max(0, (prev.likes || 0) + delta) } : null
      );
    }

    if (!w.id.startsWith('series-')) {
      safeFetchWallpapersJson('/api/wallpapers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: w.id, action: isLiked ? 'unlike' : 'like' })
      }).catch(() => {});
    }
  };

  // Download wallpaper
  const handleDownloadWallpaper = async (w: WallpaperItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDownloadingId(w.id);

    const safeName = (w.seriesTitle || w.title || 'mikrokosmos-wallpaper')
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const fileName = `${safeName}-${w.id.slice(-5)}.jpg`;

    try {
      const response = await fetch(w.imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast({
        title: 'İndirme Başladı',
        message: `"${w.seriesTitle || w.title}" duvar kağıdı cihazınıza indiriliyor.`,
        type: 'success'
      });
    } catch {
      // Fallback for cross-origin images that block CORS blob fetch: use canvas or direct link
      const link = document.createElement('a');
      link.href = w.imageUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast({
        title: 'Görsel Açıldı',
        message: 'Görsele basılı tutarak veya sağ tıklayarak kaydedebilirsiniz.',
        type: 'info'
      });
    } finally {
      setIsDownloadingId(null);
    }

    // Increment download counter
    setWallpapers(prev => {
      const updated = prev.map(item =>
        item.id === w.id ? { ...item, downloads: (item.downloads || 0) + 1 } : item
      );
      try {
        localStorage.setItem('mk_wallpapers_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (activeWallpaper?.id === w.id) {
      setActiveWallpaper(prev =>
        prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null
      );
    }

    if (!w.id.startsWith('series-')) {
      safeFetchWallpapersJson('/api/wallpapers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: w.id, action: 'download' })
      }).catch(() => {});
    }
  };

  // Admin: Handle file selection with automatic aspect ratio detection
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let detected: WallpaperCategory = 'genel';
        if (img.height > img.width * 1.15) {
          detected = 'mobil';
        } else if (img.width > img.height * 1.15) {
          detected = 'masaustu';
        } else {
          detected = 'kare';
        }
        setPendingFiles(prev => [...prev, { file, previewUrl, detectedCategory: detected }]);
      };
      img.onerror = () => {
        setPendingFiles(prev => [...prev, { file, previewUrl, detectedCategory: 'mobil' }]);
      };
      img.src = previewUrl;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const item = prev[index];
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Helper to convert File to compressed high-quality base64 & upload to R2
  const uploadSingleImageFile = async (file: File): Promise<string> => {
    const base64DataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.88));
          } else {
            resolve(ev.target?.result as string);
          }
        };
        img.onerror = () => resolve(ev.target?.result as string);
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const data = await safeFetchWallpapersJson<{ url?: string }>('/api/upload/r2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64DataUrl,
        filename: `wallpaper_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      })
    });
    if (data?.url) return data.url;

    return base64DataUrl;
  };

  // Detect category from remote image URL
  const detectUrlCategory = (url: string): Promise<WallpaperCategory> => {
    return new Promise(resolve => {
      const img = new Image();
      const timer = setTimeout(() => resolve('mobil'), 2500);
      img.onload = () => {
        clearTimeout(timer);
        if (img.height > img.width * 1.15) resolve('mobil');
        else if (img.width > img.height * 1.15) resolve('masaustu');
        else resolve('kare');
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve('mobil');
      };
      img.src = url;
    });
  };

  // Submit new wallpapers (Sadece Admin Panelinden)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUploadInAdminPanel) return;

    const selectedSeries = seriesList.find(s => s.id === uploadSeriesId);
    const finalSeriesTitle = selectedSeries ? selectedSeries.title : customSeriesTitle.trim();

    if (!finalSeriesTitle) {
      showToast({
        title: 'Seri Seçilmedi',
        message: 'Lütfen mevcut serilerden birini seçin veya seri adını yazın.',
        type: 'warning'
      });
      return;
    }

    const parsedTags = uploadTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const baseTags = selectedSeries
      ? Array.from(new Set([...parsedTags, ...(selectedSeries.genres || []).slice(0, 3)]))
      : parsedTags;

    const newItems: WallpaperItem[] = [];
    setIsUploading(true);

    try {
      if (uploadMode === 'file') {
        if (pendingFiles.length === 0) {
          showToast({
            title: 'Görsel Seçilmedi',
            message: 'Lütfen yüklenecek en az 1 duvar kağıdı görseli seçin.',
            type: 'warning'
          });
          setIsUploading(false);
          return;
        }

        for (let i = 0; i < pendingFiles.length; i++) {
          const item = pendingFiles[i];
          setUploadProgressText(`Görsel yükleniyor (${i + 1} / ${pendingFiles.length})...`);
          const uploadedUrl = await uploadSingleImageFile(item.file);
          const cat: WallpaperCategory =
            uploadCategory === 'auto' ? item.detectedCategory : uploadCategory;

          newItems.push({
            id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
            title:
              uploadTitle.trim() ||
              `${finalSeriesTitle} ${pendingFiles.length > 1 ? `#${i + 1}` : 'Wallpaper'}`,
            imageUrl: uploadedUrl,
            seriesId: selectedSeries?.id || '',
            seriesTitle: finalSeriesTitle,
            category: cat,
            tags: baseTags,
            likes: 1,
            downloads: 0,
            uploadedBy: user?.name || 'Admin',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const urls = uploadUrlText
          .split('\n')
          .map(u => u.trim())
          .filter(u => u.startsWith('http') || u.startsWith('data:image') || u.startsWith('/api/'));

        if (urls.length === 0) {
          showToast({
            title: 'Geçerli Link Yok',
            message: 'Lütfen en az bir geçerli resim URL bağlantısı girin.',
            type: 'warning'
          });
          setIsUploading(false);
          return;
        }

        for (let i = 0; i < urls.length; i++) {
          setUploadProgressText(`Görsel kontrol ediliyor (${i + 1} / ${urls.length})...`);
          const url = urls[i];
          const cat: WallpaperCategory =
            uploadCategory === 'auto' ? await detectUrlCategory(url) : uploadCategory;

          newItems.push({
            id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
            title:
              uploadTitle.trim() ||
              `${finalSeriesTitle} ${urls.length > 1 ? `#${i + 1}` : 'Wallpaper'}`,
            imageUrl: url,
            seriesId: selectedSeries?.id || '',
            seriesTitle: finalSeriesTitle,
            category: cat,
            tags: baseTags,
            likes: 1,
            downloads: 0,
            uploadedBy: user?.name || 'Admin',
            createdAt: new Date().toISOString()
          });
        }
      }

      setUploadProgressText('Veritabanına kaydediliyor...');
      await safeFetchWallpapersJson('/api/wallpapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallpapers: newItems, adminEmail: user?.email || '' })
      });

      const updatedList = [...newItems, ...wallpapers];
      setWallpapers(updatedList);
      try {
        localStorage.setItem('mk_wallpapers_v1', JSON.stringify(updatedList));
      } catch {}
      window.dispatchEvent(new Event('mk-wallpapers-updated'));

      // Reset form
      pendingFiles.forEach(p => URL.revokeObjectURL(p.previewUrl));
      setPendingFiles([]);
      setUploadUrlText('');
      setUploadTitle('');
      setUploadTagsInput('');

      showToast({
        title: 'Wallpaper Yüklendi!',
        message: `${newItems.length} adet "${finalSeriesTitle}" duvar kağıdı galeriye eklendi.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'Yükleme Hatası',
        message: err?.message || 'Görsel yüklenirken bir sorun oluştu.',
        type: 'warning'
      });
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  // Delete wallpaper (Admin)
  const handleDeleteWallpaper = async (w: WallpaperItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;

    const updated = wallpapers.filter(item => item.id !== w.id);
    setWallpapers(updated);
    try {
      localStorage.setItem('mk_wallpapers_v1', JSON.stringify(updated));
    } catch {}

    if (activeWallpaper?.id === w.id) {
      setActiveWallpaper(null);
    }

    await safeFetchWallpapersJson(
      `/api/wallpapers?id=${encodeURIComponent(w.id)}&adminEmail=${encodeURIComponent(user?.email || '')}`,
      {
        method: 'DELETE'
      }
    );
    window.dispatchEvent(new Event('mk-wallpapers-updated'));
    showToast({
      title: 'Wallpaper Silindi',
      message: `"${w.title}" duvar kağıdı galeriden kaldırıldı.`,
      type: 'info'
    });
  };

  // Related wallpapers for Lightbox
  const relatedWallpapers = useMemo(() => {
    if (!activeWallpaper) return [];
    return allDisplayWallpapers
      .filter(
        w =>
          w.id !== activeWallpaper.id &&
          ((activeWallpaper.seriesId && w.seriesId === activeWallpaper.seriesId) ||
            normalizeSearchText(w.seriesTitle) === normalizeSearchText(activeWallpaper.seriesTitle))
      )
      .slice(0, 8);
  }, [activeWallpaper, allDisplayWallpapers]);

  const getCategoryBadge = (cat?: WallpaperCategory) => {
    switch (cat) {
      case 'mobil':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/90 text-purple-200 border border-purple-500/40 backdrop-blur-md">
            <Smartphone size={10} /> Mobil
          </span>
        );
      case 'masaustu':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/90 text-indigo-200 border border-indigo-500/40 backdrop-blur-md">
            <Monitor size={10} /> Masaüstü
          </span>
        );
      case 'kare':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-950/90 text-pink-200 border border-pink-500/40 backdrop-blur-md">
            <Square size={10} /> Avatar / Kare
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${isAdminPanel ? '' : 'max-w-7xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6'} space-y-5`}>
      {/* HERO & HEADER BAR */}
      <div className="relative rounded-3xl bg-gradient-to-br from-purple-950/90 via-gray-900 to-indigo-950/90 border border-purple-500/30 p-4 sm:p-6 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles size={12} className="text-pink-400" />
              <span>Pinterest Görünümlü HD Arşiv</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Duvar Kağıtları</span>
              <span className="text-xs sm:text-sm font-extrabold px-2.5 py-0.5 rounded-xl bg-purple-900/70 border border-purple-500/40 text-purple-200">
                {filteredWallpapers.length} Görsel
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Sitedeki mevcut serilerin telefon ve bilgisayar için yüksek çözünürlüklü duvar kağıtlarını keşfedin, seri adına göre arayın ve tek tıkla indirin.
            </p>
          </div>

          {canUploadInAdminPanel && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsUploadModalOpen(prev => !prev)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-900/50 border border-purple-400/40 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>{isUploadModalOpen ? 'Yükleme Panelini Gizle' : 'Yeni Wallpaper Yükle'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SADECE ADMIN PANELİNDE GÖRÜNEN YÜKLEME FORMU */}
        {canUploadInAdminPanel && isUploadModalOpen && (
          <div className="relative z-10 mt-6 pt-6 border-t border-purple-500/30 animate-fadeIn">
            <form onSubmit={handleUploadSubmit} className="bg-gray-950/90 border border-purple-500/40 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      Mevcut Seriye Wallpaper Yükle
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Sitedeki bir seriyi seçip cihazınızdan çoklu resim yükleyebilir veya resim linki yapıştırabilirsiniz.
                    </p>
                  </div>
                </div>
                {!isAdminPanel && (
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="p-1.5 rounded-xl bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column: Series Selection & Metadata */}
                <div className="space-y-4">
                  {/* 1. Select Existing Series */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-purple-200">
                      1. Sitedeki Mevcut Serilerden Seçin *
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={uploadSeriesSearch}
                          onChange={e => setUploadSeriesSearch(e.target.value)}
                          placeholder="Seri listesinde hızlı filtrele..."
                          className="w-full bg-gray-900 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto bg-gray-900/90 border border-gray-800 rounded-xl p-1.5 space-y-1">
                        {filteredUploadSeries.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-3">
                            Eşleşen seri bulunamadı. Aşağıya özel seri adı yazabilirsiniz.
                          </p>
                        ) : (
                          filteredUploadSeries.map(s => {
                            const isSelected = uploadSeriesId === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setUploadSeriesId(s.id);
                                  setCustomSeriesTitle('');
                                }}
                                className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg text-left transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-purple-600/30 border border-purple-400 text-white'
                                    : 'hover:bg-gray-800/80 text-gray-300 border border-transparent'
                                }`}
                              >
                                <img
                                  src={getOptimizedImageUrl(s.coverImage, 80)}
                                  onError={handleImageError}
                                  alt={s.title}
                                  className="w-7 h-9 object-cover rounded shrink-0 border border-purple-500/30"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold truncate">{s.title}</p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {s.type} • {(s.genres || []).slice(0, 2).join(', ')}
                                  </p>
                                </div>
                                {isSelected && <Check size={14} className="text-purple-300 shrink-0 mr-1" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Optional custom series name if not in list */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={customSeriesTitle}
                        onChange={e => {
                          setCustomSeriesTitle(e.target.value);
                          if (e.target.value.trim()) setUploadSeriesId('');
                        }}
                        placeholder="Veya listede olmayan özel bir seri adı yazın..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {/* 2. Optional Title & Device Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Görsel Başlığı (İsteğe Bağlı)
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={e => setUploadTitle(e.target.value)}
                        placeholder="Boş bırakılırsa seri adı yazılır"
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Boyut / Cihaz Türü
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={e => setUploadCategory(e.target.value as any)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="auto">✨ Otomatik Algıla (Önerilen)</option>
                        <option value="mobil">📱 Mobil / Telefon (Dikey)</option>
                        <option value="masaustu">💻 Masaüstü / PC (Yatay)</option>
                        <option value="kare">🖼️ Avatar / Kare</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Tags */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Arama Etiketleri / Karakter Adı (İsteğe Bağlı)
                    </label>
                    <input
                      type="text"
                      value={uploadTagsInput}
                      onChange={e => setUploadTagsInput(e.target.value)}
                      placeholder="Örn: Sung Jin-Woo, Karanlık, 4K, Fanart (virgülle ayırın)"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* Right Column: File Upload or URL Input */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
                      <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          uploadMode === 'file'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Upload size={14} />
                        <span>Cihazdan Çoklu Yükle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          uploadMode === 'url'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon size={14} />
                        <span>Resim URL / Link Ekle</span>
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFilesSelected}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/30 rounded-2xl p-5 text-center cursor-pointer transition space-y-2"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-300">
                            <FolderPlus size={22} />
                          </div>
                          <p className="text-xs sm:text-sm font-extrabold text-white">
                            Görselleri Seçmek İçin Tıklayın
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Tek seferde birden fazla wallpaper seçebilirsiniz (PNG, JPG, WEBP)
                          </p>
                        </div>

                        {pendingFiles.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-purple-200 font-bold">
                              <span>Seçilen Görseller ({pendingFiles.length})</span>
                              <button
                                type="button"
                                onClick={() => {
                                  pendingFiles.forEach(p => URL.revokeObjectURL(p.previewUrl));
                                  setPendingFiles([]);
                                }}
                                className="text-[11px] text-rose-400 hover:underline"
                              >
                                Tümünü Temizle
                              </button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                              {pendingFiles.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="relative group rounded-xl overflow-hidden border border-purple-500/30 bg-gray-900 aspect-[3/4]"
                                >
                                  <img
                                    src={item.previewUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePendingFile(idx)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-rose-400 hover:bg-rose-600 hover:text-white transition"
                                  >
                                    <X size={12} />
                                  </button>
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-purple-200">
                                    {item.detectedCategory === 'mobil'
                                      ? '📱 Dikey'
                                      : item.detectedCategory === 'masaustu'
                                      ? '💻 Yatay'
                                      : '🖼️ Kare'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-300">
                          Resim URL Bağlantıları (Her satıra 1 link yazarak toplu ekleyebilirsiniz)
                        </label>
                        <textarea
                          rows={6}
                          value={uploadUrlText}
                          onChange={e => setUploadUrlText(e.target.value)}
                          placeholder={'https://ornek.com/wallpaper1.jpg\nhttps://ornek.com/wallpaper2.png'}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>{uploadProgressText || 'Yükleniyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Seçili Seriye Wallpaperları Kaydet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* SEARCH & SERIES FILTER BAR */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="İstediğin serinin adını, karakteri veya etiketi ara..."
              className="w-full bg-gray-950 border border-purple-500/30 focus:border-purple-400 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Searchable Series Dropdown */}
          <div className="md:col-span-4 relative" ref={seriesDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSeriesDropdownOpen(prev => !prev)}
              className="w-full bg-gray-950 border border-purple-500/30 hover:border-purple-400/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white flex items-center justify-between gap-2 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen size={15} className="text-purple-400 shrink-0" />
                <span className="truncate font-bold">
                  {activeSeriesObj ? activeSeriesObj.title : 'Tüm Mevcut Seriler'}
                </span>
              </div>
              <ChevronDown
                size={15}
                className={`text-gray-400 shrink-0 transition-transform ${
                  isSeriesDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isSeriesDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-gray-950 border border-purple-500/40 rounded-2xl shadow-2xl p-2 space-y-2 max-h-80 flex flex-col">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={seriesDropdownSearch}
                    onChange={e => setSeriesDropdownSearch(e.target.value)}
                    placeholder="Seri adı yazın..."
                    autoFocus
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeriesId('all');
                      setIsSeriesDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedSeriesId === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    <span>Tüm Serileri Göster</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30">
                      {allDisplayWallpapers.length}
                    </span>
                  </button>

                  {filteredDropdownSeries.map(s => {
                    const count = wallpaperCountBySeries[s.id] || 0;
                    const isSelected = selectedSeriesId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSeriesId(s.id);
                          setIsSeriesDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-1.5 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600/30 border border-purple-400 text-white'
                            : 'hover:bg-gray-900 text-gray-200'
                        }`}
                      >
                        <img
                          src={getOptimizedImageUrl(s.coverImage, 80)}
                          onError={handleImageError}
                          alt={s.title}
                          className="w-7 h-9 object-cover rounded-lg shrink-0 border border-purple-500/30"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{s.title}</p>
                          <p className="text-[10px] text-gray-400">{s.type}</p>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/40 shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3">
            <div className="relative">
              <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full bg-gray-950 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="newest">Sırala: En Yeniler</option>
                <option value="popular">Sırala: En Çok Beğenilen</option>
                <option value="downloads">Sırala: En Çok İndirilen</option>
                <option value="az">Sırala: Seri Adı (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Horizontal Quick Series Visual Strip */}
        {visibleSeries.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5">
              <button
                onClick={() => setSelectedSeriesId('all')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition shrink-0 cursor-pointer ${
                  selectedSeriesId === 'all'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400/50'
                    : 'bg-gray-950 text-gray-300 hover:text-white border border-gray-800'
                }`}
              >
                <Sparkles size={13} />
                <span>Tümü ({allDisplayWallpapers.length})</span>
              </button>

              {visibleSeries.map(s => {
                const isSelected = selectedSeriesId === s.id;
                const count = wallpaperCountBySeries[s.id] || 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeriesId(isSelected ? 'all' : s.id)}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-md'
                        : 'bg-gray-950/90 hover:bg-gray-800 text-gray-300 border-gray-800'
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(s.coverImage, 60)}
                      onError={handleImageError}
                      alt={s.title}
                      className="w-5 h-5 rounded-full object-cover border border-purple-400/40 shrink-0"
                    />
                    <span className="max-w-[140px] truncate">{s.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950/90 text-purple-300 font-extrabold">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Device / Aspect Ratio Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tüm Boyutlar', icon: ImageIcon },
              { id: 'mobil', label: 'Mobil (Dikey)', icon: Smartphone },
              { id: 'masaustu', label: 'Masaüstü (Yatay)', icon: Monitor },
              { id: 'kare', label: 'Profil / Kare', icon: Square }
            ].map(tab => {
              const Icon = tab.icon;
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {(selectedSeriesId !== 'all' || searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedSeriesId('all');
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <X size={13} />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* SELECTED SERIES INFO BANNER */}
      {activeSeriesObj && (
        <div className="bg-gradient-to-r from-purple-950/80 via-gray-900 to-indigo-950/80 border border-purple-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={getOptimizedImageUrl(activeSeriesObj.coverImage, 120)}
              onError={handleImageError}
              alt={activeSeriesObj.title}
              className="w-12 h-16 object-cover rounded-xl border border-purple-400/40 shrink-0 shadow"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-600/30 text-purple-200 border border-purple-500/40">
                  {activeSeriesObj.type}
                </span>
                <span className="text-xs text-gray-400 font-semibold">
                  {filteredWallpapers.length} Duvar Kağıdı
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black text-white truncate mt-0.5">
                {activeSeriesObj.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canUploadInAdminPanel && (
              <button
                onClick={() => {
                  setUploadSeriesId(activeSeriesObj.id);
                  setIsUploadModalOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Bu Seriye Yükle</span>
              </button>
            )}
            <button
              onClick={() => setView({ type: 'series-detail', seriesId: activeSeriesObj.id })}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <BookOpen size={14} />
              <span>Seri Sayfasına Git</span>
            </button>
          </div>
        </div>
      )}

      {/* PINTEREST MASONRY GALLERY */}
      {isLoading ? (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3.5 space-y-3.5">
          {[260, 340, 220, 380, 290, 320, 240, 360, 280, 310].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}px` }}
              className="break-inside-avoid rounded-2xl bg-gray-900/90 border border-purple-500/15 animate-pulse"
            />
          ))}
        </div>
      ) : filteredWallpapers.length === 0 ? (
        <div className="bg-gray-900/80 border border-purple-500/20 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
            <ImageIcon size={30} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white">
              {allDisplayWallpapers.length === 0
                ? 'Henüz Duvar Kağıdı Yüklenmedi'
                : 'Aradığınız Kriterde Duvar Kağıdı Bulunamadı'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
              {allDisplayWallpapers.length === 0
                ? 'Yönetici panelinden serilere ait özel duvar kağıtları yüklendiğinde burada Pinterest görünümüyle listelenecektir.'
                : 'Farklı bir seri adı arayabilir veya filtreleri sıfırlayarak tüm koleksiyonu görüntüleyebilirsiniz.'}
            </p>
          </div>
          {(selectedSeriesId !== 'all' || searchQuery || selectedCategory !== 'all') && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedSeriesId('all');
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold transition cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
          {filteredWallpapers.map(w => {
            const isLiked = likedIds.includes(w.id);
            const isDownloading = isDownloadingId === w.id;
            return (
              <div
                key={w.id}
                onClick={() => setActiveWallpaper(w)}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-gray-900 border border-purple-500/20 hover:border-purple-400/70 shadow-lg hover:shadow-purple-950/60 transition-all duration-300 cursor-pointer"
              >
                {/* Image with natural Pinterest aspect ratio */}
                <img
                  src={getOptimizedImageUrl(w.imageUrl, 600)}
                  onError={handleImageError}
                  alt={w.title || w.seriesTitle}
                  loading="lazy"
                  className="w-full h-auto block object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                  <div>{getCategoryBadge(w.category)}</div>
                  <div className="flex items-center gap-1 pointer-events-auto">
                    {isAdmin && !w.id.startsWith('series-') && (
                      <button
                        onClick={e => handleDeleteWallpaper(w, e)}
                        className="p-1.5 rounded-full bg-black/75 hover:bg-rose-600 text-rose-300 hover:text-white border border-white/10 transition shadow"
                        title="Bu Wallpaper'ı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hover / Bottom Gradient Overlay (Pinterest style) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <div className="space-y-2">
                    {/* Series Pill */}
                    {w.seriesTitle && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (w.seriesId) {
                            setSelectedSeriesId(w.seriesId);
                          } else {
                            setSearchQuery(w.seriesTitle);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-600/80 hover:bg-purple-500 text-white text-[10px] font-extrabold max-w-full truncate shadow"
                        title={`${w.seriesTitle} serisinin tüm duvar kağıtlarını filtrele`}
                      >
                        <BookOpen size={10} className="shrink-0" />
                        <span className="truncate">{w.seriesTitle}</span>
                      </button>
                    )}

                    {/* Title & Action Buttons */}
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-xs font-bold text-white line-clamp-1">
                        {w.title || w.seriesTitle}
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={e => handleToggleLike(w, e)}
                          className={`p-2 rounded-full backdrop-blur-md border transition active:scale-90 ${
                            isLiked
                              ? 'bg-rose-600 text-white border-rose-400'
                              : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
                          }`}
                          title="Beğen"
                        >
                          <Heart size={13} className={isLiked ? 'fill-current' : ''} />
                        </button>

                        <button
                          onClick={e => handleDownloadWallpaper(w, e)}
                          disabled={isDownloading}
                          className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/50 shadow-lg transition active:scale-90"
                          title="HD İndir"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PINTEREST FULL-SCREEN LIGHTBOX MODAL */}
      {activeWallpaper && (
        <div
          onClick={() => setActiveWallpaper(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-gray-950 border border-purple-500/40 rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col"
          >
            {/* Top Modal Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900/90 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {getCategoryBadge(activeWallpaper.category)}
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  {activeWallpaper.title || activeWallpaper.seriesTitle}
                </h3>
              </div>
              <button
                onClick={() => setActiveWallpaper(null)}
                className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* High-Res Image Preview */}
                <div className="lg:col-span-7 bg-black/60 border border-gray-800 rounded-2xl p-2 flex items-center justify-center">
                  <img
                    src={activeWallpaper.imageUrl}
                    onError={handleImageError}
                    alt={activeWallpaper.title}
                    className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
                  />
                </div>

                {/* Details & Actions Column */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
                      Mikrokosmos Wallpaper Koleksiyonu
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black text-white">
                      {activeWallpaper.title || activeWallpaper.seriesTitle}
                    </h2>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={e => handleDownloadWallpaper(activeWallpaper, e)}
                      disabled={isDownloadingId === activeWallpaper.id}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-950/60 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      <Download size={16} />
                      <span>
                        {isDownloadingId === activeWallpaper.id ? 'İndiriliyor...' : 'HD Orijinal İndir'}
                      </span>
                    </button>

                    <button
                      onClick={e => handleToggleLike(activeWallpaper, e)}
                      className={`px-4 py-3 rounded-xl font-extrabold text-xs sm:text-sm border flex items-center gap-1.5 transition cursor-pointer ${
                        likedIds.includes(activeWallpaper.id)
                          ? 'bg-rose-600 text-white border-rose-400'
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-200 border-gray-800'
                      }`}
                    >
                      <Heart
                        size={16}
                        className={likedIds.includes(activeWallpaper.id) ? 'fill-current' : ''}
                      />
                      <span>{activeWallpaper.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeWallpaper.imageUrl);
                        showToast({
                          title: 'Link Kopyalandı',
                          message: 'Görsel bağlantısı panoya kopyalandı.',
                          type: 'success'
                        });
                      }}
                      className="p-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition cursor-pointer"
                      title="Görsel Linkini Kopyala"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Linked Series Card */}
                  {activeWallpaper.seriesTitle && (
                    <div className="bg-gray-900/90 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                        İlgili Seri
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-white truncate">
                            {activeWallpaper.seriesTitle}
                          </h4>
                          <p className="text-xs text-gray-400">
                            Bu serinin tüm duvar kağıtlarını görüntüleyin veya bölümlerini okuyun.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (activeWallpaper.seriesId) {
                              setSelectedSeriesId(activeWallpaper.seriesId);
                            } else {
                              setSearchQuery(activeWallpaper.seriesTitle);
                            }
                            setActiveWallpaper(null);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Filter size={13} />
                          <span>Serinin Wallpaperları</span>
                        </button>

                        {activeWallpaper.seriesId &&
                          seriesList.some(s => s.id === activeWallpaper.seriesId) && (
                            <button
                              onClick={() => {
                                const sid = activeWallpaper.seriesId!;
                                setActiveWallpaper(null);
                                setView({ type: 'series-detail', seriesId: sid });
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <BookOpen size={13} />
                              <span>Seriyi Oku</span>
                            </button>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {activeWallpaper.tags && activeWallpaper.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-gray-400">Etiketler</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeWallpaper.tags.map((tag, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchQuery(tag);
                              setActiveWallpaper(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-purple-950 text-gray-300 hover:text-purple-200 border border-gray-800 text-[11px] font-semibold transition cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAdmin && !activeWallpaper.id.startsWith('series-') && (
                    <div className="pt-2 border-t border-gray-800">
                      <button
                        onClick={e => handleDeleteWallpaper(activeWallpaper, e)}
                        className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>Bu Duvar Kağıdını Kalıcı Olarak Sil</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Wallpapers of the Same Series */}
              {relatedWallpapers.length > 0 && (
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <h4 className="text-xs sm:text-sm font-extrabold text-purple-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400" />
                    <span>{activeWallpaper.seriesTitle} — Diğer Duvar Kağıtları</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {relatedWallpapers.map(rw => (
                      <div
                        key={rw.id}
                        onClick={() => setActiveWallpaper(rw)}
                        className="group relative rounded-xl overflow-hidden bg-gray-900 border border-purple-500/20 hover:border-purple-400 cursor-pointer aspect-[3/4]"
                      >
                        <img
                          src={getOptimizedImageUrl(rw.imageUrl, 300)}
                          onError={handleImageError}
                          alt={rw.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
