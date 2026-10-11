import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bug, Send, CheckCircle2 } from 'lucide-react';

export const ReportModal: React.FC = () => {
  const { setView, seriesList, user, showToast } = useApp();
  const [selectedSeries, setSelectedSeries] = useState('');
  const [chapterInfo, setChapterInfo] = useState('');
  const [sourcePageUrl, setSourcePageUrl] = useState('');
  const [sourceSeriesId, setSourceSeriesId] = useState('');
  const [sourceChapterId, setSourceChapterId] = useState('');
  const [reportType, setReportType] = useState('Hasarlı / Yüklenmeyen Resim');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const prefillRaw = sessionStorage.getItem('mk_report_prefill');
      if (prefillRaw) {
        sessionStorage.removeItem('mk_report_prefill');
        const parsed = JSON.parse(prefillRaw);
        if (parsed.seriesTitle) setSelectedSeries(parsed.seriesTitle);
        if (parsed.chapterTitle) setChapterInfo(parsed.chapterTitle);
        if (parsed.pageUrl) setSourcePageUrl(parsed.pageUrl);
        if (parsed.seriesId) setSourceSeriesId(parsed.seriesId);
        if (parsed.chapterId) setSourceChapterId(parsed.chapterId);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const matchedSeries = seriesList.find(s => s.title === selectedSeries);
    const resolvedSeriesId = matchedSeries?.id || sourceSeriesId || '';

    try {
      await fetch('/api/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportCategory: 'issue',
          commentId: 'GENEL-SORUN-' + Date.now(),
          commentText: message.trim(),
          commentAuthorName: user?.name || 'Ziyaretçi Bildirimi',
          commentAuthorId: user?.uid || '-',
          commentDate: new Date().toLocaleString('tr-TR'),
          seriesId: resolvedSeriesId,
          seriesTitle: selectedSeries || 'Genel Site Bildirimi',
          chapterId: sourceChapterId || '',
          chapterTitle: chapterInfo.trim() || 'Belirtilmedi',
          reason: reportType,
          details: message.trim(),
          reporterName: user?.name || 'Ziyaretçi Okuyucu',
          reporterEmail: user?.email || '',
          pageUrl:
            sourcePageUrl ||
            (resolvedSeriesId
              ? `${window.location.origin}/#/seri/${encodeURIComponent(resolvedSeriesId)}`
              : typeof window !== 'undefined'
              ? window.location.href
              : '')
        }),
        keepalive: true
      });
    } catch {}

    setIsSubmitting(false);
    setSubmitted(true);
    showToast?.({
      title: 'Sorun Bildirimi İletildi 🛠️',
      message: 'Raporunuz detaylarıyla birlikte mikrokosmosfansub@gmail.com adresine gönderildi.',
      type: 'success'
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-gray-900/95 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <Bug size={28} className="text-red-400" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Sorun / Hata Bildir
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Hasarlı resim, eksik sayfa veya çeviri hatalarını bize iletin.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Bildiriminiz Alındı!</h3>
            <p className="text-xs text-emerald-200 leading-relaxed">
              Sorun raporunuz <strong>mikrokosmosfansub@gmail.com</strong> adresine iletildi. En kısa sürede teknik ekibimiz tarafından incelenip düzeltilecektir. Teşekkür ederiz.
            </p>
            <button
              onClick={() => setView({ type: 'home' })}
              className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2 rounded-xl cursor-pointer"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-purple-300 font-bold mb-1">Seri Adı</label>
              <select
                value={selectedSeries}
                onChange={e => setSelectedSeries(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                <option value="">Seri Seçin (Opsiyonel)</option>
                {seriesList.map(s => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Bölüm Numarası / Bilgisi</label>
              <input
                type="text"
                placeholder="Örn: Bölüm 5"
                value={chapterInfo}
                onChange={e => setChapterInfo(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Sorun Türü</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none"
              >
                <option value="Hasarlı / Yüklenmeyen Resim">Hasarlı / Yüklenmeyen Resim</option>
                <option value="Sırasız Karışmış Sayfalar">Sırasız / Karışmış Sayfalar</option>
                <option value="Çeviri / Yazım Hatası">Çeviri / Yazım Hatası</option>
                <option value="Kırık Link / Diğer">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 font-bold mb-1">Açıklama *</label>
              <textarea
                required
                rows={4}
                placeholder="Lütfen yaşadığınız sorunu detaylıca açıklayın..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-gray-950 border border-purple-500/30 text-white text-xs rounded-xl p-3 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Gönderiliyor...' : 'Raporu Gönder'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
