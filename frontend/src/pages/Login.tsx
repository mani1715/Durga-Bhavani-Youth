import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

import { buildApiUrl } from '../services/api';

export const Login: React.FC = () => {
  const { login, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  const handleLangChange = (newLang: 'te' | 'en') => {
    setLang(newLang);
  };

  // If already authenticated, redirect to /home
  React.useEffect(() => {
    if (!authLoading && token) {
      navigate('/home', { replace: true });
    }
  }, [authLoading, token, navigate]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detailMsg = data.detail || '';
        if (detailMsg === 'Invalid credentials' || detailMsg.toLowerCase().includes('incorrect') || detailMsg.toLowerCase().includes('invalid')) {
          throw new Error(t.login.invalidCreds);
        }
        throw new Error(detailMsg || t.login.invalidCreds);
      }

      const data = await res.json();
      await login(data.access_token, data.refresh_token);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || t.login.defaultError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF7ED] px-4 py-8 relative selection:bg-orange-500 selection:text-white">
      {/* Top Bar with Back Button & Language Selector */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-10">
        <button 
          onClick={() => navigate('/')}
          className="text-xs sm:text-sm text-slate-700 hover:text-orange-600 flex items-center gap-1.5 font-medium transition-colors bg-white px-3 sm:px-3.5 py-2 rounded-xl border border-orange-200 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600 shrink-0" />
          <span>{t.login.backHome}</span>
        </button>

        {/* Top-Right Language Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-orange-200 shadow-sm text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => handleLangChange('te')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
              lang === 'te' 
                ? 'bg-orange-600 text-white shadow-xs font-medium' 
                : 'text-slate-600 hover:text-orange-600 font-normal'
            }`}
          >
            తెలుగు
          </button>
          <span className="text-slate-300 mx-0.5">|</span>
          <button
            type="button"
            onClick={() => handleLangChange('en')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
              lang === 'en' 
                ? 'bg-orange-600 text-white shadow-xs font-medium' 
                : 'text-slate-600 hover:text-orange-600 font-normal'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-orange-200 shadow-xl relative overflow-hidden mt-12 sm:mt-0">
        {/* Decorative Ambient Gradients */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="text-center mb-6 relative">
          <div className="inline-flex h-16 w-16 rounded-full overflow-hidden border-2 border-orange-400 shadow-md shadow-orange-500/20 mb-3 bg-white p-0.5">
            <img 
              src="/committee-photo-logo.webp" 
              alt={lang === 'te' ? 'దుర్గాభవాని యూత్ లోగో' : 'Durga Bhavani Youth Logo'} 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h2 className="text-2xl font-medium text-slate-900">
            {t.login.title}
          </h2>
          <p className="text-sm font-medium text-orange-700 mt-1">
            {t.login.orgName}
          </p>
          <p className="text-xs sm:text-sm font-normal text-slate-600 mt-0.5">
            {t.login.portalSub}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-sm font-medium text-slate-800 uppercase tracking-normal mb-1.5">
              {t.login.labelIdentifier}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-slate-900 font-normal placeholder-slate-400"
              placeholder={t.login.placeholderIdentifier}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 uppercase tracking-normal mb-1.5">
              {t.login.labelPassword}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-orange-500 focus:bg-white rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-slate-900 font-normal placeholder-slate-400 pr-10"
                placeholder={t.login.placeholderPassword}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm sm:text-base font-medium shadow-lg shadow-orange-500/25 transition-all duration-150 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>{loading ? t.login.btnLoading : t.login.btnSubmit}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs sm:text-sm font-normal text-slate-500 leading-relaxed">
            {t.login.footerNote}
          </p>
        </div>
      </div>
    </div>
  );
};
