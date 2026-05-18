'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, User, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/utils/supabase/client';
import { type TranslationKey } from '@/lib/i18n';

// ─── Page title + subtitle map ───────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
    '/':             'Dasbor',
    '/daily-input':  'Input Harian',
    '/kalkulasi-hpp':'Kalkulasi HPP',
    '/keuangan':     'Keuangan',
    '/laporan':      'Laporan',
    '/pengaturan':   'Pengaturan',
    '/inventory':    'Inventaris',
    '/flocks':       'Manajemen Batch Ayam',
    '/pusat-data':   'Pusat Data',
};

const PAGE_SUBTITLES: Record<string, string> = {
    '/':             'Ringkasan operasional',
    '/daily-input':  'Catat produksi harian',
    '/kalkulasi-hpp':'Analisis biaya produksi',
    '/keuangan':     'Arus kas & transaksi',
    '/laporan':      'Analisis & laporan',
    '/pengaturan':   'Konfigurasi aplikasi',
    '/inventory':    'Kelola stok & aset',
    '/flocks':       'Manajemen batch',
    '/pusat-data':   'Ekspor & arsip data',
};

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
    userEmail?:    string;
    onMenuClick?:  () => void;
}

export default function Header({ userEmail, onMenuClick }: HeaderProps) {
    const { t } = useLanguage();
    const router    = useRouter();
    const pathname  = usePathname();

    const [loggingOut,    setLoggingOut]    = useState(false);
    const [dropdownOpen,  setDropdownOpen]  = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        setDropdownOpen(false);
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    // Derive page title + subtitle from current route
    const pageTitle = PAGE_TITLES[pathname]
        ?? (pathname.startsWith('/flocks/') ? 'Detail Batch Ayam' : 'Dashboard');

    const pageSubtitle = PAGE_SUBTITLES[pathname]
        ?? (pathname.startsWith('/flocks/') ? 'Detail batch ayam' : null);

    const currentPeriod = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Derive avatar initials from email
    const initials = userEmail
        ? userEmail.slice(0, 2).toUpperCase()
        : 'U';

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
                {/* ── Mobile hamburger ── */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
                        aria-label="Open navigation"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}

                {/* ── Page title (left) ── */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-semibold text-slate-800 truncate">{pageTitle}</h1>
                    {pageSubtitle && (
                        <p className="hidden text-xs text-slate-400 sm:block">
                            {pageSubtitle} · {currentPeriod}
                        </p>
                    )}
                </div>

                {/* ── Right controls ── */}
                <div className="flex items-center gap-3">

                    {/* User profile dropdown */}
                    {userEmail && (
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-gray-50"
                            >
                                {/* Avatar circle */}
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white shrink-0">
                                    {initials}
                                </span>
                                <span className="hidden max-w-[140px] truncate text-xs sm:block">
                                    {userEmail}
                                </span>
                                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                                    {/* User info */}
                                    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                                            {initials}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-slate-700">{userEmail}</p>
                                            <p className="text-[10px] text-slate-400">Admin</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="p-1.5">
                                        <button
                                            onClick={handleLogout}
                                            disabled={loggingOut}
                                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                                        >
                                            <LogOut className="h-4 w-4 shrink-0" />
                                            <span>{loggingOut ? t('logoutConfirm') : t('logout')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </header>
    );
}
