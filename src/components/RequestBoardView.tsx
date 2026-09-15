import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SeriesRequest, SeriesType } from '../types';
import { ThumbsUp, Heart, PlusCircle, Search, Sparkles, Filter, CheckCircle2, Clock, Check, AlertCircle, X } from 'lucide-react';

export const RequestBoardView: React.FC = () => {
  const { seriesRequests, voteSeriesRequest, addSeriesRequest, user } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('Hepsi');
  const [filterStatus, setFilterStatus] = useState<string>('Hepsi');
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');

  // Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SeriesType>('Manhwa');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newRequestedBy, setNewRequestedBy] = useState(user?.name || '');
  const [successMessage, setSuccessMessage] = useState('');

  const currentUserId = user?.uid || 'anonymous-user';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSynopsis.trim()) return;

    addSeriesRequest({
      title: newTitle.trim(),
      type: newType,
      synopsis: newSynopsis.trim(),
      requestedBy: newRequestedBy.trim() || 'Okuyucu'
    });

    setNewTitle('');
    setNewSynopsis('');
    setIsModalOpen(false);
    setSuccessMessage('İsteğiniz panoya eklendi ve 1 varsayılan oy kazandı! Teşekkür ederiz.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const getStatusBadge = (status: SeriesRequest['status']) => {
    switch (status) {
      case 'Çevriliyor':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow-sm">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Çevriliyor
          </span>
        );
      case 'Takvime Eklendi':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-950 text-purple-300 border border-purple-700/60 px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow-sm">
            <Sparkles size={12} className="text-purple-400" />
            Takvime Eklendi
          </span>
        );
      case 'Reddedildi':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-950 text-rose-300 border border-rose-800/60 px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow-sm">
            <X size={12} className="text-rose-400" />
            Reddedildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow-sm">
            <Clock size={12} className="text-amber-400" />
            İncelemede
          </span>
        );
    }
  };

  // Filter & Sort Logic
  let filtered = seriesRequests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'Hepsi' || req.type === filterType;
    const matchesStatus = filterStatus === 'Hepsi' || req.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (sortBy === 'votes') {
    filtered.sort((a, b) => b.votes - a.votes);
  } else {
    filtered.sort((a, b) => b.id.localeCompare(a.id));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/90 via-fuchsia-900/80 to-purple-950/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <ThumbsUp size={14} className="text-fuchsia-400" />
              <span>Mikrokosmos Fansub Topluluk Panosu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Seri İstek Panosu & Oylama
            </h1>
            <p className="text-purple-200/80 text-xs sm:text-sm mt-1 max-w-xl">
              Çevrilmesini veya yayınlanmasını istediğiniz Manhwa, Web Novel ve Mangalar için oy verin! En çok oy alan seriler ekibimizce öncelikli olarak çeviriye alınır.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-extrabold px-5 py-3 rounded-2xl shadow-lg shadow-purple-950/80 transition hover:scale-105 active:scale-95"
          >
            <PlusCircle size={20} />
            <span>Yeni Seri İsteğinde Bulun</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {/* Control Bar: Search + Filters + Sort */}
      <div className="bg-gray-900/90 border border-purple-500/20 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            placeholder="İstek panosunda ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-purple-500/30 text-white placeholder-purple-300/50 text-xs sm:text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-950 border border-purple-500/30 text-purple-200 text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="Hepsi">Tüm Durumlar</option>
            <option value="İncelemede">İncelemede</option>
            <option value="Çevriliyor">Çevriliyor</option>
            <option value="Takvime Eklendi">Takvime Eklendi</option>
            <option value="Reddedildi">Reddedildi</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-gray-950 border border-purple-500/30 text-purple-200 text-xs font-semibold rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="Hepsi">Tüm Türler</option>
            <option value="Manhwa">Manhwa</option>
            <option value="Web Novel">Web Novel</option>
            <option value="Manhua">Manhua</option>
            <option value="Manga">Manga</option>
          </select>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1 bg-gray-950 border border-purple-500/30 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSortBy('votes')}
              className={`px-3 py-1.5 rounded-xl transition ${
                sortBy === 'votes'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              En Çok Oy Alan
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1.5 rounded-xl transition ${
                sortBy === 'newest'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              En Yeni
            </button>
          </div>
        </div>

      </div>

      {/* Request Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-gray-900/50 border border-purple-500/10 rounded-3xl p-8">
            <AlertCircle size={32} className="mx-auto text-purple-400 mb-2" />
            <p className="text-gray-300 font-bold text-sm">Aramanıza uygun seri isteği bulunamadı.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs font-extrabold text-purple-300 hover:text-white bg-purple-900/60 px-4 py-2 rounded-xl transition"
            >
              İlk İsteği Siz Gönderin!
            </button>
          </div>
        ) : (
          filtered.map(req => {
            const hasVoted = req.votedUserIds.includes(currentUserId);

            return (
              <div
                key={req.id}
                className="bg-gray-900/90 border border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-4 sm:p-5 flex gap-4 shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                {/* Upvote Button Box */}
                <div className="flex flex-col items-center justify-center">
                  <button
                    onClick={() => voteSeriesRequest(req.id)}
                    className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl border transition-all transform active:scale-90 ${
                      hasVoted
                        ? 'bg-gradient-to-b from-purple-600 to-fuchsia-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-105'
                        : 'bg-gray-950 border-purple-500/30 text-purple-300 hover:bg-purple-950 hover:border-purple-400 hover:text-white'
                    }`}
                    title={hasVoted ? 'Oyunuzu kaldırın' : 'Bu seriye oy verin'}
                  >
                    <Heart size={20} className={hasVoted ? 'fill-current text-white animate-bounce' : 'text-purple-400'} />
                    <span className="text-sm font-black mt-1">{req.votes}</span>
                    <span className="text-[9px] uppercase font-bold opacity-80">Oy</span>
                  </button>
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Top Status & Type */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-md">
                        {req.type}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-base text-gray-100 group-hover:text-purple-200 transition line-clamp-1">
                      {req.title}
                    </h3>

                    {/* Synopsis */}
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                      {req.synopsis}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500 mt-3">
                    <span>İsteyen: <strong className="text-purple-300">{req.requestedBy}</strong></span>
                    <span>{req.createdAt}</span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-purple-300 font-extrabold text-lg mb-4">
              <PlusCircle size={22} className="text-fuchsia-400" />
              <span>Yeni Seri Çeviri İsteği</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Seri Adı (Orijinal / İngilizce veya Türkçe) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Pick Me Up! Infinite Gacha"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Seri Formatı *
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as SeriesType)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="Manhwa">Manhwa (Kore Çizgi Romanı)</option>
                  <option value="Web Novel">Web Novel (Kore / Çin Web Romanı)</option>
                  <option value="Manhua">Manhua (Çin Çizgi Romanı)</option>
                  <option value="Manga">Manga (Japon Çizgi Romanı)</option>
                  <option value="Webtoon">Webtoon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Neden Çevrilmeli? / Seri Özeti *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Serinin konusundan ve neden çevrilmesini istediğinizden bahsedin..."
                  value={newSynopsis}
                  onChange={e => setNewSynopsis(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Rumuz / Adınız
                </label>
                <input
                  type="text"
                  placeholder="İsminiz (Boş bırakılırsa Okuyucu)"
                  value={newRequestedBy}
                  onChange={e => setNewRequestedBy(e.target.value)}
                  className="w-full bg-gray-950 border border-purple-500/30 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg transition"
                >
                  İsteği Yayınla
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
