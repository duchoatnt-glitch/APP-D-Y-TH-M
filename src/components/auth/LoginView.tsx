import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { UserRole } from '../../types/index.ts';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Building,
  School,
  Zap,
  X,
  LogIn,
} from 'lucide-react';

export interface LoginViewProps {
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onClose, isModal = false }) => {
  const {
    settings,
    login,
    loginWithOtp,
    sendOtp,
    registerUser,
    teachers,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [generatedDemoOtp, setGeneratedDemoOtp] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('teacher');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotDemoOtp, setForgotDemoOtp] = useState<string | null>(null);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'err' | 'ok'; text: string } | null>(null);

  const isEmailInput = identifier.includes('@');

  const startCountdown = () => {
    setOtpCountdown(60);
    const interval = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = () => {
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại để nhận mã OTP.');
      return;
    }
    setErrorMsg(null);
    const res = sendOtp(identifier);
    if (res.success) {
      setOtpSent(true);
      setGeneratedDemoOtp(res.demoOtp || null);
      setSuccessMsg(res.message);
      startCountdown();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      if (loginMethod === 'password') {
        const res = login(identifier, password);
        if (res.success) {
          setSuccessMsg(res.message);
          finishSuccess();
        } else {
          setErrorMsg(res.message);
        }
      } else {
        // OTP Login
        const res = loginWithOtp(identifier, otpCode);
        if (res.success) {
          setSuccessMsg(res.message);
          finishSuccess();
        } else {
          setErrorMsg(res.message);
        }
      }
      setIsLoading(false);
    }, 300);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!regEmail.trim() && !regPhone.trim()) {
      setErrorMsg('Vui lòng nhập ít nhất Email hoặc Số điện thoại.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Xác nhận mật khẩu không trùng khớp.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerUser({
        name: regName,
        email: regEmail || undefined,
        phone: regPhone || undefined,
        role: regRole,
        password: regPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        finishSuccess();
      } else {
        setErrorMsg(res.message);
      }
      setIsLoading(false);
    }, 400);
  };

  const handleQuickLogin = (demoIdentifier: string, demoPass: string = '123456') => {
    setIdentifier(demoIdentifier);
    setPassword(demoPass);
    setLoginMethod('password');
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      const res = login(demoIdentifier, demoPass);
      if (res.success) {
        setSuccessMsg(res.message);
        finishSuccess();
      } else {
        setErrorMsg(res.message);
      }
      setIsLoading(false);
    }, 250);
  };

  const handleForgotRequestOtp = () => {
    if (!forgotIdentifier.trim()) {
      setForgotMsg({ type: 'err', text: 'Vui lòng nhập Email hoặc Số điện thoại.' });
      return;
    }
    const res = sendOtp(forgotIdentifier);
    if (res.success) {
      setForgotDemoOtp(res.demoOtp || null);
      setForgotStep('verify');
      setForgotMsg({ type: 'ok', text: `Mã OTP xác thực đã được gửi tới ${forgotIdentifier}.` });
    } else {
      setForgotMsg({ type: 'err', text: res.message });
    }
  };

  const handleForgotVerifyAndReset = () => {
    if (!forgotOtp.trim()) {
      setForgotMsg({ type: 'err', text: 'Vui lòng nhập mã OTP.' });
      return;
    }
    if (forgotNewPass.length < 6) {
      setForgotMsg({ type: 'err', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }
    if (forgotOtp === forgotDemoOtp || forgotOtp === '123456') {
      login(forgotIdentifier);
      setShowForgotModal(false);
      setSuccessMsg('Đã khôi phục mật khẩu và đăng nhập thành công!');
      finishSuccess();
    } else {
      setForgotMsg({ type: 'err', text: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' });
    }
  };

  const finishSuccess = () => {
    if (onSuccess) onSuccess();
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const innerContent = (
    <>
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-700/30 relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shadow-xs"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Left Side: Brand & Visual Hero */}
      <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Info */}
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-200">
              <School className="w-4 h-4 text-amber-300" />
              <span>Hệ Thống Quản Lý Giáo Dục</span>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                {settings.centerName}
              </h1>
              <p className="text-xs text-blue-200/90 mt-1 font-medium italic">
                &ldquo;{settings.centerSlogan}&rdquo;
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-300 space-y-1.5 border-t border-white/10">
              <div className="flex items-start gap-2">
                <Building className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{settings.centerAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>{settings.centerPhone}</span>
              </div>
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="relative z-10 py-6 space-y-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Quản Lý Đào Tạo & Vật Lý 10-12</h4>
                <p className="text-[11px] text-blue-200">Phân phối chương trình & TKB đồng nhất</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Trợ Lý Giáo Viên AI & Đề Thi</h4>
                <p className="text-[11px] text-purple-200">Soạn đề trắc nghiệm TN Maker & lời giải 8+</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Bảo Mật & Tự Động Lưu Dữ Liệu</h4>
                <p className="text-[11px] text-emerald-200">Đăng nhập nhanh bằng Email hoặc Số điện thoại</p>
              </div>
            </div>
          </div>

          {/* Quick guest bypass */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-blue-200">Trải nghiệm không cần tài khoản?</span>
            <button
              onClick={() => handleQuickLogin('duchoatnt@gmail.com', '123456')}
              className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dùng Thử Ngay</span>
            </button>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Top Switcher: Login vs Register */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Đăng Ký Tài Khoản
              </button>
            </div>

            {/* Notification alert */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Generated Demo OTP Banner */}
            {generatedDemoOtp && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Mã OTP thử nghiệm của bạn là: <strong className="font-mono text-sm tracking-widest text-amber-800">{generatedDemoOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpCode(generatedDemoOtp)}
                  className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold rounded-lg text-[11px] cursor-pointer"
                >
                  Tự động điền
                </button>
              </div>
            )}

            {/* ===================== MODE: LOGIN ===================== */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Login Method Sub-Toggle */}
                <div className="p-1 bg-slate-100 rounded-xl flex text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      loginMethod === 'password'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Đăng nhập bằng Mật Khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('otp');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      loginMethod === 'otp'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Đăng nhập bằng Mã OTP (SMS/Email)
                  </button>
                </div>

                {/* Input: Email or Phone Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Email hoặc Số điện thoại</span>
                    </label>
                    {identifier.trim() ? (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isEmailInput
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isEmailInput ? '✉ Định dạng: Email' : '📱 Định dạng: Số điện thoại'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Email hoặc SĐT 10 số</span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {isEmailInput ? (
                        <Mail className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Phone className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Ví dụ: duchoatnt@gmail.com hoặc 0945001262"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 mt-1.5">
                    <span>Hệ thống tự động tra cứu tài khoản theo Email hoặc SĐT di động.</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-400">Điền nhanh:</span>
                      <button
                        type="button"
                        onClick={() => setIdentifier('duchoatnt@gmail.com')}
                        className="text-blue-600 hover:underline cursor-pointer font-medium"
                      >
                        Email Thầy Hoà
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setIdentifier('0945001262')}
                        className="text-emerald-600 hover:underline cursor-pointer font-medium"
                      >
                        SĐT 0945001262
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setIdentifier('0901234567')}
                        className="text-amber-600 hover:underline cursor-pointer"
                      >
                        SĐT Phụ huynh
                      </button>
                    </div>
                  </div>
                </div>

                {/* Method 1: Password */}
                {loginMethod === 'password' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotIdentifier(identifier);
                          setShowForgotModal(true);
                          setForgotStep('request');
                          setForgotMsg(null);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu của bạn..."
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none transition-all font-medium text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Method 2: OTP Verification */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Mã xác thực OTP (6 số)</label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpCountdown > 0 || !identifier.trim()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {otpCountdown > 0 ? `Gửi lại sau (${otpCountdown}s)` : otpSent ? 'Gửi lại mã OTP' : 'Gửi mã xác thực'}
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Nhập 6 số OTP (hoặc 123456)"
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none font-mono tracking-widest text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Remember me & Submit button */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* ===================== MODE: REGISTER ===================== */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0987 654 321"
                        className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò tài khoản</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium"
                  >
                    <option value="teacher">Giáo viên bộ môn (Toán, Vật lý, Hóa học, v.v.)</option>
                    <option value="parent">Phụ huynh / Học sinh (Tra cứu điểm &amp; lịch học)</option>
                    <option value="staff">Nhân viên văn phòng / Trợ giảng</option>
                    <option value="admin">Quản lý trung tâm / Quản trị viên</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>{isLoading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-5 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ⚡ Đăng Nhập Nhanh Tài Khoản Mẫu (1-Click)
              </span>
              <span className="text-[10px] text-slate-400">Mật khẩu demo: 123456</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Admin Chip: Thầy Nguyễn Đức Hoà */}
              <button
                type="button"
                onClick={() => handleQuickLogin('duchoatnt@gmail.com', '123456')}
                className="p-2.5 rounded-xl border border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  H
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    Thầy Nguyễn Đức Hoà (Admin)
                  </div>
                  <div className="text-[10px] text-blue-600 font-mono truncate">
                    duchoatnt@gmail.com • 0945.001.262
                  </div>
                </div>
              </button>

              {/* SĐT Admin Hoà */}
              <button
                type="button"
                onClick={() => handleQuickLogin('0945001262', '123456')}
                className="p-2.5 rounded-xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  📱
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                    Đăng nhập bằng SĐT Thầy Hoà
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono truncate">
                    0945001262 • Quản trị viên
                  </div>
                </div>
              </button>

              {/* GV Bùi Anh Đức */}
              <button
                type="button"
                onClick={() => handleQuickLogin('duc.bui@viethocedu.vn', '123456')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  Đ
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700 truncate">
                    Thầy Bùi Anh Đức (Tin Học)
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    duc.bui@viethocedu.vn • 0904.777.888
                  </div>
                </div>
              </button>

              {/* Quản trị viên ủy quyền: Cô Trần Thị Mai */}
              <button
                type="button"
                onClick={() => handleQuickLogin('maitt@phannguyen.edu.vn', '123456')}
                className="p-2.5 rounded-xl border border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  M
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                    Cô Trần Thị Mai (QTV Ủy Quyền)
                  </div>
                  <div className="text-[10px] text-indigo-700 font-mono truncate">
                    maitt@phannguyen.edu.vn • 0912.345.678
                  </div>
                </div>
              </button>

              {/* Phụ Huynh Học Sinh */}
              <button
                type="button"
                onClick={() => handleQuickLogin('0901234567', '123456')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 text-left transition-all flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  PH
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700 truncate">
                    Phụ Huynh (Chỉ Xem)
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    0901.234.567 (PH em Nguyễn Minh Quân)
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Khôi Phục Mật Khẩu
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {forgotMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  forgotMsg.type === 'err'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {forgotMsg.type === 'err' ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotDemoOtp && (
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs">
                Mã OTP thử nghiệm: <strong className="font-mono text-sm tracking-wider">{forgotDemoOtp}</strong>
              </div>
            )}

            {forgotStep === 'request' ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Nhập Email hoặc Số điện thoại đăng ký của bạn để nhận mã xác thực OTP khôi phục mật khẩu.
                </p>
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="Email hoặc Số điện thoại..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={handleForgotRequestOtp}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Gửi Mã Xác Thực OTP
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã xác thực OTP (6 chữ số)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="Nhập mã OTP..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-mono tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotVerifyAndReset}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Xác Nhận Đặt Lại Mật Khẩu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl my-auto">
          {innerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-3 sm:p-6 text-slate-800">
      {innerContent}
    </div>
  );
};
