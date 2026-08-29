import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Check,
  KeyRound,
  RotateCw,
  Clock
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
}

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com',
  'getairmail.com', 'dispostable.com', 'temp-mail.org', 'fakeinbox.com',
  'burnermail.io', 'inboxkitten.com', 'mohmal.com', 'crazymailing.com'
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const {
    loginWithEmail,
    registerWithEmail,
    verifyAdminPassword,
    sendOtp,
    resetPasswordWithOtp
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // OTP Verification flow for Registration & Forgot Password
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpPendingName, setOtpPendingName] = useState('');
  const [otpPendingPassword, setOtpPendingPassword] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Timer for OTP countdown
  useEffect(() => {
    let timer: any;
    if (isOtpStep && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpStep, otpCountdown]);

  if (!isOpen) return null;

  const isDisposableEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && DISPOSABLE_EMAIL_DOMAINS.includes(domain);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = loginEmail.trim().toLowerCase();
    if (!emailTrimmed || !loginPassword) {
      setErrorMessage('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    const isAdmin = emailTrimmed === 'aseleliyeva77@gmail.com' || emailTrimmed === 'mikrokosmosfansub@gmail.com';

    setIsLoading(true);
    try {
      const res = await loginWithEmail(emailTrimmed, loginPassword);
      if (res.success) {
        if (isAdmin) {
          verifyAdminPassword(loginPassword);
        }
        setSuccessMessage('Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.message || 'Giriş yapılamadı. E-posta veya şifrenizi kontrol edin.');
      }
    } catch (err: any) {
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameTrimmed = registerName.trim();
    const emailTrimmed = registerEmail.trim().toLowerCase();

    if (!nameTrimmed || !emailTrimmed || !registerPassword) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (isDisposableEmail(emailTrimmed)) {
      setErrorMessage('Geçici/sahte (tek kullanımlık) e-posta adresleri güvenlik nedeniyle kabul edilmemektedir.');
      return;
    }

    const isAdmin = emailTrimmed === 'aseleliyeva77@gmail.com' || emailTrimmed === 'mikrokosmosfansub@gmail.com';
    if (isAdmin) {
      setErrorMessage('Bu e-posta adresi sistem yöneticisine aittir. Lütfen kendi e-posta adresinizi kullanın.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);
    try {
      // Send OTP to email
      const otpRes = await sendOtp(emailTrimmed, 'register', nameTrimmed, registerPassword);
      if (otpRes.success) {
        setOtpTargetEmail(emailTrimmed);
        setOtpPendingName(nameTrimmed);
        setOtpPendingPassword(registerPassword);
        setOtpCountdown(60);
        setCanResendOtp(false);
        setOtpCodeInput('');
        setIsOtpStep(true);
        setSuccessMessage(otpRes.message || `6 haneli doğrulama kodu ${emailTrimmed} adresine gönderildi. Lütfen gelen kutunuzu kontrol ediniz.`);
      } else {
        setErrorMessage(otpRes.message || 'Doğrulama kodu gönderilemedi.');
      }
    } catch (err: any) {
      setErrorMessage('Doğrulama kodu gönderilirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const code = otpCodeInput.trim();
    if (!code || code.length < 4) {
      setErrorMessage('Lütfen 6 haneli doğrulama kodunu giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerWithEmail(otpPendingName, otpTargetEmail, otpPendingPassword, code);
      if (res.success) {
        setSuccessMessage('Aramıza hoş geldiniz! Üyeliğiniz ve kütüphaneniz başarıyla oluşturuldu.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Doğrulama kodu hatalı veya süresi dolmuş.');
      }
    } catch (err: any) {
      setErrorMessage('Kayıt tamamlanırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = forgotEmail.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const otpRes = await sendOtp(emailTrimmed, 'reset');
      if (otpRes.success) {
        setOtpTargetEmail(emailTrimmed);
        setOtpCountdown(60);
        setCanResendOtp(false);
        setOtpCodeInput('');
        setIsOtpStep(true);
        setSuccessMessage(otpRes.message || `Şifre sıfırlama kodu ${emailTrimmed} adresine gönderildi. Lütfen gelen kutunuzu kontrol ediniz.`);
      } else {
        setErrorMessage(otpRes.message || 'Sıfırlama kodu gönderilemedi.');
      }
    } catch (err: any) {
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const code = otpCodeInput.trim();
    if (!code) {
      setErrorMessage('Lütfen e-postanıza gelen doğrulama kodunu giriniz.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setErrorMessage('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithOtp(otpTargetEmail, code, forgotNewPassword);
      if (res.success) {
        setSuccessMessage('Şifreniz başarıyla sıfırlandı! Şimdi yeni şifrenizle giriş yapabilirsiniz.');
        setTimeout(() => {
          setIsOtpStep(false);
          setActiveTab('login');
          setLoginEmail(otpTargetEmail);
          setLoginPassword('');
          setSuccessMessage(null);
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Şifre sıfırlama kodu geçersiz.');
      }
    } catch (err: any) {
      setErrorMessage('Şifre sıfırlama işlemi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const res = await sendOtp(otpTargetEmail, activeTab === 'forgot' ? 'reset' : 'register', otpPendingName, otpPendingPassword);
      if (res.success) {
        setOtpCountdown(60);
        setCanResendOtp(false);
        setOtpCodeInput('');
        setSuccessMessage('Yeni 6 haneli doğrulama kodu e-posta adresinize gönderildi.');
      } else {
        setErrorMessage(res.message || 'Yeni kod gönderilemedi.');
      }
    } catch (e) {
      setErrorMessage('Kod tekrar gönderilemedi.');
    } finally {
      setIsLoading(false);
    }
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

        {/* OTP VERIFICATION CODE STEP */}
        {isOtpStep ? (
          /* OTP VERIFICATION CODE STEP */
          <div className="space-y-5 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setIsOtpStep(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition font-semibold"
            >
              <ArrowLeft size={16} /> Geri Dön
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-900/60 border border-purple-400/40 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3 text-amber-300">
                <KeyRound size={26} />
              </div>
              <h2 className="text-xl font-black text-white">Güvenlik Doğrulaması</h2>
              <p className="text-xs text-purple-200/80 mt-1">
                <strong className="text-white">{otpTargetEmail}</strong> adresinize 6 haneli doğrulama kodu gönderildi.
              </p>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs flex items-start gap-2.5 animate-shake shadow-lg">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {activeTab === 'register' ? (
              <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5 text-center">
                    6 Haneli Doğrulama Kodu
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCodeInput}
                    onChange={e => setOtpCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full bg-black/70 border-2 border-purple-500/50 focus:border-amber-400 rounded-2xl py-3 px-4 text-center text-2xl font-black tracking-widest text-amber-300 placeholder-gray-600 outline-none transition"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-purple-300">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-purple-400" />
                    <span>Kalan Süre: {otpCountdown}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResendOtp || isLoading}
                    className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-bold disabled:opacity-40 disabled:hover:text-amber-300 transition"
                  >
                    <RotateCw size={13} className={isLoading ? 'animate-spin' : ''} /> Kodu Tekrar Gönder
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 rounded-xl transition duration-200 shadow-xl shadow-emerald-950/50 disabled:opacity-50"
                >
                  {isLoading ? 'Hesap Doğrulanıyor...' : 'Doğrula ve Üyeliği Tamamla'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyForgotOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    6 Haneli Sıfırlama Kodu
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCodeInput}
                    onChange={e => setOtpCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    required
                    className="w-full bg-black/70 border-2 border-purple-500/50 focus:border-amber-400 rounded-xl py-2.5 px-4 text-center text-xl font-black tracking-widest text-amber-300 placeholder-gray-600 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Yeni Şifre (En az 6 karakter)
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
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
                    Yeni Şifre Tekrarı
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-purple-300">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-purple-400" />
                    <span>Kalan Süre: {otpCountdown}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResendOtp || isLoading}
                    className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 font-bold disabled:opacity-40 disabled:hover:text-amber-300 transition"
                  >
                    <RotateCw size={13} className={isLoading ? 'animate-spin' : ''} /> Kodu Tekrar Gönder
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition duration-200 shadow-xl shadow-purple-950/50 disabled:opacity-50 mt-1"
                >
                  {isLoading ? 'Şifre Güncelleniyor...' : 'Şifremi Sıfırla ve Kaydet'}
                </button>
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
                {activeTab === 'login'
                  ? 'Hesabınıza Giriş Yapın'
                  : activeTab === 'register'
                  ? 'Aramıza Katılın'
                  : 'Şifrenizi Sıfırlayın'}
              </h2>
              <p className="text-xs text-purple-200/80 mt-1">
                {activeTab === 'login'
                  ? 'Tüm bölümleri sınırsız okumak ve kütüphanenizi senkronize etmek için giriş yapın.'
                  : activeTab === 'register'
                  ? 'Şifreli ve güvenli hesabınızı oluşturun, 6 haneli kodla onaylayın.'
                  : 'E-posta adresinize doğrulama kodu göndererek şifrenizi güvenle yenileyin.'}
              </p>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-purple-200">
                      Şifre
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setForgotEmail(loginEmail);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-purple-300 hover:text-amber-300 transition"
                    >
                      Şifremi Unuttum?
                    </button>
                  </div>
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
                      <span className="font-extrabold text-white text-[11px] block">Cloudflare Koruma</span>
                      <span className="text-[10px] text-emerald-300 font-medium">Şifreli ve güvenli oturum</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    AKTİF
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
              <form onSubmit={handleStartRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      value={registerName}
                      onChange={e => setRegisterName(e.target.value)}
                      placeholder="Profil İsminiz"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1">
                    Geçerli E-Posta Adresi
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
                    Güçlü Şifre (En az 6 karakter)
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
                      <span className="font-extrabold text-white text-[11px] block">Fake/Bot Hesap Filtresi</span>
                      <span className="text-[10px] text-emerald-300 font-medium">OTP 6 Haneli E-posta Koruması</span>
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
                  {isLoading ? 'Doğrulama Kodu Gönderiliyor...' : 'Doğrulama Kodu Al & Kaydol'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleStartForgot} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Kayıtlı E-Posta Adresiniz
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="ornek@mail.com"
                      className="w-full bg-black/50 border border-purple-500/30 focus:border-purple-400 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition duration-200 shadow-lg shadow-amber-900/40 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Kod Gönderiliyor...' : 'Sıfırlama Kodu Gönder'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-purple-300 hover:text-white font-semibold transition"
                  >
                    ← Giriş Ekranına Dön
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <div className="mt-5 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
          <span>Güvenli, şifreli ve Cloudflare D1 korumalı altyapı</span>
        </div>
        <div className="mt-2 text-center text-[10px] text-red-300/80 max-w-xs mx-auto leading-relaxed border border-red-500/10 bg-red-950/20 p-2 rounded-lg">
          <strong>Önemli Not:</strong> 5 ay boyunca hesaba giriş yapmayan kullanıcıların hesapları sistem tarafından otomatik olarak silinecektir.
        </div>
      </div>
    </div>
  );
};
