// Lemon Squeezy Integration Helper for Mikrokosmos Fansub
import confetti from 'canvas-confetti';

export interface LemonSqueezyCheckoutOptions {
  checkoutUrl: string;
  userEmail?: string;
  userId?: string;
  packageId?: string;
  customData?: Record<string, string>;
  onSuccess?: (eventData: any) => void;
}

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (config: { eventHandler: (event: any) => void }) => void;
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
    };
  }
}

let isLemonScriptLoaded = false;
let isLemonSetupDone = false;
let isMessageListenerAttached = false;
const successCallbackMap = new Set<(event: any) => void>();

// Strict Deduplication State to prevent any double-credit
const processedOrderIds = new Set<string>();
let lastSuccessfulPaymentTime = 0;

/**
 * Fires multi-burst colorful confetti when a payment is successful
 */
export function triggerPurchaseConfetti() {
  try {
    // Initial blast
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6', '#fbbf24']
    });

    // Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#10b981']
      });
    }, 200);

    // Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6']
      });
    }, 400);

    // Star shower
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.4 },
        shapes: ['star', 'circle'],
        colors: ['#f59e0b', '#fbbf24', '#ffffff']
      });
    }, 650);
  } catch (e) {
    console.warn('Confetti error:', e);
  }
}

/**
 * Dispatches verified payment success to all listeners and triggers confetti
 * Strictly deduplicates events so coins are credited exactly once per transaction
 */
function notifyPaymentSuccess(eventData: any) {
  const now = Date.now();
  const rawOrderId = eventData?.data?.id ||
    eventData?.order?.id ||
    eventData?.order_id ||
    eventData?.data?.attributes?.order_number ||
    eventData?.attributes?.order_number;
  const orderId = rawOrderId ? String(rawOrderId).trim() : '';

  // 1. If order ID was already processed, ignore duplicate
  if (orderId && processedOrderIds.has(orderId)) {
    console.log('🍋 Ignoring duplicate event for order:', orderId);
    return;
  }

  // 2. Debounce window: ignore any duplicate event within 4 seconds
  if (now - lastSuccessfulPaymentTime < 4000) {
    console.log('🍋 Debounced duplicate checkout event within 4s window');
    return;
  }

  lastSuccessfulPaymentTime = now;
  if (orderId) {
    processedOrderIds.add(orderId);
  }

  console.log('🎉 Lemon Squeezy Payment Confirmed (Processed Exactly Once)!', eventData);
  triggerPurchaseConfetti();

  successCallbackMap.forEach((cb) => {
    try {
      cb(eventData);
    } catch (err) {
      console.error('Error in LemonSqueezy success callback:', err);
    }
  });
}

/**
 * Loads Lemon Squeezy overlay script (lemon.js) if not already loaded
 */
export function loadLemonSqueezyScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.LemonSqueezy || isLemonScriptLoaded) {
      if (window.createLemonSqueezy && !isLemonSetupDone) {
        try {
          window.createLemonSqueezy();
          initLemonEventListener();
        } catch (e) {
          console.warn('LemonSqueezy init error:', e);
        }
      }
      resolve(true);
      return;
    }

    // Check if script is already present in document
    const existingScript = document.querySelector('script[src*="lemon.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        isLemonScriptLoaded = true;
        if (window.createLemonSqueezy) {
          try {
            window.createLemonSqueezy();
            initLemonEventListener();
          } catch (e) {}
        }
        resolve(true);
      });
      if (window.LemonSqueezy) {
        isLemonScriptLoaded = true;
        initLemonEventListener();
        resolve(true);
        return;
      }
    }

    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.defer = true;
    script.onload = () => {
      isLemonScriptLoaded = true;
      if (window.createLemonSqueezy) {
        try {
          window.createLemonSqueezy();
          initLemonEventListener();
        } catch (e) {
          console.warn('LemonSqueezy init error:', e);
        }
      }
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Lemon Squeezy lemon.js script');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Global Lemon Squeezy Event Listener
 */
function initLemonEventListener() {
  // 1. Official LemonSqueezy.Setup event handler (Only listen to Checkout.Success, NOT Order.Created)
  if (window.LemonSqueezy?.Setup && !isLemonSetupDone) {
    try {
      window.LemonSqueezy.Setup({
        eventHandler: (event: any) => {
          console.log('🍋 Lemon Squeezy SDK Event:', event);
          if (event && event.event === 'Checkout.Success') {
            notifyPaymentSuccess(event);
          }
        }
      });
      isLemonSetupDone = true;
    } catch (err) {
      console.warn('Error setting up Lemon Squeezy SDK event listener:', err);
    }
  }

  // 2. PostMessage listener fallback (attached only once)
  if (typeof window !== 'undefined' && !isMessageListenerAttached) {
    isMessageListenerAttached = true;
    window.addEventListener('message', (event) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch(e) {}
        }
        // ONLY trigger on Checkout.Success
        if (data && (data.event === 'Checkout.Success' || data.eventName === 'Checkout.Success')) {
          notifyPaymentSuccess(data);
        }
      } catch (err) {}
    });
  }
}

/**
 * Subscribe to Lemon Squeezy payment success events
 */
export function onLemonPaymentSuccess(callback: (eventData: any) => void) {
  // Ensure listeners are initialized
  loadLemonSqueezyScript().then(() => {
    initLemonEventListener();
  });

  successCallbackMap.add(callback);
  return () => {
    successCallbackMap.delete(callback);
  };
}

/**
 * Opens Lemon Squeezy Overlay or fallbacks to target checkout URL
 */
export async function openLemonSqueezyCheckout(options: LemonSqueezyCheckoutOptions): Promise<boolean> {
  const { checkoutUrl, userEmail, userId, packageId, customData } = options;
  if (!checkoutUrl) return false;

  let urlObj: URL;
  try {
    urlObj = new URL(checkoutUrl);
  } catch (e) {
    window.open(checkoutUrl, '_blank');
    return true;
  }

  // Store pending purchase locally so if overlay closes we know exactly which package was ordered
  try {
    sessionStorage.setItem('mk_lemon_pending_package', JSON.stringify({
      packageId: packageId || 'cp_pro',
      userEmail,
      userId,
      customData,
      timestamp: Date.now()
    }));
  } catch (e) {}

  // Append user email and custom parameters
  if (userEmail) {
    urlObj.searchParams.set('checkout[email]', userEmail);
  }
  if (userId) {
    urlObj.searchParams.set('checkout[custom][user_id]', userId);
  }
  if (packageId) {
    urlObj.searchParams.set('checkout[custom][package_id]', packageId);
  }
  if (customData) {
    Object.entries(customData).forEach(([k, v]) => {
      urlObj.searchParams.set(`checkout[custom][${k}]`, v);
    });
  }

  const finalUrl = urlObj.toString();

  // Ensure overlay script is ready
  await loadLemonSqueezyScript();
  initLemonEventListener();

  // Try Lemon.js Overlay first
  if (window.LemonSqueezy?.Url?.Open) {
    try {
      window.LemonSqueezy.Url.Open(finalUrl);
      return true;
    } catch (e) {
      console.warn('LemonSqueezy overlay failed, falling back to window.open', e);
    }
  }

  // Fallback to new window/tab
  window.open(finalUrl, '_blank');
  return true;
}
