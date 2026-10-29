// Web Push / Browser Native Device Notification Manager for Mikrokosmos PWA

const PUSHED_NOTIFICATIONS_KEY = 'mk_pushed_notification_ids';

export const isNotificationAlreadyPushed = (id?: string): boolean => {
  if (!id) return false;
  try {
    const raw = localStorage.getItem(PUSHED_NOTIFICATIONS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(id);
  } catch {
    return false;
  }
};

export const markNotificationAsPushed = (id?: string): void => {
  if (!id) return;
  try {
    const raw = localStorage.getItem(PUSHED_NOTIFICATIONS_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(id)) {
      list.push(id);
      if (list.length > 500) list = list.slice(list.length - 500);
      localStorage.setItem(PUSHED_NOTIFICATIONS_KEY, JSON.stringify(list));
    }
  } catch {}
};

export const checkNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const requestDeviceNotificationPermission = async (): Promise<{
  granted: boolean;
  status: NotificationPermission | 'unsupported';
  message: string;
}> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      granted: false,
      status: 'unsupported',
      message: 'Tarayıcınız veya cihazınız anlık cihaz bildirimlerini desteklemiyor.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      sendDeviceNotification(
        'Mikrokosmos Bildirimleri Açıldı! 🔔',
        'Takip ettiğiniz serilere yeni bölüm geldiğinde anında ekranınıza bildirim düşecek.',
        '/pwa-192x192.png',
        undefined,
        'welcome-permission-notif'
      );
      return {
        granted: true,
        status: 'granted',
        message: '🎉 Harika! Cihaz bildirimleri başarıyla aktif edildi. Artık yeni bölümler anında telefonunuza gelecek!'
      };
    } else if (permission === 'denied') {
      return {
        granted: false,
        status: 'denied',
        message: '⚠️ Cihaz bildirimi izni reddedildi. Tarayıcı site ayarlarından bildirimlere izin verebilirsiniz.'
      };
    } else {
      return {
        granted: false,
        status: 'default',
        message: 'Bildirim izni isteği kapatıldı.'
      };
    }
  } catch (error) {
    console.error('Notification permission error:', error);
    return {
      granted: false,
      status: 'unsupported',
      message: 'Bildirim izni istenirken bir hata oluştu.'
    };
  }
};

export const sendDeviceNotification = (
  title: string,
  body: string,
  iconUrl?: string,
  url?: string,
  notifId?: string
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // STRICT ANTI-SPAM: If notification ID was already pushed to this device, NEVER push again!
  if (notifId && isNotificationAlreadyPushed(notifId)) {
    return;
  }
  if (notifId) {
    markNotificationAsPushed(notifId);
  }

  const icon = iconUrl || '/pwa-192x192.png';
  // Deterministic tag ensures the operating system/Chrome replaces instead of stacking duplicates
  const deterministicTag = notifId ? `mk-${notifId}` : 'mk-' + title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);

  try {
    // 1. Try standard browser notification
    const notification = new Notification(title, {
      body,
      icon,
      badge: '/favicon.svg',
      tag: deterministicTag,
    });

    notification.onclick = () => {
      window.focus();
      if (url) {
        window.location.href = url;
      }
      notification.close();
    };
  } catch (e) {
    // 2. Fallback to Service Worker registration for Mobile Chrome / PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon,
          badge: '/favicon.svg',
          tag: deterministicTag,
          data: { url: url || window.location.origin }
        });
      }).catch(() => {});
    }
  }
};
