import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Safely parses HTML containing <script> tags and executes them in the DOM.
 */
export function injectExecutableHtml(container: HTMLElement, rawHtml: string, tagId?: string) {
  container.innerHTML = '';
  if (!rawHtml || !rawHtml.trim()) return;

  const temp = document.createElement('div');
  temp.innerHTML = rawHtml.trim();
  const scripts: HTMLScriptElement[] = [];

  Array.from(temp.childNodes).forEach(node => {
    if (node.nodeName.toUpperCase() === 'SCRIPT') {
      const originalScript = node as HTMLScriptElement;
      const script = document.createElement('script');
      Array.from(originalScript.attributes).forEach(attr => {
        script.setAttribute(attr.name, attr.value);
      });
      if (originalScript.innerHTML) {
        script.text = originalScript.innerHTML;
      }
      if (tagId) {
        script.setAttribute('data-ad-tag', tagId);
      }
      scripts.push(script);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  });

  scripts.forEach(script => {
    container.appendChild(script);
  });
}

/**
 * AdScriptRunner: Automatically injects background PopAds and custom Head scripts
 * across the site when activated by the admin.
 */
export const AdScriptRunner: React.FC = () => {
  const { adSettings } = useApp();

  // Inject / update Popunder & PopAds scripts with strict 1-hour frequency cap per user
  useEffect(() => {
    // Clean any prior script tags
    document.querySelectorAll('script[data-mk-ad="popads"]').forEach(el => el.remove());

    if (!adSettings.popadsEnabled || !adSettings.popadsCode || !adSettings.popadsCode.trim()) {
      return;
    }

    const POPADS_STORAGE_KEY = 'mk_popads_last_shown';
    const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour

    const lastShown = localStorage.getItem(POPADS_STORAGE_KEY);
    const now = Date.now();

    if (lastShown) {
      const elapsed = now - parseInt(lastShown, 10);
      if (elapsed < ONE_HOUR_MS) {
        // Frequency capped: User already saw a pop in the last hour
        return;
      }
    }

    // Safely inject the PopAds script on page load
    try {
      // Protect document.write from wiping the SPA
      const originalWrite = document.write.bind(document);
      const originalWriteln = document.writeln.bind(document);

      document.write = function (markup: string) {
        try {
          const div = document.createElement('div');
          div.innerHTML = markup;
          document.body.appendChild(div);
        } catch (e) {}
      };
      document.writeln = document.write;

      const rawCode = adSettings.popadsCode.trim();
      const temp = document.createElement('div');
      temp.innerHTML = rawCode;
      const scriptTags = temp.querySelectorAll('script');

      if (scriptTags.length > 0) {
        scriptTags.forEach(orig => {
          const script = document.createElement('script');
          Array.from(orig.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
          if (orig.innerHTML) script.text = orig.innerHTML;
          script.setAttribute('data-mk-ad', 'popads');
          document.body.appendChild(script);
        });
      } else {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.text = rawCode;
        script.setAttribute('data-mk-ad', 'popads');
        document.body.appendChild(script);
      }

      // Mark timestamp as shown
      try {
        localStorage.setItem(POPADS_STORAGE_KEY, Date.now().toString());
      } catch (e) {}

      // Restore document.write after scripts finish loading
      setTimeout(() => {
        document.write = originalWrite;
        document.writeln = originalWriteln;
      }, 5000);
    } catch (err) {
      console.warn('PopAds injection error:', err);
    }

    return () => {
      document.querySelectorAll('script[data-mk-ad="popads"]').forEach(el => el.remove());
    };
  }, [adSettings.popadsEnabled, adSettings.popadsCode]);

  // Inject / update custom Head scripts
  useEffect(() => {
    document.querySelectorAll('[data-mk-ad="head-custom"]').forEach(el => el.remove());

    if (adSettings.customHeadScript && adSettings.customHeadScript.trim()) {
      try {
        const temp = document.createElement('div');
        temp.innerHTML = adSettings.customHeadScript.trim();
        Array.from(temp.childNodes).forEach(node => {
          if (node.nodeName.toUpperCase() === 'SCRIPT') {
            const orig = node as HTMLScriptElement;
            const script = document.createElement('script');
            Array.from(orig.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
            if (orig.innerHTML) script.text = orig.innerHTML;
            script.setAttribute('data-mk-ad', 'head-custom');
            document.head.appendChild(script);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const elem = (node as HTMLElement).cloneNode(true) as HTMLElement;
            elem.setAttribute('data-mk-ad', 'head-custom');
            document.head.appendChild(elem);
          }
        });
      } catch (err) {
        console.warn('Head script injection error:', err);
      }
    }

    return () => {
      document.querySelectorAll('[data-mk-ad="head-custom"]').forEach(el => el.remove());
    };
  }, [adSettings.customHeadScript]);

  return null;
};

/**
 * AdBannerBlock: Simple modular ad container for in-reader or header/footer banners
 */
export const AdBannerBlock: React.FC<{
  code?: string;
  tagId?: string;
  className?: string;
}> = ({ code, tagId, className = '' }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && code && code.trim()) {
      injectExecutableHtml(containerRef.current, code, tagId);
    }
  }, [code, tagId]);

  if (!code || !code.trim()) return null;

  return (
    <div
      ref={containerRef}
      className={`ad-container flex items-center justify-center overflow-hidden my-4 ${className}`}
      data-ad-container={tagId || 'banner'}
    />
  );
};
