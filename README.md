# Mikrokosmos Fansub - Manhwa & Web Novel Okuyucu (GitHub Pages Ready)

Gönderdiğiniz Blogger XML teması (`indie.xml`), modern web standartlarına tam uyumlu, responsive ve yüksek performanslı bir **React + Vite + Tailwind CSS Web Uygulamasına** dönüştürülmüştür.

---

## 🌟 Öne Çıkan Özellikler

1. **Gelişmiş Roman Okuma Modu (`setting-novel`)**:
   - **Hazır Temalar**: Gündüz (#FFFFFF), Sepya (#F2EFE9), Gece (#1E1E1E).
   - **Özelleştirilebilir Metin**: Font büyüklüğü (A- / A+), Satır aralığı (%120-%180), Font ailesi (Montserrat, Open Sans, Arial vb.), Yazı hizalama (Sola, Ortala, İki Yana).
   - **Okuma Genişliği**: Dar (600px - Odaklı), Orta (800px - Standart), Geniş (%100).
   - **Otomatik Kaydırma**: 1x, 2x, 3x hız kontrolü ve yüzen durdurma butonu.
   - **Tahmini Okuma Süresi**: Kelime sayısına göre otomatik okuma süresi hesaplayıcı.

2. **Dikey Çizgi Roman / Manhwa Okuma Modu**:
   - Sayfa kaydırma ile entegre üst okuma ilerleme çubuğu (`Progress Bar`).
   - Bölüm seçici açılır menü (Okunan bölümlerde çift tik `✓` işareti).
   - Hatalı / Yüklenmeyen görsel raporlama kısayolu.

3. **Gelişmiş Kütüphane & Klasörleme (IndexedDB / LocalStorage)**:
   - Varsayılan klasörler: **Okuyorum**, **Okuyacağım**, **Bitirdim**, **Bıraktım**.
   - Özel klasörler oluşturma ("Yeni Klasör").
   - Serilerde "Kaldığın Yer: Bölüm X" okuma geçmişi ve rozet gösterimi.
   - **JSON Yedekleme & Geri Yükleme**: Kütüphane verilerinizi tek tıkla cihazlar arası aktarabilirsiniz.

4. **Interaktif Yorum Sistemi**:
   - `[spoiler]` filtresi (Tıklayınca blurlu metin açılır).
   - Görsel eki ekleyebilme.
   - Beğenme / Beğenmeme reaksiyonları ve yanıtlama (threaded replies).

5. **A-Z Liste, Canlı Arama ve Kategori Filtreleme**:
   - Yazarken anlık kapak görseli ve format gösteren **Canlı Arama (Live Search)**.
   - Yayın Durumu, Format (Manhwa, Web Novel, Manga, Webtoon, Manhua) ve Tür filtreleri.

6. **İçerik Yönetim Paneli (Admin)**:
   - Sağ üstteki `+` ikonundan yeni Manhwa / Novel ekleyebilir, yeni bölüm görselleri veya metinleri yayınlayabilirsiniz.

---

## 🚀 GitHub'a Yükleme ve GitHub Pages Kurulumu

Projeniz **GitHub Pages** ve **Vercel / Netlify** üzerinde 0 maliyetle ücretsiz yayınlanmak üzere tasarlanmıştır.

### Adım 1: GitHub Reposu Oluşturun
1. [GitHub.com](https://github.com) hesabınıza giriş yapın.
2. Sağ üstteki **+** -> **New repository** seçin.
3. Reponuza bir isim verin (Örn: `mikrokosmos-fansub`).
4. **Public** seçeneğini işaretleyip **Create repository** butonuna tıklayın.

### Adım 2: Kodları Reponuza Gönderin
Bilgisayarınızın terminalinde proje klasöründe şu komutları çalıştırın:

```bash
git init
git add .
git commit -m "Mikrokosmos Manhwa & Novel Reader Ilk Surum"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/mikrokosmos-fansub.git
git push -u origin main
```

### Adım 3: GitHub Pages ile Canlıya Alın
1. GitHub reponuzda **Settings** sekmesine gidin.
2. Sol menüden **Pages** kısmına tıklayın.
3. **Source** açılır menüsünden **GitHub Actions** veya **gh-pages** seçeneğini belirleyin.
4. Birkaç dakika içinde siteniz `https://KULLANICI_ADINIZ.github.io/mikrokosmos-fansub` adresinde canlıya geçecektir!

> **Alternatif**: Reponuzu **Vercel.com** veya **Netlify.com** hesabınıza bağlayarak da tek tıkla otomatik yayına alabilirsiniz (`npm run build` komutu otomatik derlenir).

---

## 💻 Yerel Çalıştırma Komutları

```bash
# Bağımlılıkları yükle
npm install

# Geliştirici sunucusunu başlat
npm run dev

# Production canlı derleme (dist/ klasörü oluşturur)
npm run build
```
