import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Flower2, Sparkles } from 'lucide-react';
import { IMAGES } from '../data/dagupanCatalog';
import { ScreenId, UserAccount } from '../types/floraview';
import { ResilientImage } from '../components/ResilientImage';

interface LoginScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onEmailLogin: (email: string, password: string) => Promise<UserAccount>;
  onGoogleSignIn: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigate,
  onEmailLogin,
  onGoogleSignIn,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both your email or username and password.');
      return;
    }
    setLoading(true);
    try {
      const loggedIn = await onEmailLogin(email.trim(), password);
      onNavigate(loggedIn.role === 'admin' ? 'admin' : 'home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async () => {
    setEmail('clara.reyes@dagupanflora.ph');
    setPassword('Flora2026!');
    setError(null);
    setLoading(true);
    try {
      const loggedIn = await onEmailLogin('clara.reyes@dagupanflora.ph', 'Flora2026!');
      onNavigate(loggedIn.role === 'admin' ? 'admin' : 'home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await onGoogleSignIn();
      onNavigate('home');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google sign-in popup was closed. Use Demo Account or email sign-in below.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-12 bg-[#FAF9F7]">
      {/* Left Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center px-5 py-6 sm:px-10 lg:px-16 max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="min-h-[44px] px-2 -ml-2 flex items-center gap-1.5 text-sm font-medium text-[#536159] hover:text-[#16211B] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] px-3 text-xs font-medium text-[#536159] hover:text-[#16211B] cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#1B4332] mb-2">
          <Flower2 className="w-4 h-4" />
          <span>FloraView Dagupan</span>
          <span aria-hidden="true">·</span>
          <span>Member &amp; Admin Sign In</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#16211B] tracking-tight">
          Welcome Back to the Atelier
        </h1>
        <p className="mt-1.5 text-sm text-[#536159]">
          Log in to access your saved 3D bouquet designs, Dagupan barangay addresses, or the Atelier Admin dispatch desk.
        </p>

        {/* 1-Tap Demo Customer Login Helper */}
        <div className="mt-5 p-3.5 rounded-xl bg-[#F1F0EC] border border-[#E4E2DC] flex items-center justify-between gap-3">
          <div className="text-xs min-w-0">
            <p className="font-semibold text-[#16211B]">Instant Demo Customer</p>
            <p className="text-[#536159] font-mono truncate">clara.reyes@dagupanflora.ph</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleDemoFill}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#143326] shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Sign In</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-[#FDF2F4] border border-[#F3C6D0] text-xs font-medium text-[#8E1F3A]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#16211B] mb-1.5"
            >
              Email or Username
            </label>
            <input
              id="login-email"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              required
              placeholder="clara.reyes@dagupanflora.ph or admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#D5D2CA] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#16211B] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] pl-3.5 pr-12 py-2 rounded-xl bg-white border border-[#D5D2CA] text-sm text-[#16211B] focus:outline-none focus:border-[#1B4332]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#536159] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#143326] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Log In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-[#536159]">
          <div className="h-px flex-1 bg-[#E4E2DC]" />
          <span>or</span>
          <div className="h-px flex-1 bg-[#E4E2DC]" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-white border border-[#D5D2CA] text-sm font-semibold text-[#16211B] flex items-center justify-center gap-3 hover:bg-[#F1F0EC] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        <div className="mt-6 pt-4 border-t border-[#E4E2DC] flex items-center justify-between text-xs text-[#536159]">
          <span>Don&apos;t have an account yet?</span>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="min-h-[44px] px-2 font-semibold text-[#1B4332] underline underline-offset-4 cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Right Visual Showcase Column (Desktop) */}
      <div className="hidden lg:block lg:col-span-5 relative bg-[#16211B]">
        <ResilientImage
          src={IMAGES.stargazerOrchid}
          alt="Stargazer Lily and Phalaenopsis Orchid arrangement"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1712]/80 via-transparent to-[#0E1712]/25" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-xs font-mono text-[#E8D5B5] mb-1">
            Lucao Garden Atelier · Dagupan City
          </p>
          <p className="font-serif text-2xl font-semibold">
            Freshly cut every morning and delivered chilled across Pangasinan.
          </p>
        </div>
      </div>
    </div>
  );
};
