import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  Database,
  KeyRound,
  ShieldCheck,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

export const LoginView: React.FC = () => {
  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    if (newMode === mode) return;
    if (mode === 'login' && newMode === 'signup') {
      setSlideDirection('right');
    } else if (mode === 'signup' && newMode === 'login') {
      setSlideDirection('left');
    } else if (newMode === 'forgot') {
      setSlideDirection('right');
    } else {
      setSlideDirection('left');
    }
    setMode(newMode);
    setErrorMsg('');
    setInfoMsg('');
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FF66', '#10B981', '#34D399', '#6EE7B7', '#FFFFFF'],
      });
    } catch {
      // ignore
    }
  };

  const getCleanErrorMessage = (err: any): string => {
    const msg = err?.message || String(err);
    if (msg.includes('auth/email-already-in-use')) {
      return 'This email address is already in use. Please log in instead.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (
      msg.includes('auth/user-not-found') ||
      msg.includes('auth/wrong-password') ||
      msg.includes('auth/invalid-credential')
    ) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was cancelled.';
    }
    if (msg.includes('auth/too-many-requests')) {
      return 'Too many attempts. Please try again in a few minutes or reset your password.';
    }
    return msg.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/, '').trim() || 'Authentication failed. Please try again.';
  };

  // Handle Email & Password Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name or username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(name, email, password);
      triggerConfetti();
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email & Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      triggerConfetti();
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      triggerConfetti();
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address to receive the password reset link.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setInfoMsg(`Password reset instructions sent to ${email.trim()}! Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(getCleanErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength helper for signup
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-neutral-700' };
    if (pwd.length < 6) return { score: 1, text: 'Too short (min 6)', color: 'bg-red-500' };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    const strengthCount = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;
    if (pwd.length >= 8 && strengthCount >= 2) {
      return { score: 3, text: 'Strong password', color: 'bg-[#00FF66]' };
    }
    return { score: 2, text: 'Medium strength', color: 'bg-amber-400' };
  };

  const pwdStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#00FF66]/30">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FF66]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand / Logo */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00FF66]/20 via-[#00FF66]/10 to-transparent border border-[#00FF66]/30 mb-3 shadow-[0_0_30px_rgba(0,255,102,0.15)] cursor-pointer"
          >
            <Flame className="w-7 h-7 text-[#00FF66]" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Expenza
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30">
              Cloud
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Personal expense tracking backed by Firebase Cloud
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#121215]/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Top Mode Tabs with Smooth Sliding Pill Spring Animation */}
          {mode !== 'forgot' && (
            <div className="relative grid grid-cols-2 p-1.5 bg-[#18181c]/90 border border-neutral-800/80 rounded-2xl mb-6 shadow-inner">
              {/* Log In Tab Button */}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`relative z-10 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                  mode === 'login' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="authActiveTab"
                    className="absolute inset-0 bg-gradient-to-b from-[#282830] to-[#1e1e24] border border-neutral-700/80 rounded-xl shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <span>Log In</span>
                </span>
              </button>

              {/* Sign Up Tab Button */}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`relative z-10 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                  mode === 'signup' ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="authActiveTab"
                    className="absolute inset-0 bg-gradient-to-b from-[#282830] to-[#1e1e24] border border-neutral-700/80 rounded-xl shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <span>Sign Up</span>
                </span>
              </button>
            </div>
          )}

          {/* Alerts with Smooth Slide & Fade */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed shadow-sm"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
              </motion.div>
            )}

            {infoMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-[#00FF66]/40 text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00FF66] shrink-0 mt-0.5" />
                <span className="flex-1">{infoMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Tab Content Switcher */}
          <AnimatePresence mode="wait" initial={false}>
            {/* MODE: LOG IN */}
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: slideDirection === 'right' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === 'right' ? 20 : -20 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              >
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="name@example.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-neutral-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-[#00FF66] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading || isGoogleLoading}
                    className="w-full mt-2 py-3 px-4 bg-[#00FF66] hover:bg-[#00e65c] text-black font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,102,0.25)]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Log In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <div className="relative flex items-center justify-center my-5">
                    <div className="border-t border-neutral-800 w-full" />
                    <span className="bg-[#121215] px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      or
                    </span>
                    <div className="border-t border-neutral-800 w-full" />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-2.5 px-4 bg-[#18181c] hover:bg-[#202026] border border-neutral-700/80 hover:border-neutral-600 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Log in with Google</span>
                      </>
                    )}
                  </motion.button>

                  <div className="pt-2 text-center text-xs text-neutral-400">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-[#00FF66] font-semibold hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* MODE: SIGN UP */}
            {mode === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: slideDirection === 'right' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: slideDirection === 'right' ? -20 : 20 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              >
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      User Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="John Doe"
                        autoComplete="name"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="name@example.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Animated Password Strength Indicator */}
                    {password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-1"
                      >
                        <div className="flex gap-1.5 h-1 w-full bg-neutral-800/80 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                            transition={{ duration: 0.3 }}
                            className={`h-full rounded-full ${pwdStrength.color}`}
                          />
                        </div>
                        <span className="text-[11px] text-neutral-400 block font-mono">
                          {pwdStrength.text}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading || isGoogleLoading}
                    className="w-full mt-2 py-3 px-4 bg-[#00FF66] hover:bg-[#00e65c] text-black font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,102,0.25)]"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <div className="relative flex items-center justify-center my-5">
                    <div className="border-t border-neutral-800 w-full" />
                    <span className="bg-[#121215] px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      or
                    </span>
                    <div className="border-t border-neutral-800 w-full" />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-2.5 px-4 bg-[#18181c] hover:bg-[#202026] border border-neutral-700/80 hover:border-neutral-600 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Sign up with Google</span>
                      </>
                    )}
                  </motion.button>

                  <div className="pt-2 text-center text-xs text-neutral-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-[#00FF66] font-semibold hover:underline cursor-pointer"
                    >
                      Log in
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* MODE: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              >
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="w-5 h-5 text-[#00FF66]" />
                    <h3 className="text-base font-bold text-white">Reset Password</h3>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Enter your account email address. We&apos;ll send you a link to reset your password.
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="name@example.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-colors"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-[#00FF66] hover:bg-[#00e65c] text-black font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Send Reset Email</span>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer text-center"
                  >
                    ← Back to Log In
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Database & Cloud status indicator */}
        <div className="mt-6 flex flex-col items-center gap-2 text-xs text-neutral-400">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121215] border border-neutral-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <Database className="w-3.5 h-3.5 text-[#00FF66]" />
            <span className="font-mono text-[11px] text-neutral-300">
              Firebase Firestore Active
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Authentication &amp; Firestore Data Isolation</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
