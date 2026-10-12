// Lemon Squeezy Integration Helper for Mikrokosmos Fansub

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
let successCallbackMap = new Set<(event: any) => void>();

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
  if (isLemonSetupDone || !window.LemonSqueezy?.Setup) return;
  try {
    window.LemonSqueezy.Setup({
      eventHandler: (event: any) => {
        console.log('🍋 Lemon Squeezy Event:', event);
        if (event && (event.event === 'Checkout.Success' || event.event === 'Order.Created')) {
          successCallbackMap.forEach((cb) => {
            try {
              cb(event);
            } catch (err) {
              console.error('Error in LemonSqueezy success callback:', err);
            }
          });
        }
      }
    });
    isLemonSetupDone = true;
  } catch (err) {
    console.warn('Error setting up Lemon Squeezy event listener:', err);
  }
}

/**
 * Subscribe to Lemon Squeezy payment success events
 */
export function onLemonPaymentSuccess(callback: (eventData: any) => void) {
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
    // Fallback if invalid URL relative string
    window.open(checkoutUrl, '_blank');
    return true;
  }

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

  // Try overlay first if script loaded
  await loadLemonSqueezyScript();

  if (window.LemonSqueezy?.Url?.Open) {
    try {
      window.LemonSqueezy.Url.Open(finalUrl);
      return true;
    } catch (e) {
      console.warn('LemonSqueezy overlay failed, falling back to window.open', e);
    }
  }

  // Fallback to new tab/window
  window.open(finalUrl, '_blank');
  return true;
}
