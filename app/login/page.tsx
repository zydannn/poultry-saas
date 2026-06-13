'use client';

import { useState, useEffect } from 'react';
import { Egg, Eye, EyeOff, TrendingUp, Users, Package, BarChart2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import SplashScreen from '@/components/SplashScreen';

// Mini stats untuk panel kiri
const STATS = [
    { icon: TrendingUp, label: 'HPP Otomatis', desc: 'Full Costing Method' },
    { icon: BarChart2,  label: 'Laporan Keuangan', desc: 'PDF Export siap cetak' },
    { icon: Users,      label: 'Populasi & Mortalitas', desc: 'Per batch kandang' },
    { icon: Package,    label: 'Manajemen Pakan', desc: 'Stok & konsumsi harian' },
];

export default function LoginPage() {
    const { t } = useLanguage();
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
                setShowSplash(true);
                setTimeout(() => {
                    router.refresh();
                    router.push('/dashboard');
                }, 3200);
            }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) {
                const isRateLimit = (error as { status?: number }).status === 429 || error.message?.toLowerCase().includes('rate limit');
                setMessage({
                    type: 'error',
                    text: isRateLimit
                        ? 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba daftar lagi.'
                        : t('authError'),
                });
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

    if (!isMounted) return null;

    return (
        <>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

            <div
                className="flex min-h-screen transition-opacity duration-500"
                style={{ opacity: showSplash ? 0 : 1 }}
            >
                {/* ── Kiri: Branding Panel (hidden di mobile) ── */}
                <div className="hidden md:flex md:w-5/12 lg:w-1/2 xl:w-[55%] flex-col justify-between bg-zinc-950 p-8 lg:p-10 xl:p-14 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                            backgroundSize: '48px 48px',
                        }}
                    />
                    <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />

                    {/* Logo */}
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                            <Egg className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-tight">PoultryOS</p>
                            <p className="text-[10px] text-zinc-500 leading-tight">Farm Intelligence Platform</p>
                        </div>
                    </div>

                    {/* Center: Tagline + feature list */}
                    <div className="relative">
                        <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight mb-2">
                            Kelola Peternakan Lebih{' '}
                            <span className="text-emerald-400">Mudah</span> dan{' '}
                            <span className="text-emerald-400">Menguntungkan</span>
                        </h2>
                        <p className="text-sm text-zinc-500 mb-8">
                            Satu platform untuk seluruh operasional dan keuangan peternakan ayam Anda.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            {STATS.map(({ icon: Icon, label, desc }) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:border-white/10"
                                >
                                    <div className="mb-2 inline-flex rounded-lg border border-white/10 bg-white/5 p-2">
                                        <Icon className="h-4 w-4 text-zinc-300" />
                                    </div>
                                    <p className="text-xs font-semibold text-white">{label}</p>
                                    <p className="mt-0.5 text-[11px] text-zinc-500">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="relative">
                        <p className="text-[11px] text-zinc-600">
                            © {new Date().getFullYear()} PoultryOS · Dibuat untuk peternak Indonesia
                        </p>
                    </div>
                </div>

                {/* ── Kanan: Form Panel ── */}
                <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-8">
                    {/* Mobile logo */}
                    <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 shadow-lg">
                            <Egg className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-base font-bold text-zinc-900">PoultryOS</p>
                        <p className="text-xs text-zinc-500 text-center max-w-xs">
                            Kelola Peternakan Lebih Mudah dan Menguntungkan
                        </p>
                    </div>

                    {/* Form card */}
                    <div className="w-full max-w-sm">
                        {/* Heading */}
                        <div className="mb-6">
                            <h1 className="text-xl font-bold text-zinc-900">
                                {tab === 'signin' ? 'Selamat Datang Kembali' : 'Buat Akun Gratis'}
                            </h1>
                            <p className="mt-1 text-sm text-zinc-500">
                                {tab === 'signin'
                                    ? 'Masuk ke akun PoultryOS Anda'
                                    : 'Mulai kelola peternakan Anda sekarang'}
                            </p>
                        </div>

                        {/* Tab switcher */}
                        <div className="mb-6 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                            {(['signin', 'signup'] as const).map((tabKey) => (
                                <button
                                    key={tabKey}
                                    type="button"
                                    onClick={() => { setTab(tabKey); setMessage(null); }}
                                    className={`rounded-lg py-2 text-sm font-medium transition-all ${
                                        tab === tabKey
                                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200'
                                            : 'text-zinc-500 hover:text-zinc-700'
                                    }`}
                                >
                                    {tabKey === 'signin' ? 'Masuk' : 'Daftar'}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAuth} className="flex flex-col gap-4">
                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@email.com"
                                    className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
                                />
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                                    Password
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
                                        placeholder="Min. 6 karakter"
                                        className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Lupa password */}
                            {tab === 'signin' && (
                                <div className="text-right -mt-2">
                                    <Link
                                        href="/reset-password"
                                        className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                                    >
                                        Lupa password?
                                    </Link>
                                </div>
                            )}

                            {/* Message */}
                            {message && (
                                <div className={`rounded-xl px-4 py-3 text-sm ${
                                    message.type === 'error'
                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                }`}>
                                    {message.text}
                                    {emailNotConfirmed && (
                                        <button
                                            type="button"
                                            onClick={handleResendConfirmation}
                                            disabled={resending}
                                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white/60 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-white disabled:opacity-60"
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
                                className="mt-1 h-11 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-60"
                            >
                                {loading
                                    ? (tab === 'signin' ? 'Masuk...' : 'Mendaftar...')
                                    : (tab === 'signin' ? 'Masuk' : 'Buat Akun')}
                            </button>

                            {/* Toggle */}
                            <p className="text-center text-xs text-zinc-500">
                                {tab === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
                                <button
                                    type="button"
                                    onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                                    className="font-semibold text-zinc-900 hover:underline"
                                >
                                    {tab === 'signin' ? 'Daftar gratis' : 'Masuk'}
                                </button>
                            </p>
                        </form>

                        {/* Back to landing */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/"
                                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                ← Kembali ke beranda
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
