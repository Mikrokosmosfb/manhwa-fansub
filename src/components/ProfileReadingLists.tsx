import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReadingList, Series } from '../types';
import { Plus, Trash2, Edit2, Check, X, BookOpen, Bookmark } from 'lucide-react';
import { DiagonalStatusRibbon } from './DiagonalStatusRibbon';

export const ProfileReadingLists: React.FC<{ isOwnProfile: boolean, userId: string, initialLists: ReadingList[] }> = ({ isOwnProfile, userId, initialLists }) => {
  const { readingLists, setReadingLists, seriesList, setView, showToast, user } = useApp();
  
  // If viewing own profile, use context state, otherwise use passed initialLists
  const listsToDisplay = isOwnProfile ? readingLists : initialLists;
  
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    if (readingLists.length >= 3) {
      showToast({ title: 'Limit Aşıldı', message: 'Maksimum 3 okuma listesi oluşturabilirsiniz.', type: 'error' });
      return;
    }
    
    const newList: ReadingList = {
      id: 'list-' + Date.now(),
      name: newListName.trim(),
      seriesIds: []
    };
    
    setReadingLists([...readingLists, newList]);
    
    setNewListName('');
    setIsCreating(false);
    showToast({ title: 'Başarılı', message: 'Okuma listesi oluşturuldu.', type: 'success' });
  };

  const handleDeleteList = (id: string) => {
    if (!window.confirm('Bu listeyi silmek istediğinize emin misiniz?')) return;
    setReadingLists(readingLists.filter(l => l.id !== id));
    showToast({ title: 'Silindi', message: 'Okuma listesi silindi.', type: 'info' });
  };

  const handleRenameList = (id: string) => {
    if (!editingName.trim()) return;
    setReadingLists(readingLists.map(l => l.id === id ? { ...l, name: editingName.trim() } : l));
    setEditingListId(null);
    showToast({ title: 'Başarılı', message: 'Liste adı güncellendi.', type: 'success' });
  };

  const handleRemoveSeries = (listId: string, seriesIdToRemove: string) => {
    setReadingLists(readingLists.map(l => {
      if (l.id === listId) {
        return { ...l, seriesIds: l.seriesIds.filter(id => id !== seriesIdToRemove) };
      }
      return l;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white">Listeler</h3>
          <p className="text-xs text-gray-400 mt-1">
            {isOwnProfile ? 'Favori serilerinizi kategorize edin ve listelerinizi oluşturun.' : 'Kullanıcının oluşturduğu herkese açık okuma listeleri.'}
          </p>
        </div>
        {isOwnProfile && readingLists.length < 3 && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Yeni Liste
          </button>
        )}
      </div>

      {isCreating && isOwnProfile && (
        <div className="bg-gray-900/50 border border-purple-500/30 p-3 rounded-2xl flex items-center gap-2">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Liste adı..."
            className="flex-1 bg-gray-950/50 border border-gray-800 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
          />
          <button onClick={handleCreateList} className="p-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/40 transition"><Check size={16} /></button>
          <button onClick={() => setIsCreating(false)} className="p-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition"><X size={16} /></button>
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
            const listSeries = list.seriesIds.map(id => seriesList.find(s => s.id === id)).filter(Boolean) as Series[];
            
            return (
              <div key={list.id} className="bg-gray-900/40 border border-gray-800/60 rounded-2xl overflow-hidden">
                <div className="bg-gray-950/50 px-4 py-3 flex items-center justify-between border-b border-gray-800/60">
                  {editingListId === list.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-gray-900 border border-purple-500/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none w-48"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameList(list.id)}
                      />
                      <button onClick={() => handleRenameList(list.id)} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check size={14} /></button>
                      <button onClick={() => setEditingListId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X size={14} /></button>
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
                        onClick={() => { setEditingListId(list.id); setEditingName(list.name); }}
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
                            onClick={() => setView({ type: 'series-detail', seriesId: series.id })}
                          >
                            <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" referrerPolicy="no-referrer" />
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
                              onClick={(e) => { e.stopPropagation(); handleRemoveSeries(list.id, series.id); }}
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
  );
};
