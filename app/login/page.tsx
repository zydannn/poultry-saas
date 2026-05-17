'use client';

import { useState, useEffect } from 'react';
import { Egg, Eye, EyeOff, Globe } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import type { Locale } from '@/lib/i18n';
import Link from 'next/link';
import SplashScreen from '@/components/SplashScreen';

export default function LoginPage() {
    const { t, locale, setLocale } = useLanguage();
    const router = useRouter();

    const [tab, setTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

    const [showSplash, setShowSplash] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setEmailNotConfirmed(false);

        if (tab === 'signin') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                const msg = error.message ?? '';
                if (msg.toLowerCase().includes('email not confirmed')) {
                    setEmailNotConfirmed(true);
                    setMessage({ type: 'error', text: t('authErrorEmailNotConfirmed') });
                } else if (
                    msg.toLowerCase().includes('invalid login credentials') ||
                    msg.toLowerCase().includes('invalid credentials') ||
                    msg.toLowerCase().includes('user not found')
                ) {
                    setMessage({ type: 'error', text: t('authErrorInvalidCredentials') });
                } else {
                    setMessage({ type: 'error', text: t('authError') });
                }
            } else {
                // Show splash as a transition animation after successful login
                setShowSplash(true);
                setTimeout(() => {
                    router.refresh();
                    router.push('/');
                }, 3200);
            }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) {
                setMessage({ type: 'error', text: t('authError') });
            } else {
                setMessage({ type: 'success', text: t('checkEmail') });
            }
        }
        setLoading(false);
    };

    const handleResendConfirmation = async () => {
        setResending(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        setResending(false);
        if (!error) {
            setEmailNotConfirmed(false);
            setMessage({ type: 'success', text: t('authErrorResendSuccess') });
        }
    };

    if (!isMounted) return null; // Avoid hydration mismatch

    return (
        <>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
            
            <div 
                className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12 transition-opacity duration-500 ease-in-out"
                style={{ opacity: showSplash ? 0 : 1 }}
            >
                {/* Language toggle (top-right on mobile, positioned above card) */}
                <div className="mb-6 flex items-center gap-1 rounded-full border border-border bg-background p-0.5 shadow-sm">
                    <Globe className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                    {(['en', 'id'] as Locale[]).map((loc) => (
                        <button
                            key={loc}
                            onClick={() => setLocale(loc)}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-all ${locale === loc
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {loc}
                        </button>
                    ))}
                </div>

                {/* Card */}
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-lg">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-2 border-b border-border px-6 py-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
                            <Egg className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-card-foreground">{t('appName')}</h1>
                        <p className="text-xs text-muted-foreground text-center">{t('appTagline')}</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="grid grid-cols-2 border-b border-border">
                        {(['signin', 'signup'] as const).map((tabKey) => (
                            <button
                                key={tabKey}
                                onClick={() => { setTab(tabKey); setMessage(null); }}
                                className={`py-3 text-sm font-medium transition-colors ${tab === tabKey
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tabKey === 'signin' ? t('signIn') : t('signUp')}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} className="flex flex-col gap-4 p-6">
                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                                {t('email')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('emailPlaceholder')}
                                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                                {t('password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('passwordPlaceholder')}
                                    className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Lupa Password — hanya tampil di tab signin */}
                        {tab === 'signin' && (
                            <div className="text-right -mt-2">
                                <Link
                                    href="/reset-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Lupa password?
                                </Link>
                            </div>
                        )}

                        {/* Message */}
                        {message && (
                            <div
                                className={`rounded-lg px-3 py-2.5 text-sm ${message.type === 'error'
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                    }`}
                            >
                                {message.text}
                                {/* Tombol kirim ulang email konfirmasi */}
                                {emailNotConfirmed && (
                                    <button
                                        type="button"
                                        onClick={handleResendConfirmation}
                                        disabled={resending}
                                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-white/60 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-white disabled:opacity-60"
                                    >
                                        {resending ? 'Mengirim…' : t('authErrorResendConfirmation')}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading
                                ? tab === 'signin' ? t('signingIn') : t('signingUp')
                                : tab === 'signin' ? t('signIn') : t('signUp')}
                        </button>

                        {/* Toggle link */}
                        <p className="text-center text-xs text-muted-foreground">
                            {tab === 'signin' ? t('noAccount') : t('hasAccount')}{' '}
                            <button
                                type="button"
                                onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                                className="font-medium text-primary hover:underline"
                            >
                                {tab === 'signin' ? t('signUp') : t('signIn')}
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
