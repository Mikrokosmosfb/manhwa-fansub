// Web Push / Browser Native Device Notification Manager for Mikrokosmos PWA

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
      // Send a test welcome notification
      sendDeviceNotification(
        'Mikrokosmos Bildirimleri Açıldı! 🔔',
        'Takip ettiğiniz serilere yeni bölüm geldiğinde anında ekranınıza bildirim düşecek.',
        '/pwa-192x192.png'
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

export const sendDeviceNotification = (title: string, body: string, iconUrl?: string, url?: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const icon = iconUrl || '/pwa-192x192.png';

  try {
    // 1. Try standard browser notification
    const notification = new Notification(title, {
      body,
      icon,
      badge: '/favicon.svg',
      tag: 'mk-notif-' + Date.now(),
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
          data: { url: url || window.location.origin }
        });
      }).catch(() => {});
    }
  }
};
