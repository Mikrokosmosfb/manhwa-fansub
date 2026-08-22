import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const ScrollToTopBottom: React.FC = () => {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Show "Top" button if scrolled down more than 200px
      setShowTop(scrollY > 200);

      // Show "Bottom" button if not near the bottom (within 200px)
      setShowBottom(scrollY + clientHeight < scrollHeight - 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-3.5 sm:right-6 z-40 flex flex-col gap-2 pointer-events-none">
      {/* Scroll to Top Button */}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="pointer-events-auto bg-purple-900/90 hover:bg-purple-600 text-white p-2.5 sm:p-3 rounded-2xl border border-purple-400/50 shadow-2xl backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 group flex items-center justify-center cursor-pointer"
          title="En Başa Git"
          aria-label="En Başa Git"
        >
          <ChevronUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
          <span className="sr-only">Başa Git</span>
        </button>
      )}

      {/* Scroll to Bottom Button */}
      {showBottom && (
        <button
          onClick={scrollToBottom}
          className="pointer-events-auto bg-purple-950/90 hover:bg-purple-700 text-purple-200 hover:text-white p-2.5 sm:p-3 rounded-2xl border border-purple-500/40 shadow-2xl backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 group flex items-center justify-center cursor-pointer"
          title="En Sona Git"
          aria-label="En Sona Git"
        >
          <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
          <span className="sr-only">Sona Git</span>
        </button>
      )}
    </div>
  );
};
