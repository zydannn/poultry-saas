'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Egg, Users, Package } from 'lucide-react';
import { useEffect, useRef } from 'react';

function DashboardMockup() {
    return (
        <div className="relative w-full max-w-2xl mx-auto">
            {/* Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 rounded-3xl blur-2xl opacity-60" />

            {/* Window chrome */}
            <div className="relative rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 rounded-md bg-zinc-200 h-4 max-w-xs" />
                </div>

                {/* App layout */}
                <div className="flex h-64 sm:h-80">
                    {/* Sidebar mockup */}
                    <div className="w-14 sm:w-40 shrink-0 bg-zinc-950 flex flex-col gap-2 p-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-6 rounded bg-white/10 flex items-center justify-center">
                                <Egg className="h-3 w-3 text-white" />
                            </div>
                            <div className="hidden sm:block h-3 w-16 rounded bg-white/20" />
                        </div>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 0 ? 'bg-white/10' : ''}`}>
                                <div className="h-3 w-3 rounded bg-zinc-600" />
                                <div className="hidden sm:block h-2.5 rounded bg-zinc-700" style={{ width: `${40 + i * 8}%` }} />
                            </div>
                        ))}
                    </div>

                    {/* Main content mockup */}
                    <div className="flex-1 bg-zinc-50 p-3 sm:p-4 overflow-hidden">
                        {/* Metric cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                            {[
                                { label: 'Stok Telur', value: '2.840', icon: Egg, color: 'text-emerald-600 bg-emerald-50' },
                                { label: 'Populasi', value: '1.200', icon: Users, color: 'text-blue-600 bg-blue-50' },
                                { label: 'HPP/butir', value: 'Rp 820', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
                                { label: 'Stok Pakan', value: '240 Kg', icon: Package, color: 'text-amber-600 bg-amber-50' },
                            ].map((card) => (
                                <div key={card.label} className="rounded-xl border border-zinc-200 bg-white p-2.5 shadow-sm">
                                    <div className={`mb-1.5 inline-flex rounded-lg p-1.5 ${card.color}`}>
                                        <card.icon className="h-3 w-3" />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 leading-tight">{card.label}</p>
                                    <p className="text-xs font-bold text-zinc-900">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Chart mockup */}
                        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-3 w-28 rounded bg-zinc-200" />
                                <div className="h-3 w-12 rounded bg-zinc-100" />
                            </div>
                            <div className="flex items-end gap-1.5 h-16">
                                {[40, 65, 50, 80, 55, 90, 70, 85, 60, 75, 88, 72].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                                        <div
                                            className="rounded-sm bg-emerald-500 opacity-80"
                                            style={{ height: `${h * 0.6}%` }}
                                        />
                                        <div
                                            className="rounded-sm bg-rose-400 opacity-60"
                                            style={{ height: `${h * 0.35}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex gap-3">
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] text-zinc-400">Pendapatan</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-rose-400" />
                                    <span className="text-[9px] text-zinc-400">Biaya</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function HeroSection() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, []);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white px-4 pt-24 pb-16 sm:pt-32 sm:pb-24">
            {/* Subtle background grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }}
            />

            {/* Radial gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.06),transparent)]" />

            <div ref={ref} className="relative mx-auto w-full max-w-5xl text-center">
                {/* Badge */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Platform Manajemen Peternakan Ayam Petelur
                </div>

                {/* Headline */}
                <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl leading-[1.1]">
                    Kelola Peternakan Ayam{' '}
                    <span className="relative">
                        <span className="relative z-10 text-zinc-900">Lebih Mudah</span>
                        <span
                            className="absolute bottom-1 left-0 right-0 h-3 -z-0 rounded"
                            style={{ background: 'linear-gradient(90deg, #d1fae5, #a7f3d0)' }}
                        />
                    </span>{' '}
                    dan Menguntungkan
                </h1>

                {/* Subheadline */}
                <p className="mx-auto mt-6 max-w-xl text-base text-zinc-500 sm:text-lg leading-relaxed">
                    Pantau produksi, pakan, populasi, dan keuangan dalam satu platform modern.
                    Dirancang khusus untuk peternak Indonesia.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-700 hover:shadow-xl active:scale-95"
                    >
                        Mulai Gratis
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:shadow active:scale-95"
                    >
                        Login
                    </Link>
                </div>

                {/* Social proof */}
                <p className="mt-4 text-xs text-zinc-400">
                    Gratis selamanya · Tidak perlu kartu kredit
                </p>

                {/* Dashboard mockup */}
                <div className="mt-14 sm:mt-16">
                    <DashboardMockup />
                </div>
            </div>
        </section>
    );
}
