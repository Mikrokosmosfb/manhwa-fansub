import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Smartphone,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Type,
  Video,
  CheckCircle2,
  Circle,
  MessageSquare,
  UserPlus,
  Info,
  AlertTriangle,
  FileText,
  Search,
  BookOpen,
  ArrowRight,
  Palette,
  Eye,
  Check,
  Share2
} from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  desc: string;
  note?: string;
  previewUrl: string;
  driveUrl: string;
  duration?: string;
  tag: string;
}

const LESSONS_DATA: Lesson[] = [
  {
    id: 1,
    title: '1. Ders: Bölümleri İndirip Cropybara ile Birleştirmek',
    desc: 'Bölümleri indirip Cropybara ile birleştirmek. Eğer bizim fansubda editörlük yapıyorsanız serinin orijinal kaynak resimleri bizim tarafımızdan size veriliyor.',
    note: 'Değilseniz de internetten arayarak bulabilirsiniz kaynak resimlerini. Eğer fansubunuz tarafından size kaynak sunulmamışsa resimleri toplu olarak indirmek isterseniz UC Browser kullanabilirsiniz. (Bununla indirme yaparken iyice kontrol etmek önemlidir. Bazen açılmayan görselleri atlayabilir.)',
    previewUrl: 'https://drive.google.com/file/d/13y9pQa7tlfmvs_YLrJ8sAc8L9qaEygLL/preview',
    driveUrl: 'https://drive.google.com/file/d/13y9pQa7tlfmvs_YLrJ8sAc8L9qaEygLL/view?usp=drivesdk',
    duration: 'Temel',
    tag: 'Hazırlık & Birleştirme'
  },
  {
    id: 2,
    title: '2. Ders: Zip Dosyasını Açıp Ibis Paint\'e Aktarmak',
    desc: 'Cropybara\'dan indirdiğimiz zip dosyasını açıp resimleri Ibis Paint\'e geçiriyoruz. Yeni nesil telefonların çoğu zip dosyalarını kendisi açabiliyor. Bu yüzden kolayca dosyayı dışarı aktarabilirsiniz.',
    note: 'Zip dosyasını telefonunuz açmıyorsa Play Store\'dan herhangi bir zip açma uygulamasıyla işinizi halledebilirsiniz. Örnek olarak RAR uygulamasını söyleyebiliriz.',
    previewUrl: 'https://drive.google.com/file/d/15UufnNt6cgXg40gf5Y7tEKWE6_mNEChC/preview',
    driveUrl: 'https://drive.google.com/file/d/15UufnNt6cgXg40gf5Y7tEKWE6_mNEChC/view?usp=drivesdk',
    duration: 'Temel',
    tag: 'Dosya Yönetimi'
  },
  {
    id: 3,
    title: '3. Ders: Photoshop\'a Geçiş ve Yazı Temizliği',
    desc: 'Ibis Paint\'e resimleri aktardıktan sonra Photoshop\'a geçiş yapacağız. Yazıların temizlenmesi için. Photoshop\'ta ilk önce hesap açmayı unutmayın. Ücretsizdir.',
    previewUrl: 'https://drive.google.com/file/d/1izfV3LfhtQMJ5OJFZ3hKoBS8h1DvevGW/preview',
    driveUrl: 'https://drive.google.com/file/d/1izfV3LfhtQMJ5OJFZ3hKoBS8h1DvevGW/view?usp=drivesdk',
    duration: 'Önemli',
    tag: 'Cleaning'
  },
  {
    id: 4,
    title: '4. Ders: Fontları Ibis Paint X\'e Yüklemek',
    desc: 'Şimdi en başta verdiğim linkten fontları indirin. Sonra bu videoyu izleyerek fontları tek tek Ibis Paint\'e geçirin. Toplu yapmayın, tek tek geçirmeniz gerekiyor.',
    previewUrl: 'https://drive.google.com/file/d/15CjZMMDdhIe6v-gtjQLiSAOoChsdIbmn/preview',
    driveUrl: 'https://drive.google.com/file/d/15CjZMMDdhIe6v-gtjQLiSAOoChsdIbmn/view?usp=drivesdk',
    duration: 'Temel',
    tag: 'Font Kurulumu'
  },
  {
    id: 5,
    title: '5. Ders: Temizlenen Sayfaları Orijinaline Hizalamak',
    desc: 'Fontları Ibis Paint\'e geçirdikten sonra şimdi temizlediğimiz bölümleri ilk başta eklediğimiz İngilizce veya Korece olan sayfaların üstüne getirip edite başlıyoruz. Unutmayın temizlenen sayfaları onlarla eşleşen yani aynı sayfaların üstüne yerleştirmeliyiz.',
    previewUrl: 'https://drive.google.com/file/d/1R_EERzXi81ZsUu5OwZGQEkYrl1qfws4v/preview',
    driveUrl: 'https://drive.google.com/file/d/1R_EERzXi81ZsUu5OwZGQEkYrl1qfws4v/view?usp=drivesdk',
    duration: 'Uygulama',
    tag: 'Hizalama'
  },
  {
    id: 6,
    title: '6. Ders: Renk Geçişli Temel SFX Yapımı',
    desc: 'Şimdi ise temel olan SFX\'leri yapmayı öğreniyoruz. Temel SFX diyorum çünkü daha birçok SFX türü var. Renk geçişli (bu videoda var), blurlu, hareketli, ışıltılı, gölgeli, içi hatlı, opak olanı ve daha niceleri. Bu SFX\'leri yapmayı sırasıyla öğreneceğiz. Ama ilk önce en çok kullanılan renk geçişli SFX\'leri öğreniyoruz.',
    previewUrl: 'https://drive.google.com/file/d/1ui5ugXq4n1rz7CR3uWiEDtkOfrg2TzE5/preview',
    driveUrl: 'https://drive.google.com/file/d/1ui5ugXq4n1rz7CR3uWiEDtkOfrg2TzE5/view?usp=drivesdk',
    duration: 'İleri Seviye',
    tag: 'SFX Efektleri'
  }
];

export const LessonsView: React.FC = () => {
  const { setView } = useApp();
  const [completedLessons, setCompletedLessons] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('mikro_completed_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'apps' | 'layers' | 'rules' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mikro_completed_lessons', JSON.stringify(completedLessons));
    } catch (e) {
      console.error(e);
    }
  }, [completedLessons]);

  const toggleLessonComplete = (id: number) => {
    setCompletedLessons(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredLessons = LESSONS_DATA.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completionPercentage = Math.round((completedLessons.length / LESSONS_DATA.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 animate-fadeIn pb-24">
      
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between text-xs text-purple-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView({ type: 'home' })}
            className="hover:text-purple-100 transition flex items-center gap-1"
          >
            Ana Sayfa
          </button>
          <span>/</span>
          <span className="text-purple-100 font-bold flex items-center gap-1.5">
            <GraduationCap size={15} className="text-purple-400" />
            Editörlük Dersleri
          </span>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 px-3 py-1.5 rounded-lg text-purple-200 transition"
        >
          {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          <span>{copiedLink ? 'Kopyalandı!' : 'Paylaş'}</span>
        </button>
      </div>

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900/60 to-indigo-950 border border-purple-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 text-center sm:text-left">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-black tracking-wide uppercase">
            <Smartphone size={14} className="text-purple-300" />
            Mobil Uyumlu Manhwa Editörlük Rehberi
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            📱 Telefonda Profesyonel Manhwa Editörlüğü
          </h1>

          <p className="text-sm sm:text-base text-purple-200 max-w-3xl leading-relaxed">
            &ldquo;Editör olmak istiyorum ama bilgisayarım yok&rdquo; ya da &ldquo;Bilgisayar başına geçmeye üşeniyorum&rdquo; diyorsanız doğru yerdesiniz. Telefonlar artık cebimizde taşıdığımız minik birer tasarım stüdyosu. Bu rehberde sıfırdan başlayıp telefonda nasıl temiz ve profesyonel manhwa editi yapacağınızı adım adım öğreneceksiniz.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <a
              href="https://discord.gg/mikrokosmos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition active:scale-95 text-sm"
            >
              <MessageSquare size={17} />
              <span>💜 Discord Sunucumuza Katıl</span>
            </a>

            <button
              onClick={() => setView({ type: 'join-team' })}
              className="inline-flex items-center gap-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white font-bold px-5 py-3 rounded-xl shadow transition active:scale-95 text-sm"
            >
              <UserPlus size={17} />
              <span>Ekibimize Başvur</span>
            </button>
          </div>

          {/* Lesson Completion Progress Card */}
          <div className="mt-6 pt-6 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-800/60 border border-purple-400/30 flex items-center justify-center text-purple-200">
                <Video size={20} />
              </div>
              <div>
                <div className="text-xs text-purple-300 font-semibold">Video Ders İlerlemeniz</div>
                <div className="text-sm font-bold text-white">
                  {completedLessons.length} / {LESSONS_DATA.length} Ders Tamamlandı ({completionPercentage}%)
                </div>
              </div>
            </div>

            <div className="w-full sm:w-64 h-3 bg-purple-950 rounded-full overflow-hidden border border-purple-500/30 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'all', label: 'Tüm Rehber', icon: BookOpen },
          { id: 'apps', label: '1. Gerekli Uygulamalar', icon: Smartphone },
          { id: 'layers', label: '2. Katman & Temel Mantık', icon: Layers },
          { id: 'rules', label: '3-6. Temizlik & Fontlar', icon: Type },
          { id: 'videos', label: '🎥 Videolu Dersler (1-6)', icon: Video }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition border ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-900/40'
                  : 'bg-gray-900/80 text-purple-200 border-purple-500/20 hover:bg-purple-950 hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GEREKLİ UYGULAMALAR */}
      {(activeTab === 'all' || activeTab === 'apps') && (
        <section className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-500/30">
                <Smartphone size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">1. Gerekli Uygulamalar ve Araçlar</h2>
                <p className="text-xs text-purple-300">Telefonda edit yaparken ihtiyacımız olan temel uygulamalar ve paketler</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Cropybara */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-400/60 transition group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cropybara
                  </h3>
                  <span className="text-[10px] bg-purple-800/60 text-purple-200 px-2 py-0.5 rounded font-bold">Web Aracı</span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Yüklediğimiz manhwa resimlerini en net, kayıpsız ve doğru dikey sırada birleştirmek için kullanılır.
                </p>
              </div>
              <a
                href="https://cropybara.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
              >
                <span>Siteye Git</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Photoshop Mobile */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-400/60 transition group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Photoshop Mobile
                  </h3>
                  <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded font-bold">Mobil Uygulama</span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Balonlardaki yabancı yazıları ve SFX&apos;leri temizlemek için. İlk girişte ücretsiz hesap açabilirsiniz.
                </p>
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=com.adobe.photoshop.retail"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
              >
                <span>Play Store&apos;dan İndir</span>
                <Download size={14} />
              </a>
            </div>

            {/* Ibis Paint X */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-400/60 transition group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    Ibis Paint X
                  </h3>
                  <span className="text-[10px] bg-pink-900/60 text-pink-200 px-2 py-0.5 rounded font-bold">Mobil Çizim</span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Resimdeki bozuk yerleri onarmak, Türkçe fontları yazmak ve SFX&apos;leri katmanlı yerleştirmek için.
                </p>
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=jp.ne.ibis.ibispaintx.app"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-pink-700 hover:bg-pink-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
              >
                <span>Play Store&apos;dan İndir</span>
                <Download size={14} />
              </a>
            </div>

            {/* Türkçe Font Paketi */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-400/60 transition group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <Type size={16} className="text-amber-400" />
                    Türkçe Font Paketi
                  </h3>
                  <span className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded font-bold">Gerekli Paket</span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Balonların içindeki yazıları yazmak ve SFX&apos;leri yazarak yapmak için hazırlanmış tam Türkçe fontlar.
                </p>
              </div>
              <a
                href="https://drive.google.com/drive/folders/1E6gPYRERZcxsogZpjBegTgVsKDtaoR-4"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
              >
                <span>Google Drive Font İndir</span>
                <Download size={14} />
              </a>
            </div>

            {/* Hazır SFX'ler */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-400/60 transition group shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <Sparkles size={16} className="text-fuchsia-400" />
                    Hazır SFX&apos;ler
                  </h3>
                  <span className="text-[10px] bg-fuchsia-900/60 text-fuchsia-200 px-2 py-0.5 rounded font-bold">Fansub Özel</span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Bu hazır sfx efektleri Mikrokosmos fansub üyelerimiz ve editörlerimiz için özel olarak hazırlanmıştır.
                </p>
              </div>
              <a
                href="https://drive.google.com/file/d/1bbTsze-9EirL8TLkVy719WA3Q_l4kI_f/view?usp=drivesdk"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow"
              >
                <span>Google Drive Hazır SFX İndir</span>
                <Download size={14} />
              </a>
            </div>

            {/* RAM ve Hafıza İpucu */}
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-5 flex flex-col justify-center space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Info size={16} />
                <span>Önemli Donanım İpucu</span>
              </div>
              <p className="text-xs text-purple-300 leading-relaxed">
                Cihazınızda en az <strong>2 GB boş hafıza</strong> bulunması Ibis Paint X ve Photoshop kullanırken yüksek çözünürlüklü manhwa sayfalarında kasma yaşanmasını engeller.
              </p>
            </div>

          </div>
        </section>
      )}

      {/* 2. TEMEL KAVRAMLAR & KATMANLAR */}
      {(activeTab === 'all' || activeTab === 'layers') && (
        <section className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-900/60 text-pink-300 border border-pink-500/30">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">2. Temel Kavramlar &amp; Katman Mantığı</h2>
                <p className="text-xs text-purple-300">Editörlüğün kalbi olan şeffaf katman (layer) mimarisi</p>
              </div>
            </div>
          </div>

          <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-4 flex items-start gap-3 text-rose-200 text-xs sm:text-sm">
            <AlertTriangle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold">⚡ Editörlüğün Altın Kuralı:</strong>
              Orijinal resmin üzerine ASLA direkt çizim yapılmaz! Her işlem kendi özel katmanında yürütülür.
            </div>
          </div>

          {/* Visual Layer Stack Graphic */}
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-purple-200">
              <strong>Katman (Layer) Nedir?</strong> Üst üste konulmuş şeffaf asetat kâğıtları gibi düşünün. İşin kalbi layer mantığını anlamaktır:
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="bg-gradient-to-r from-pink-950/80 to-purple-950/50 border-l-4 border-pink-500 p-4 rounded-r-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-pink-200 text-sm">🔝 En Üst Katman(lar)</div>
                  <div className="text-xs text-pink-300/90 mt-0.5">Türkçe konuşma metinleri, düşünce balonları ve SFX yazılarının eklendiği katman.</div>
                </div>
                <span className="text-[10px] bg-pink-900/60 text-pink-200 px-2 py-1 rounded font-bold">Layer 3</span>
              </div>

              <div className="bg-gradient-to-r from-purple-950/80 to-indigo-950/50 border-l-4 border-purple-500 p-4 rounded-r-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-purple-200 text-sm">🎨 Orta Katman (Cleaning &amp; Redraw)</div>
                  <div className="text-xs text-purple-300/90 mt-0.5">Balon temizliği, arka plan tamiratı ve çizim onarımlarının yapıldığı katman.</div>
                </div>
                <span className="text-[10px] bg-purple-900/60 text-purple-200 px-2 py-1 rounded font-bold">Layer 2</span>
              </div>

              <div className="bg-gradient-to-r from-indigo-950/80 to-gray-950/50 border-l-4 border-indigo-500 p-4 rounded-r-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-indigo-200 text-sm">📜 En Alt Katman (Orijinal Sayfa)</div>
                  <div className="text-xs text-indigo-300/90 mt-0.5">Orijinal Korece/İngilizce manhwa sayfası (Bu katman kilitlenmelidir).</div>
                </div>
                <span className="text-[10px] bg-indigo-900/60 text-indigo-200 px-2 py-1 rounded font-bold">Layer 1 (Kilitli)</span>
              </div>
            </div>

            <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3.5 text-xs text-purple-300 flex items-center gap-2">
              <Info size={16} className="text-purple-400 flex-shrink-0" />
              <span><strong>İpucu:</strong> Geri dönüşü olmayan hataları önlemek için çizime başlamadan önce katman listenizde &ldquo;Orijinal&rdquo; katmanını kilitlemeyi unutmayın.</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. TEMİZLEME & 4. YAZI YERLEŞTİRME & 5. ALTIN KURALLAR & 6. FONTLAR */}
      {(activeTab === 'all' || activeTab === 'rules') && (
        <section className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-500/30">
                <Type size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">3-6. Temizleme, Typeset &amp; Font Standartları</h2>
                <p className="text-xs text-purple-300">Temizlik, yazı yerleştirme incelikleri ve fansub standart font tablosu</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 3. Temizleme & 4. Typeset */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-purple-300 flex items-center gap-2">
                <Palette size={18} className="text-purple-400" />
                3. Temizleme (Cleaning)
              </h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                Balon içindeki Korece/İngilizce yazıları silip Türkçeye hazır hale getirme işlemine <strong>Cleaning</strong> yani temizlik diyoruz. Bu sadece konuşma balonlarıyla sınırlı değildir; SFX&apos;ler, dikdörtgen kutular ve görsel üstü yazılar da buna dahildir.
              </p>

              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 text-xs text-purple-200">
                <span className="font-bold text-purple-300">💡 Araç İpucu:</span> Karmaşık çizimlerin üzerindeki yazıları temizlerken Ibis Paint içindeki &ldquo;Lasso (Kement)&rdquo; ve &ldquo;Klonlama&rdquo; araçlarını kullanabilirsiniz.
              </div>

              <h3 className="text-base font-extrabold text-purple-300 pt-3 flex items-center gap-2">
                <Type size={18} className="text-purple-400" />
                4. Yazı Yerleştirme (Typeset)
              </h3>
              <ol className="space-y-2 text-xs text-purple-200 list-decimal list-inside pl-1">
                <li><strong>Font İçe Aktarma:</strong> İndirdiğiniz .ttf veya .otf Türkçe fontları Ibis Paint X içine aktarın.</li>
                <li><strong>Metin Ekleme:</strong> Metin (Text) aracını seçip balona tıklayın.</li>
                <li><strong>Metin Hizalama:</strong> Konuşma balonları için metni her zaman <strong>Ortalayın</strong>. Düşünce balonları veya kutu yazıları için tasarıma göre sola/sağa yaslayabilirsiniz.</li>
                <li><strong>Balona Sığdırma:</strong> Metni balona yerleştirirken <em>baklava/elmas şekli</em> oluşturmaya çalışın. Ne balonun kenarlarına yapışsın ne de çok küçük kalsın.</li>
              </ol>
            </div>

            {/* 5. Altın Kurallar & 6. Font Standartları */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                5. Altın İpuçları
              </h3>
              <ul className="space-y-2 text-xs text-purple-200 list-disc list-inside pl-1">
                <li><strong>Dışa Aktarma (Export):</strong> Görsel kalitesinin bozulmaması için mutlaka <strong>PNG</strong> formatında kaydedin.</li>
                <li><strong>Görsel Çözünürlüğü:</strong> Sayfayı içeri aktarırken çözünürlüğü asla düşürmeyin.</li>
                <li><strong>Yakınlaştırma (Zoom):</strong> Telefondan çalışırken iki parmağınızla sayfaya iyice yakınlaşarak pikselleri ve kenarları net görün.</li>
              </ul>

              <h3 className="text-base font-extrabold text-purple-300 pt-3 flex items-center gap-2">
                <FileText size={18} className="text-purple-400" />
                6. Hangi Font Nerede Kullanılır? (Fansub Standartları)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="bg-gray-950/80 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-purple-200 font-semibold">Normal Konuşma Balonları</span>
                  <span className="font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">Wildwords</span>
                </div>
                <div className="bg-gray-950/80 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-purple-200 font-semibold">Anlatım / Düşünce / Kutu</span>
                  <span className="font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">Wildwords İtalik</span>
                </div>
                <div className="bg-gray-950/80 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-purple-200 font-semibold">Bağırma / Heyecanlı Metinler</span>
                  <span className="font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">Wildwords Bold / İtalik Bold</span>
                </div>
                <div className="bg-gray-950/80 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-purple-200 font-semibold">Mesajlaşma / Tabela / Senet</span>
                  <span className="font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40">Arial / Düz Sistem Fontu</span>
                </div>
                <div className="bg-gray-950/80 border border-purple-500/30 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-purple-200 font-semibold">SFX (Ses Efektleri &amp; Eylemler)</span>
                  <span className="font-bold text-fuchsia-300 bg-fuchsia-950/80 px-2 py-0.5 rounded border border-fuchsia-500/40">Mangamaster</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 🎥 VİDEOLU DERSLER BÖLÜMÜ */}
      {(activeTab === 'all' || activeTab === 'videos') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/90 border border-purple-500/20 rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-900/60 text-purple-300 border border-purple-500/30">
                <Video size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">🎥 Videolu Anlatım Dersleri (1 - 6)</h2>
                <p className="text-xs text-purple-300">
                  Adım adım video anlatımları izleyerek telefonunuzda pratik yapabilirsiniz.
                </p>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Derslerde ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-purple-950/50 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-purple-100 placeholder-purple-400/60 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLessons.map(lesson => {
              const isCompleted = completedLessons.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className={`bg-gray-900/95 border rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                      : 'border-purple-500/30 hover:border-purple-400/60'
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    
                    {/* Header: Title & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black bg-purple-900/80 text-purple-200 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                            {lesson.tag}
                          </span>
                          {isCompleted && (
                            <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={12} /> Tamamlandı
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-white text-base sm:text-lg leading-snug">
                          {lesson.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => toggleLessonComplete(lesson.id)}
                        className={`p-2 rounded-xl border transition flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-purple-950/60 border-purple-500/30 text-purple-400 hover:text-white'
                        }`}
                        title={isCompleted ? 'Tamamlandı işaretini kaldır' : 'İzlendi olarak işaretle'}
                      >
                        {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
                      {lesson.desc}
                    </p>

                    {lesson.note && (
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
                        <strong className="text-amber-300">Not:</strong> {lesson.note}
                      </div>
                    )}

                    {/* Responsive Video Player (16:9) */}
                    <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-2xl bg-black border border-purple-500/40 shadow-inner">
                      <iframe
                        src={lesson.previewUrl}
                        title={lesson.title}
                        allow="autoplay; fullscreen"
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 sm:p-5 bg-purple-950/40 border-t border-purple-500/20 flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleLessonComplete(lesson.id)}
                      className={`text-xs font-bold flex items-center gap-1.5 transition ${
                        isCompleted ? 'text-emerald-400 hover:text-emerald-300' : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      <span>{isCompleted ? 'Tamamlandı' : 'İzlendi Olarak İşaretle'}</span>
                    </button>

                    <a
                      href={lesson.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-800 hover:bg-purple-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition active:scale-95 whitespace-nowrap"
                    >
                      <span>Drive&apos;da Aç / İndir</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredLessons.length === 0 && (
            <div className="text-center py-12 bg-gray-900/60 border border-purple-500/20 rounded-3xl p-8">
              <p className="text-purple-300 font-bold text-sm">Aramanıza uygun ders bulunamadı.</p>
            </div>
          )}

          <div className="text-center py-4">
            <span className="text-xs font-extrabold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-4 py-2 rounded-full">
              ✨ Yeni videolu dersler hazırlandıkça buraya eklenecektir...
            </span>
          </div>
        </section>
      )}

      {/* Bottom CTA Card */}
      <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
        <h3 className="text-xl sm:text-2xl font-black text-white">
          Siz de Mikrokosmos Fansub Ekibine Katılmak İster misiniz?
        </h3>
        <p className="text-xs sm:text-sm text-purple-200 max-w-2xl mx-auto leading-relaxed">
          Rehberi tamamladıktan sonra öğrendiklerinizle birlikte ekibimizde Çevirmen, Editör veya Raw Sağlayıcı olarak yer alabilirsiniz.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setView({ type: 'join-team' })}
            className="bg-white text-purple-950 hover:bg-purple-100 font-black px-6 py-3 rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Ekip Başvuru Formunu Aç</span>
          </button>
          <a
            href="https://discord.gg/mikrokosmos"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-950/80 hover:bg-purple-900 border border-purple-400/40 text-purple-100 font-bold px-6 py-3 rounded-xl shadow transition active:scale-95 text-xs sm:text-sm flex items-center gap-2"
          >
            <MessageSquare size={16} />
            <span>Discord&apos;a Gel</span>
          </a>
        </div>
      </div>

      <div className="text-center text-xs text-purple-400/80 pt-4">
        💜 Mikrokosmos Fansub © Mobil Manhwa Editörlük Rehberi
      </div>

    </div>
  );
};
