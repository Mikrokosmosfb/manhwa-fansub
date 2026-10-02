import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Safely parses HTML containing <script> tags and executes them in the DOM.
 * Standard innerHTML does not execute <script> tags per W3C HTML5 spec.
 */
export function injectExecutableHtml(container: HTMLElement, rawHtml: string, tagId?: string) {
  // Clear container
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

  // Append scripts to execute them
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

  // Inject / update Popunder & PopAds scripts
  useEffect(() => {
    const existingPopScripts = document.querySelectorAll('script[data-mk-ad="popads"]');
    existingPopScripts.forEach(el => el.remove());

    if (adSettings.popadsEnabled && adSettings.popadsCode && adSettings.popadsCode.trim()) {
      try {
        const temp = document.createElement('div');
        temp.innerHTML = adSettings.popadsCode.trim();
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
          // If pure JS code without <script> tag was entered
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.text = adSettings.popadsCode.trim();
          script.setAttribute('data-mk-ad', 'popads');
          document.body.appendChild(script);
        }
      } catch (err) {
        console.warn('PopAds injection error:', err);
      }
    }

    return () => {
      const scripts = document.querySelectorAll('script[data-mk-ad="popads"]');
      scripts.forEach(el => el.remove());
    };
  }, [adSettings.popadsEnabled, adSettings.popadsCode]);

  // Inject / update custom Head scripts
  useEffect(() => {
    const existingHeadScripts = document.querySelectorAll('[data-mk-ad="head-custom"]');
    existingHeadScripts.forEach(el => el.remove());

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
      const elements = document.querySelectorAll('[data-mk-ad="head-custom"]');
      elements.forEach(el => el.remove());
    };
  }, [adSettings.customHeadScript]);

  return null;
};

/**
 * AdBannerBlock: Reusable component for rendering Top, Bottom or Reader ad banners
 */
export const AdBannerBlock: React.FC<{
  code?: string;
  enabled?: boolean;
  placementName: string;
  className?: string;
}> = ({ code, enabled, placementName, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (enabled && code && code.trim()) {
      injectExecutableHtml(containerRef.current, code, placementName);
    } else {
      containerRef.current.innerHTML = '';
    }
  }, [enabled, code, placementName]);

  if (!enabled || !code || !code.trim()) {
    return null;
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center my-3 overflow-hidden ${className}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-semibold">
        Reklam
      </div>
      <div ref={containerRef} className="w-full flex items-center justify-center min-h-[50px]" />
    </div>
  );
};
