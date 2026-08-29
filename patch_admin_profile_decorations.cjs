const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModal.tsx', 'utf8');

// I will add a generic R2 uploader for decorations.
// First, add a helper handleUploadDecorationToR2 near the other upload handlers.
const uploadHandlerString = `
  const handleUploadDecorationToR2 = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profileDecorations' | 'decorations', idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setShopR2UploadMessage({ type: 'error', text: 'Resim boyutu 15MB\\'dan küçük olmalıdır.' });
      return;
    }

    setIsShopR2Uploading(true);
    setShopR2UploadMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name })
        });
        const data = await res.json();
        setIsShopR2Uploading(false);

        if (data.success && data.url) {
          if (editingThemeStyle) {
            const currentArray = [...(editingThemeStyle[type] || [])];
            currentArray[idx] = { ...currentArray[idx], imageUrl: data.url };
            setEditingThemeStyle({ ...editingThemeStyle, [type]: currentArray });
            setShopR2UploadMessage({ type: 'success', text: 'Yükleme başarılı!' });
            setTimeout(() => setShopR2UploadMessage(null), 3000);
          }
        } else {
          setShopR2UploadMessage({ type: 'error', text: data.error || 'Yükleme başarısız.' });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsShopR2Uploading(false);
      setShopR2UploadMessage({ type: 'error', text: 'Bir hata oluştu.' });
    }
  };
`;

if (!code.includes('handleUploadDecorationToR2')) {
  // Find where to insert it, maybe after handleUploadShopImageToR2
  const insertIndex = code.indexOf('const handleUploadShopImageToR2');
  if (insertIndex !== -1) {
    code = code.slice(0, insertIndex) + uploadHandlerString + code.slice(insertIndex);
  }
}

// Now replace the input field for imageUrl inside profileDecorations array
const oldProfileInput = `<div>
                            <label className="text-[10px] text-gray-400 font-bold">Görsel URL (PNG, WebP)</label>
                            <input type="text" placeholder="https://..." value={dec.imageUrl} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].imageUrl = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm" />
                          </div>`;

const newProfileInput = `<div>
                            <label className="text-[10px] text-gray-400 font-bold">Görsel URL veya Yükle</label>
                            <div className="flex items-center gap-2">
                              <input type="text" placeholder="https://..." value={dec.imageUrl} onChange={e => { const u = [...editingThemeStyle.profileDecorations!]; u[idx].imageUrl = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, profileDecorations: u }); }} className="flex-1 bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm" />
                              <label className="shrink-0 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 font-bold text-[10px] px-2 py-1.5 rounded cursor-pointer transition flex items-center gap-1 border border-cyan-500/30">
                                {isShopR2Uploading ? '...' : 'Cihazdan Seç'}
                                <input type="file" accept="image/*" disabled={isShopR2Uploading} onChange={(e) => handleUploadDecorationToR2(e, 'profileDecorations', idx)} className="hidden" />
                              </label>
                            </div>
                          </div>`;

code = code.split(oldProfileInput).join(newProfileInput);

// Now for decorations (comment decorations)
const oldDecInput = `<div>
                            <label className="text-[10px] text-gray-400 font-bold">Görsel URL (PNG, WebP)</label>
                            <input type="text" placeholder="https://..." value={dec.imageUrl} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].imageUrl = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="w-full bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm" />
                          </div>`;

const newDecInput = `<div>
                            <label className="text-[10px] text-gray-400 font-bold">Görsel URL veya Yükle</label>
                            <div className="flex items-center gap-2">
                              <input type="text" placeholder="https://..." value={dec.imageUrl} onChange={e => { const u = [...editingThemeStyle.decorations!]; u[idx].imageUrl = e.target.value; setEditingThemeStyle({ ...editingThemeStyle, decorations: u }); }} className="flex-1 bg-gray-950 border border-gray-700 rounded p-1 text-white text-sm" />
                              <label className="shrink-0 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold text-[10px] px-2 py-1.5 rounded cursor-pointer transition flex items-center gap-1 border border-emerald-500/30">
                                {isShopR2Uploading ? '...' : 'Cihazdan Seç'}
                                <input type="file" accept="image/*" disabled={isShopR2Uploading} onChange={(e) => handleUploadDecorationToR2(e, 'decorations', idx)} className="hidden" />
                              </label>
                            </div>
                          </div>`;

code = code.split(oldDecInput).join(newDecInput);

fs.writeFileSync('src/components/AdminModal.tsx', code);
console.log("Successfully patched AdminModal.tsx!");
