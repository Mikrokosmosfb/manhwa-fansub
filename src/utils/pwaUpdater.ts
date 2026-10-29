import { registerSW } from 'virtual:pwa-register';

type UpdateCallback = (hasUpdate: boolean) => void;
const updateListeners = new Set<UpdateCallback>();

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let isUpdateAvailable = false;
let isInitialized = false;

export function subscribePWAUpdate(callback: UpdateCallback): () => void {
  updateListeners.add(callback);
  callback(isUpdateAvailable);
  return () => {
    updateListeners.delete(callback);
  };
}

function notifyUpdateListeners(status: boolean) {
  isUpdateAvailable = status;
  updateListeners.forEach(fn => {
    try {
      fn(status);
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Initializes PWA Service Worker with aggressive update detection
 * and auto-reload on worker activation.
 */
export function initPWARegistration() {
  if (isInitialized || typeof window === 'undefined') return;
  if (import.meta.env.DEV) return;
  isInitialized = true;

  updateSWFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Yeni sürüm mevcut.');
      notifyUpdateListeners(true);
    },
    onOfflineReady() {
      console.log('[PWA] Çevrimdışı kullanım hazır.');
    },
    onRegisteredSW(swScriptUrl, registration) {
      if (registration) {
        console.log('[PWA] Service Worker devrede:', swScriptUrl);

        // Periyodik kontrol (15 dakikada bir)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);

        // Kullanıcı uzun süre sonra sekmeye geri döndüğünde kontrol et
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker kayıt hatası:', error);
    }
  });
}

/**
 * Clears all Service Worker caches and triggers a hard reload to get the latest version immediately.
 */
export async function forceUpdateAndClearCache(): Promise<void> {
  console.log('[PWA] Önbellek ve Service Worker temizliği başlatılıyor...');
  try {
    // 1. Cache Storage temizle
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => caches.delete(key)));
      console.log('[PWA] Tüm önbellekler silindi:', cacheKeys);
    }

    // 2. Service Worker'ları güncelle veya kaydını sil
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(reg => reg.update().catch(() => reg.unregister()))
      );
    }
  } catch (error) {
    console.error('[PWA] Önbellek temizleme hatası:', error);
  } finally {
    // 3. En taze sürümü çekmek için sayfayı yenile
    window.location.reload();
  }
}
