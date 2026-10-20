import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import { purgeExpendableStorageCache } from '../utils/safeStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isQuota =
      error?.name === 'QuotaExceededError' ||
      String(error?.message || error).toLowerCase().includes('quota');
    if (isQuota) {
      purgeExpendableStorageCache();
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    const isQuota =
      error?.name === 'QuotaExceededError' ||
      String(error?.message || error).toLowerCase().includes('quota');
    if (isQuota) {
      purgeExpendableStorageCache();
    }
  }

  private handleReload = () => {
    // Proactively clear expendable caches & session data to free up space
    purgeExpendableStorageCache();
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.hash = '#/';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d061a] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-gray-900/90 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-xl font-black text-white">
              Kozmik Bir Aksaklık Oluştu
            </h2>

            <p className="text-xs text-gray-300 leading-relaxed">
              Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Sayfayı yenileyerek veya ana sayfaya dönerek devam edebilirsiniz.
            </p>

            {this.state.error && (
              <div className="bg-black/60 border border-gray-800 rounded-xl p-3 text-left font-mono text-[11px] text-pink-300/80 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Yeniden Yükle</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/';
                  this.setState({ hasError: false, error: null });
                }}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-extrabold text-xs rounded-xl border border-gray-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home size={14} />
                <span>Ana Sayfa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
