import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { viewToHash } from '../context/AppContext';

export const SeoManager: React.FC = () => {
  const { view, seriesList } = useApp();

  useEffect(() => {
    // Helper to safely set or create meta tags in <head>
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const setCanonical = (url: string) => {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    const setJsonLd = (id: string, data: object) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };

    const baseUrl = window.location.origin || 'https://mikrokosmosfansub.com';
    const currentHash = viewToHash(view);
    const fullUrl = `${baseUrl}/${currentHash}`;

    // Base defaults
    let pageTitle = 'Mikrokosmos Fansub - Türkçe Webtoon, Manga ve Web Novel Oku';
    let pageDescription = 'Mikrokosmos Fansub ile en popüler Türkçe Webtoon, Manga ve Web Novel serilerini ücretsiz, güncel ve yüksek kalitede oku.';
    let ogImage = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80';
    let isReaderMode = false;
    let schemaData: any = null;

    if (view.type === 'home') {
      pageTitle = 'Mikrokosmos Fansub - Türkçe Webtoon, Manga ve Web Novel Oku';
      pageDescription = 'En güncel Türkçe Manhwa, Manga, Webtoon ve Web Novel bölümlerini kesintisiz oku. Aktif topluluk ve zengin arşiv.';
      schemaData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Mikrokosmos Fansub',
        url: baseUrl,
        description: pageDescription,
        inLanguage: 'tr-TR'
      };
    } else if (view.type === 'series-detail') {
      const currentSeries = seriesList.find(s => s.id === view.seriesId);
      if (currentSeries) {
        pageTitle = `${currentSeries.title} Türkçe Oku - Bölüm Listesi & Konusu | Mikrokosmos Fansub`;
        pageDescription = currentSeries.synopsis
          ? `${currentSeries.title}: ${currentSeries.synopsis.slice(0, 150)}...`
          : `${currentSeries.title} Türkçe ${currentSeries.type} serisini tüm bölümleriyle Mikrokosmos Fansub'da oku.`;
        if (currentSeries.coverImage) {
          ogImage = currentSeries.coverImage;
        }

        schemaData = {
          '@context': 'https://schema.org',
          '@type': currentSeries.type === 'Web Novel' ? 'Book' : 'ComicSeries',
          name: currentSeries.title,
          description: currentSeries.synopsis || pageDescription,
          image: currentSeries.coverImage,
          genre: currentSeries.genres || [],
          author: {
            '@type': 'Person',
            name: currentSeries.author || 'Mikrokosmos'
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: currentSeries.rating || 5.0,
            bestRating: '10',
            worstRating: '1',
            ratingCount: '250'
          },
          url: fullUrl
        };
      }
    } else if (view.type === 'reader') {
      // CRITICAL: GOOGLE AND BOTS MUST NOT INDEX/CRAWL CHAPTER READING PAGES!
      isReaderMode = true;
      const targetSeries = seriesList.find(s => s.id === view.seriesId);
      const targetChapter = targetSeries?.chapters.find(c => c.id === view.chapterId);

      const chapterName = targetChapter?.title || (targetChapter?.number ? `Bölüm ${targetChapter.number}` : 'Bölüm');
      pageTitle = `${targetSeries?.title || 'Seri'} - ${chapterName} Oku | Mikrokosmos Fansub`;
      pageDescription = `${targetSeries?.title || 'Seri'} ${chapterName} Türkçe oku.`;

      // Canonical points to series detail to aggregate link equity away from chapter
      setCanonical(`${baseUrl}/#/seri/${encodeURIComponent(view.seriesId)}`);
    } else if (view.type === 'categories') {
      const genreName = view.genre ? `${view.genre} Türündeki` : 'Tüm Türlerdeki';
      pageTitle = `${genreName} Webtoon ve Web Noveller | Mikrokosmos Fansub`;
      pageDescription = `Mikrokosmos Fansub kategoriler listesi: ${view.genre || 'Aksiyon, Romantizm, Fantastik, Drama, Isekai'}.`;
    } else if (view.type === 'series-list') {
      pageTitle = 'Tüm Seriler - Webtoon & Web Novel Arşivi | Mikrokosmos Fansub';
      pageDescription = 'Mikrokosmos Fansub bünyesinde çevrilen ve yayınlanan tüm Manhwa, Manga ve Web Novel serilerinin tam listesi.';
    } else if (view.type === 'az-list') {
      pageTitle = 'A-Z Seriler Dizini | Mikrokosmos Fansub';
      pageDescription = 'Mikrokosmos Fansub serilerini alfabetik sıraya göre inceleyin.';
    } else if (view.type === 'schedule') {
      pageTitle = 'Haftalık Yayın Takvimi | Mikrokosmos Fansub';
      pageDescription = 'Yeni Webtoon ve Web Novel bölümlerinin yayınlanma günleri ve saatleri.';
    } else if (view.type === 'lessons') {
      pageTitle = 'Mobil Manhwa Editörlük Rehberi & Dersler | Mikrokosmos Fansub';
      pageDescription = 'Telefonda Photoshop, Ibis Paint ve Cropybara ile profesyonel manhwa editörlüğü videolu rehberi ve dersleri.';
    } else if (view.type === 'social-media') {
      pageTitle = 'Sosyal Medya Hesaplarımız | Mikrokosmos Fansub';
      pageDescription = 'Mikrokosmos Fansub sosyal medya hesapları. Discord, Instagram, WhatsApp ve TikTok hesaplarımızı takip edin.';
    } else if (view.type === 'library') {
      pageTitle = 'Kitaplığım & Favorilerim | Mikrokosmos Fansub';
      isReaderMode = true; // Private user page - no need for bot index
    } else if (view.type === 'admin') {
      pageTitle = 'Yönetici Paneli | Mikrokosmos Fansub';
      isReaderMode = true; // Admin area - strictly noindex
    }

    // Apply Document Title
    document.title = pageTitle;

    // Apply Meta Tags
    setMetaTag('name', 'description', pageDescription);
    setMetaTag('name', 'title', pageTitle);
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', fullUrl);
    setMetaTag('property', 'twitter:title', pageTitle);
    setMetaTag('property', 'twitter:description', pageDescription);
    setMetaTag('property', 'twitter:image', ogImage);

    if (!isReaderMode) {
      setCanonical(fullUrl);
      // Allow indexing for Home, Series Detail, Categories, Lists
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setMetaTag('name', 'googlebot', 'index, follow');
    } else {
      // STRICT BLOCK FOR BOTS ON CHAPTER READER / ADMIN / PRIVATE PAGES
      setMetaTag('name', 'robots', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
      setMetaTag('name', 'googlebot', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    }

    // Dynamic Schema.org JSON-LD
    if (schemaData) {
      setJsonLd('dynamic-seo-schema', schemaData);
    } else {
      const existingScript = document.getElementById('dynamic-seo-schema');
      if (existingScript) existingScript.remove();
    }
  }, [view, seriesList]);

  return null;
};
