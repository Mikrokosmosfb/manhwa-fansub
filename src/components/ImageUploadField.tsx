import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  placeholder?: string;
  aspectRatio?: 'cover' | 'banner' | 'square' | 'auto';
  helpText?: string;
  className?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'https://... veya bilgisayardan görsel yükleyin',
  aspectRatio = 'cover',
  helpText,
  className = ''
}) => {
  const [activeMode, setActiveMode] = useState<'both' | 'url' | 'file'>('both');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Lütfen geçerli bir resim dosyası seçin (PNG, JPG, WEBP, GIF).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setIsProcessing(false);
        setErrorMessage('Görsel okunamadı.');
        return;
      }

      // Optimize large images to prevent excessive memory/storage usage
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = aspectRatio === 'banner' ? 1600 : 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/webp', 0.88);
            onChange(optimized);
            setIsProcessing(false);
            return;
          }
        }

        onChange(dataUrl);
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(dataUrl);
        setIsProcessing(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setErrorMessage('Dosya yüklenirken bir hata oluştu.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const previewAspectClasses = {
    cover: 'w-20 h-28 sm:w-24 sm:h-34 object-cover',
    banner: 'w-full h-28 sm:h-36 object-cover',
    square: 'w-24 h-24 object-cover',
    auto: 'max-h-32 object-contain'
  }[aspectRatio];

  const hasValue = Boolean(value && value.trim());
  const isBase64 = hasValue && value.startsWith('data:image/');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Mode Selector */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-purple-300">
          {label} {required && <span className="text-pink-400">*</span>}
        </label>
        <div className="flex items-center gap-1 text-[11px]">
          {hasValue && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1 mr-2">
              <CheckCircle2 size={12} /> {isBase64 ? 'Cihazdan Yüklendi' : 'URL Bağlandı'}
            </span>
          )}
        </div>
      </div>

      {/* Main Container with Drag & Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border rounded-2xl p-3 transition-all ${
          isDragging
            ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/50'
            : 'bg-gray-950/80 border-purple-500/25 hover:border-purple-500/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          {/* Live Preview Thumbnail if value exists */}
          {hasValue && (
            <div className="relative group shrink-0 rounded-xl overflow-hidden border border-purple-500/40 bg-black/50 shadow-md">
              <img
                src={value}
                alt="Önizleme"
                referrerPolicy="no-referrer"
                className={`${previewAspectClasses} rounded-xl transition duration-200 group-hover:scale-105`}
                onError={(e) => {
                  (e.target as HTMLElement).style.opacity = '0.3';
                }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition shadow"
                  title="Bilgisayardan Değiştir"
                >
                  <Upload size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition shadow"
                  title="Kaldır"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Controls: URL Input + File Upload Button */}
          <div className="flex-1 min-w-0 w-full space-y-2">
            {/* Input row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <LinkIcon size={14} />
                </div>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => {
                    setErrorMessage(null);
                    onChange(e.target.value);
                  }}
                  className="w-full bg-gray-900 border border-purple-500/30 focus:border-purple-400 text-white text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none placeholder-gray-500 transition"
                />
              </div>

              {/* Browse File Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 border border-purple-400/40 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span className="hidden sm:inline">Bilgisayardan Seç</span>
                    <span className="sm:hidden">Gözat</span>
                  </>
                )}
              </button>
            </div>

            {/* Drag & Drop Hint */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
              <span className="flex items-center gap-1">
                <ImageIcon size={12} className="text-purple-400" />
                Görsel linki yapıştırın veya resmi buraya <strong className="text-purple-300 font-semibold">sürükleyip bırakın</strong>
              </span>
              {hasValue && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 text-[10px]"
                >
                  <Trash2 size={11} /> Temizle
                </button>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2.5 py-1.5 rounded-xl">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {helpText && <p className="text-[11px] text-gray-500 pl-1">{helpText}</p>}
    </div>
  );
};
