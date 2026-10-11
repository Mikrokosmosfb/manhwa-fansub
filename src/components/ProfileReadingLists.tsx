import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReadingList, Series, KosmosPinItem } from '../types';
import { Plus, Trash2, Edit2, Check, X, BookOpen, Bookmark, Pin, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';
import { getOptimizedImageUrl, handleImageError } from '../utils/imageUtils';
import { isIframeUrl, normalizeImageUrl } from '../utils/imageParser';

export const extractPinsFromReadingLists = (rawLists?: any[]): KosmosPinItem[] => {
  if (!Array.isArray(rawLists)) return [];
  const carrier = rawLists.find((l: any) => l && l.id === '__kosmospins__');
  if (carrier && Array.isArray(carrier.pins)) {
    return carrier.pins;
  }
  return [];
};

export const ProfileKosmosPins: React.FC<{
  isOwnProfile: boolean;
  userId: string;
  initialPins?: KosmosPinItem[];
  rawLists?: any[];
  onNavigate?: () => void;
}> = ({ isOwnProfile, initialPins, rawLists, onNavigate }) => {
  const { kosmosPins, toggleKosmosPin, setView } = useApp();

  const pinsToDisplay: KosmosPinItem[] = isOwnProfile
    ? kosmosPins
    : initialPins && initialPins.length > 0
    ? initialPins
    : extractPinsFromReadingLists(rawLists);

  const handleOpenPinInWallpapers = (pin: KosmosPinItem) => {
    try {
      localStorage.setItem('mk_target_wallpaper_pin', JSON.stringify(pin));
      window.dispatchEvent(new Event('mk-open-target-wallpaper'));
    } catch {}
    if (onNavigate) onNavigate();
    setView({ type: 'wallpapers' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <Pin size={17} className="text-amber-400 fill-amber-400/30" />
            <h3 className="text-lg font-black text-white">KosmosPin'ler</h3>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-300">
              {pinsToDisplay.length} Pin
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isOwnProfile
              ? 'Beğenip pinlediğiniz duvar kağıtları. Pine tıklayarak Wallpaper sayfasındaki orijinal haline gidebilirsiniz.'
              : 'Kullanıcının seçtiği KosmosPin koleksiyonu. Beğendiğiniz pine tıklayarak orijinal Wallpaper sayfasında açabilirsiniz.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate();
            setView({ type: 'wallpapers' });
          }}
          className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-800/80 border border-purple-500/30 text-purple-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <ImageIcon size={13} />
          <span>Wallpaper Galerisi</span>
        </button>
      </div>

      {pinsToDisplay.length === 0 ? (
        <div className="text-center py-8 bg-gray-900/30 rounded-2xl border border-gray-800/50 px-4">
          <Pin size={26} className="mx-auto text-gray-600 mb-2" />
          <p className="text-xs sm:text-sm font-bold text-gray-400">
            {isOwnProfile
              ? "Henüz KosmosPin eklemediniz. Wallpaper galerisindeki görselleri 'Pinle' butonuyla buraya ekleyebilirsiniz."
              : 'Bu kullanıcı henüz KosmosPin eklememiş.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900/40 border border-gray-800/70 rounded-2xl p-3 sm:p-4">
          {/* Compact, neat thumbnail grid so pins never look overly huge on profile */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-2.5">
            {pinsToDisplay.map(pin => {
              const imgUrl = normalizeImageUrl(pin.imageUrl) || pin.imageUrl;
              return (
                <div
                  key={pin.id}
                  onClick={() => handleOpenPinInWallpapers(pin)}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-950 border border-purple-500/20 hover:border-amber-400/70 cursor-pointer shadow-md hover:shadow-purple-500/20 transition-all duration-300"
                  title={`${pin.seriesTitle || pin.title} — Orijinal Wallpaper sayfasında görüntüle`}
                >
                  {isIframeUrl(imgUrl) ? (
                    <div className="w-full h-full relative bg-gray-950 overflow-hidden">
                      <iframe
                        src={imgUrl}
                        title={pin.title || pin.seriesTitle}
                        className="w-full h-full border-0 pointer-events-none scale-[1.02]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-transparent" />
                    </div>
                  ) : (
                    <img
                      src={getOptimizedImageUrl(imgUrl, 260)}
                      onError={e => handleImageError(e, imgUrl, pin.title || pin.seriesTitle)}
                      alt={pin.title || pin.seriesTitle}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />

                  {/* Small top-left Pin icon */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-sm border border-amber-400/30 text-amber-300 flex items-center gap-0.5">
                    <Pin size={9} className="fill-current" />
                  </div>

                  {/* Unpin button for own profile */}
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleKosmosPin(pin);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/75 hover:bg-rose-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition z-10"
                      title="KosmosPin'lerden Kaldır"
                    >
                      <X size={11} />
                    </button>
                  )}

                  {/* Bottom compact title & link indicator */}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-end justify-between gap-1">
                    <span className="text-[10px] font-bold text-white line-clamp-1 leading-tight drop-shadow">
                      {pin.seriesTitle || pin.title || 'Wallpaper'}
                    </span>
                    <ExternalLink
                      size={10}
                      className="text-amber-300 shrink-0 opacity-0 group-hover:opacity-100 transition"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfileReadingLists: React.FC<{
  isOwnProfile: boolean;
  userId: string;
  initialLists: ReadingList[];
  hidePinsSection?: boolean;
  onNavigate?: () => void;
}> = ({ isOwnProfile, userId, initialLists, hidePinsSection = false, onNavigate }) => {
  const { readingLists, setReadingLists, seriesList, setView, showToast } = useApp();

  // Filter out the internal __kosmospins__ carrier from reading lists
  const listsToDisplay = (isOwnProfile ? readingLists : initialLists || []).filter(
    l => l && l.id !== '__kosmospins__'
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    if (listsToDisplay.length >= 3) {
      showToast({ title: 'Limit Aşıldı', message: 'Maksimum 3 okuma listesi oluşturabilirsiniz.', type: 'error' });
      return;
    }

    const newList: ReadingList = {
      id: 'list-' + Date.now(),
      name: newListName.trim(),
      seriesIds: []
    };

    setReadingLists([...listsToDisplay, newList]);

    setNewListName('');
    setIsCreating(false);
    showToast({ title: 'Başarılı', message: 'Okuma listesi oluşturuldu.', type: 'success' });
  };

  const handleDeleteList = (id: string) => {
    if (!window.confirm('Bu listeyi silmek istediğinize emin misiniz?')) return;
    setReadingLists(listsToDisplay.filter(l => l.id !== id));
    showToast({ title: 'Silindi', message: 'Okuma listesi silindi.', type: 'info' });
  };

  const handleRenameList = (id: string) => {
    if (!editingName.trim()) return;
    setReadingLists(listsToDisplay.map(l => (l.id === id ? { ...l, name: editingName.trim() } : l)));
    setEditingListId(null);
    showToast({ title: 'Başarılı', message: 'Liste adı güncellendi.', type: 'success' });
  };

  const handleRemoveSeries = (listId: string, seriesIdToRemove: string) => {
    setReadingLists(
      listsToDisplay.map(l => {
        if (l.id === listId) {
          return { ...l, seriesIds: l.seriesIds.filter(id => id !== seriesIdToRemove) };
        }
        return l;
      })
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Okuma Listelerim</h3>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/30 text-purple-300">
                {listsToDisplay.length} / 3 Liste
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isOwnProfile
                ? 'En fazla 3 özel okuma listesi oluşturabilir ve her listeye maksimum 30 seri ekleyebilirsiniz.'
                : 'Kullanıcının oluşturduğu herkese açık okuma listeleri.'}
            </p>
          </div>
          {isOwnProfile && !isCreating && (
            listsToDisplay.length < 3 ? (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow"
              >
                <Plus size={14} />
                <span>Yeni Liste Oluştur ({listsToDisplay.length}/3)</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Maksimum Liste Limiti (3/3)
              </span>
            )
          )}
        </div>

        {isCreating && isOwnProfile && (
          <div className="bg-gray-900/50 border border-purple-500/30 p-3 rounded-2xl flex items-center gap-2">
            <input
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder={`Yeni liste adı (${listsToDisplay.length + 1}. liste)...`}
              maxLength={40}
              className="flex-1 bg-gray-950/50 border border-gray-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreateList()}
            />
            <button
              type="button"
              onClick={handleCreateList}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <Check size={15} />
              <span>Oluştur</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/40 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {listsToDisplay.length === 0 ? (
          <div className="text-center py-10 bg-gray-900/30 rounded-2xl border border-gray-800/50">
            <BookOpen size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm font-bold text-gray-400">Henüz okuma listesi yok.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {listsToDisplay.map(list => {
              const listSeries = (list.seriesIds || [])
                .map(id => seriesList.find(s => s.id === id))
                .filter(Boolean) as Series[];

              return (
                <div key={list.id} className="bg-gray-900/40 border border-gray-800/60 rounded-2xl overflow-hidden">
                  <div className="bg-gray-950/50 px-4 py-3 flex items-center justify-between border-b border-gray-800/60">
                    {editingListId === list.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="bg-gray-900 border border-purple-500/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none w-48"
                          autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleRenameList(list.id)}
                        />
                        <button
                          onClick={() => handleRenameList(list.id)}
                          className="p-1 text-green-400 hover:bg-green-400/10 rounded"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingListId(null)}
                          className="p-1 text-red-400 hover:bg-red-400/10 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <h4 className="font-extrabold text-purple-100 flex items-center gap-2">
                        <Bookmark size={16} className="text-purple-400" />
                        {list.name}
                        <span className="text-xs font-medium text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full ml-2">
                          {listSeries.length}/30
                        </span>
                      </h4>
                    )}

                    {isOwnProfile && editingListId !== list.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingListId(list.id);
                            setEditingName(list.name);
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-300 hover:bg-purple-900/30 rounded-lg transition"
                          title="Yeniden Adlandır"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteList(list.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {listSeries.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">Bu listede henüz seri yok.</p>
                    ) : (
                      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x py-1">
                        {listSeries.map(series => (
                          <div key={series.id} className="group relative shrink-0 w-[125px] sm:w-[145px] md:w-[160px] snap-start">
                            <div
                              className="aspect-[2/3] rounded-xl overflow-hidden cursor-pointer relative shadow-lg hover:shadow-purple-500/20 transition duration-300"
                              onClick={() => {
                                if (onNavigate) onNavigate();
                                setView({ type: 'series-detail', seriesId: series.id });
                              }}
                            >
                              <img
                                src={series.coverImage}
                                alt={series.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                              {series.status && <DiagonalStatusRibbon status={series.status} />}

                              <div className="absolute inset-x-0 bottom-0 p-2">
                                <h5 className="text-[10px] sm:text-xs font-bold text-white line-clamp-2 leading-tight shadow-black drop-shadow-md">
                                  {series.title}
                                </h5>
                              </div>
                            </div>

                            {isOwnProfile && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleRemoveSeries(list.id, series.id);
                                }}
                                className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg hover:scale-110 z-10"
                                title="Listeden Çıkar"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hidePinsSection && (
        <div className="pt-4 border-t border-white/10">
          <ProfileKosmosPins
            isOwnProfile={isOwnProfile}
            userId={userId}
            rawLists={initialLists}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
};

