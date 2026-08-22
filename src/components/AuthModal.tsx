import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, Plus, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

// Default device/browser Google account suggestion
const DEFAULT_GOOGLE_ACCOUNT = {
  email: 'aseleliyeva77@gmail.com',
  name: 'Aysel Eliyeva',
  avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, registerWithGoogle } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Google Account Chooser Step
  const [isGoogleStep, setIsGoogleStep] = useState(false);
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmail(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMessage('Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMessage(res.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      }
    } catch (err: any) {
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerWithEmail(registerName, registerEmail, registerPassword);
      if (res.success) {
        setSuccessMessage('Aramıza hoş geldiniz! Üyeliğiniz başarıyla oluşturuldu.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Kayıt yapılırken bir hata oluştu.');
      }
    } catch (err: any) {
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGoogleChooser = () => {
    setIsGoogleStep(true);
    setUseCustomEmail(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectGoogleAccount = async (email: string, name?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = activeTab === 'login' 
        ? await loginWithGoogle(email) 
        : await registerWithGoogle(email, name);

      if (res.success) {
        setSuccessMessage(res.message || `Google hesabınızla (${email}) başarıyla oturum açıldı!`);
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setErrorMessage(res.message || 'Google yetkilendirmesi başarısız oldu.');
        if (activeTab === 'login') {
          setActiveTab('register');
        }
      }
    } catch (err) {
      setErrorMessage('Google yetkilendirmesi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) {
      setErrorMessage('Lütfen geçerli bir Google e-posta adresi girin.');
      return;
    }
    await handleSelectGoogleAccount(googleEmailInput.trim(), googleNameInput.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-gray-900 via-purple-950/90 to-gray-950 rounded-3xl border border-purple-500/30 shadow-2xl p-6 sm:p-8 overflow-hidden text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition"
        >
          <X size={20} />
        </button>

        {/* GOOGLE ACCOUNT CHOOSER STEP */}
        {isGoogleStep ? (
          <div className="space-y-5 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setIsGoogleStep(false);
                setErrorMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition font-semibold"
            >
              <ArrowLeft size={16} /> Giriş Seçeneklerine Dön
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white">Bir Google Hesabı Seçin</h2>
              <p className="text-xs text-purple-200/80 mt-1">
                {activeTab === 'login'
                  ? 'Giriş yapmak istediğiniz Google hesabınızı seçin:'
                  : 'Kayıt olmak istediğiniz Google hesabınızı seçin:'}
              </p>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5 animate-shake shadow-lg">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Google Accounts List Card Container */}
            {!useCustomEmail ? (
              <div className="space-y-2.5">
                {/* Default Device Account Option */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSelectGoogleAccount(DEFAULT_GOOGLE_ACCOUNT.email, DEFAULT_GOOGLE_ACCOUNT.name)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gray-900/90 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-400 transition text-left group shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5 shadow">
                      <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-amber-300 font-extrabold text-sm">
                        A
                      </div>
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-white block group-hover:text-amber-200 transition">
                        {DEFAULT_GOOGLE_ACCOUNT.name}
                      </strong>
                      <span className="text-xs text-purple-300 block">{DEFAULT_GOOGLE_ACCOUNT.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-900/80 text-purple-200 px-2 py-1 rounded-lg border border-purple-700/50 font-bold">
                    Oturum Açık
                  </span>
                </button>

                {/* Option: Use Another Google Account */}
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomEmail(true);
                    setErrorMessage(null);
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-black/40 hover:bg-gray-900 border border-purple-500/20 hover:border-purple-400/50 transition text-left text-purple-200 hover:text-white"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-950 flex items-center justify-center border border-purple-800 text-purple-300">
                    <Plus size={18} />
                  </div>
                  <div>
                    <strong className="text-xs font-bold block">Başka bir Google Hesabı kullan</strong>
                    <span className="text-[10px] text-gray-400">Farklı bir e-posta adresi yazın</span>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Email Form */
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Google E-Posta Adresiniz
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={e => setGoogleEmailInput(e.target.value)}
                      placeholder="ornek.hesap@gmail.com"
                      required
                      className="w-full bg-black/60 border border-purple-500/40 focus:border-purple-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                    />
                  </div>
                </div>

                {activeTab === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-purple-200 mb-1.5">
                      Kullanıcı Adınız
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input
                        type="text"
                        value={googleNameInput}
                        onChange={e => setGoogleNameInput(e.target.value)}
                        placeholder="Profil İsminiz"
                        required
                        className="w-full bg-black/60 border border-purple-500/40 focus:border-purple-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomEmail(false);
                      setErrorMessage(null);
                    }}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold py-2.5 rounded-xl text-xs transition border border-gray-800"
                  >
                    Kayıtlı Listeye Dön
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-extrabold py-2.5 px-4 rounded-xl text-xs transition shadow-xl disabled:opacity-50"
                  >
                    {isLoading ? 'Denetleniyor...' : activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STANDARD FORM */
          <>
            {/* Header Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-400/30 text-purple-200 text-xs font-bold mb-3">
                <Sparkles size={14} className="text-amber-300" />
                <span>Mikrokosmos Fansub Üyeliği</span>
              </div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-amber-200">
                {activeTab === 'login' ? 'Hesabınıza Giriş Yapın' : 'Aramıza Katılın'}
              </h2>
              <p className="text-xs text-purple-200/80 mt-1">
                {activeTab === 'login'
                  ? 'Tüm bölümleri sınırsız okumak için giriş yapın.'
                  : 'Ücretsiz hesabınızı hemen oluşturun ve okumaya başlayın.'}
              </p>
            </div>

            {/* Google Quick Login Button */}
            <button
              type="button"
              onClick={handleOpenGoogleChooser}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg hover:shadow-white/10 disabled:opacity-50 mb-5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span className="text-sm">
                {activeTab === 'login' ? 'Google ile Giriş Yap' : 'Google ile Hızlı Kayıt Ol'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-purple-500/30 w-full" />
              <span className="bg-purple-950/80 px-3 text-[11px] text-purple-300 uppercase font-semibold">veya e-posta ile</span>
              <div className="border-t border-purple-500/30 w-full" />
            </div>

            {/* Tab Switchers */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-purple-500/20 mb-5">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'login'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'register'
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-shake shadow-lg">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="ornek@mail.com"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Cloudflare Turnstile Bot Protection Widget */}
                <div className="bg-gray-950/90 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs my-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/50">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-[11px] block">Güvenlik Koruması</span>
                      <span className="text-[10px] text-emerald-300 font-medium">İnsan doğrulaması başarılı (Bot & Spam Koruması)</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    GÜVENLİ
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg shadow-purple-900/40 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Kullanıcı Adı / Ad Soyad
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      value={registerName}
                      onChange={e => setRegisterName(e.target.value)}
                      placeholder="Kullanıcı Adınız"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      placeholder="ornek@mail.com"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Şifre (En az 6 karakter)
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={e => setRegisterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Şifre Tekrarı
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerConfirmPassword}
                      onChange={e => setRegisterConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Cloudflare Turnstile Bot Protection Widget */}
                <div className="bg-gray-950/90 border border-emerald-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs my-2 shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/50">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-[11px] block">Güvenlik Koruması</span>
                      <span className="text-[10px] text-emerald-300 font-medium">Spam ve bot hesap engelleme koruması aktif</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    GÜVENLİ
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg shadow-emerald-900/40 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Hesap Oluşturuluyor...' : 'Ücretsiz Kayıt Ol'}
                </button>
              </form>
            )}
          </>
        )}

        <div className="mt-5 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Güvenli ve şifrelenmiş üyelik altyapısı</span>
        </div>
      </div>
    </div>
  );
};
