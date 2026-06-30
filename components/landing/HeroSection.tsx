'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Egg, Users, Package, Play, ChevronRight, Activity } from 'lucide-react';
import { motion, useInView, animate } from 'framer-motion';
import { Fragment, useEffect, useRef, useState } from 'react';

// ─── Count-up number animation ───────────────────────────────
function CountUp({
    to,
    prefix = '',
    suffix = '',
    duration = 1.4,
}: {
    to: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const [val, setVal] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const controls = animate(0, to, {
            duration,
            ease: 'easeOut',
            onUpdate: (v) => setVal(v),
        });
        return () => controls.stop();
    }, [inView, to, duration]);

    return (
        <span ref={ref} className="font-bold tracking-tight">
            {prefix}
            {Math.round(val).toLocaleString('id-ID')}
            {suffix}
        </span>
    );
}

const STATS = [
    { node: <CountUp to={6} suffix="+" />, label: 'Modul Terintegrasi' },
    { node: <CountUp to={100} suffix="%" />, label: 'Gratis Selamanya' },
    { node: <><CountUp to={5} prefix="<" /> mnt</>, label: 'Setup Akun' },
    { node: <>Real-time</>, label: 'Sinkronisasi Cloud' },
];

// ─── Highly detailed and colorful premium Dashboard Mockup ─────────────────────────────────────────
function DashboardMockup() {
    return (
        <div className="relative w-full max-w-4xl mx-auto px-4">
            {/* Ambient Glows */}
            <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -right-10 -bottom-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-md shadow-2xl overflow-hidden glow-white">
                {/* Titlebar / Header browser mockup */}
                <div className="flex items-center justify-between border-b border-zinc-200/60 bg-zinc-50/80 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-400/90 shadow-sm" />
                        <div className="h-3 w-3 rounded-full bg-yellow-400/90 shadow-sm" />
                        <div className="h-3 w-3 rounded-full bg-green-400/90 shadow-sm" />
                        <div className="ml-4 flex items-center gap-2 rounded-lg bg-zinc-200/50 px-3 py-1 text-[10px] text-zinc-500 font-medium">
                            <span>app.poultryos.com/dashboard</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-8 rounded bg-zinc-300/60" />
                        <div className="h-5 w-5 rounded-full bg-zinc-300" />
                    </div>
                </div>

                {/* Dashboard Inner App Workspace */}
                <div className="flex h-72 sm:h-96">
                    {/* Sidebar mockup */}
                    <div className="w-14 sm:w-44 shrink-0 bg-zinc-950 flex flex-col justify-between p-3 border-r border-zinc-900">
                        <div className="flex flex-col gap-1.5">
                            {/* Logo inside sidebar */}
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center">
                                    <Egg className="h-3 w-3 text-white" />
                                </div>
                                <div className="hidden sm:block h-3 w-16 rounded bg-white/20" />
                            </div>
                            
                            {[
                                { active: true, name: 'Dashboard' },
                                { active: false, name: 'Data Harian' },
                                { active: false, name: 'Manajemen Pakan' },
                                { active: false, name: 'Analisis HPP' },
                                { active: false, name: 'Laporan BEP' },
                                { active: false, name: 'Data Kandang' },
                            ].map((item, i) => (
                                <div 
                                    key={i} 
                                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                                        item.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`h-3.5 w-3.5 rounded flex items-center justify-center ${item.active ? 'bg-emerald-500 text-white' : 'bg-zinc-800'}`}>
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                        <span className="hidden sm:inline text-[10px] font-semibold tracking-wide truncate">{item.name}</span>
                                    </div>
                                    {item.active && <ChevronRight className="hidden sm:block h-3 w-3 shrink-0" />}
                                </div>
                            ))}
                        </div>
                        <div className="hidden sm:block rounded-xl bg-zinc-900 border border-zinc-800 p-2.5">
                            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                                <Activity className="h-3 w-3" />
                                <span className="text-[9px] font-bold uppercase">Status</span>
                            </div>
                            <p className="text-[9px] text-zinc-400 font-semibold leading-tight">Server Online</p>
                        </div>
                    </div>

                    {/* Dashboard Main Panel mockup */}
                    <div className="flex-1 bg-zinc-50/50 p-4 sm:p-6 overflow-hidden flex flex-col justify-between">
                        {/* Upper Analytics Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {[
                                { label: 'Stok Telur', value: '2.840', icon: Egg, color: 'text-emerald-600 bg-emerald-100/80 shadow-emerald-100/50' },
                                { label: 'Populasi', value: '1.200', icon: Users, color: 'text-blue-600 bg-blue-100/80 shadow-blue-100/50' },
                                { label: 'HPP/butir', value: 'Rp 820', icon: TrendingUp, color: 'text-violet-600 bg-violet-100/80 shadow-violet-100/50' },
                                { label: 'Stok Pakan', value: '240 Kg', icon: Package, color: 'text-amber-600 bg-amber-100/80 shadow-amber-100/50' },
                            ].map((card, idx) => (
                                <div key={idx} className="rounded-xl border border-zinc-200/55 bg-white p-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[9px] font-semibold text-zinc-500 tracking-wide uppercase truncate">{card.label}</p>
                                        <div className={`rounded-lg p-1.5 shadow-inner ${card.color}`}>
                                            <card.icon className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Middle detailed chart mockup */}
                        <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-800 tracking-wide uppercase">Analisis Laba Rugi</h4>
                                    <p className="text-[9px] text-zinc-400 font-semibold">Distribusi Pendapatan & Biaya Bulanan</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-semibold text-zinc-500">Pendapatan</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-rose-400" />
                                        <span className="text-[9px] font-semibold text-zinc-500">Biaya</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex items-end gap-2 h-20 sm:h-28">
                                {[42, 68, 55, 85, 60, 95, 72, 88, 64, 80, 90, 75].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 flex flex-col justify-end gap-1"
                                        initial={{ scaleY: 0 }}
                                        whileInView={{ scaleY: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.5 + i * 0.04, duration: 0.5, ease: 'easeOut' }}
                                        style={{ transformOrigin: 'bottom' }}
                                    >
                                        <div className="rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm" style={{ height: `${h * 0.55}%` }} />
                                        <div className="rounded-sm bg-gradient-to-t from-rose-500 to-rose-400 shadow-sm" style={{ height: `${h * 0.3}%` }} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const HEADLINE_LINE_1 = ['Kelola', 'Peternakan', 'Ayam'];
const HEADLINE_LINE_2 = ['Lebih', 'Mudah', 'dan', 'Menguntungkan'];

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white px-4 pt-28 pb-16 sm:pt-36 sm:pb-24">
            {/* Background design grid */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '56px 56px',
                }}
            />
            
            {/* Premium Animated Blobs */}
            <div className="pointer-events-none absolute left-[-10%] top-[-5%] h-[40rem] w-[40rem] rounded-full bg-emerald-400/10 blur-3xl animate-float" />
            <div className="pointer-events-none absolute right-[-10%] bottom-[-5%] h-[40rem] w-[40rem] rounded-full bg-amber-400/10 blur-3xl animate-float-reverse" />
            
            <div className="relative mx-auto w-full max-w-5xl text-center z-10">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm shadow-emerald-500/5"
                >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-glow" />
                    Platform Manajemen Peternakan Ayam Petelur
                </motion.div>

                {/* Headline word-by-word with beautiful custom gradient text */}
                <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl leading-[1.08]">
                    <span className="inline-block">
                        {HEADLINE_LINE_1.map((word, i) => (
                            <Fragment key={i}>
                                <motion.span
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
                                    className="inline-block"
                                >
                                    {word}
                                </motion.span>
                                {i < HEADLINE_LINE_1.length - 1 ? ' ' : ''}
                            </Fragment>
                        ))}
                    </span>
                    <br />
                    <span className="inline-block">
                        {HEADLINE_LINE_2.map((word, i) => {
                            const isHighlight = word === 'Menguntungkan';
                            return (
                                <Fragment key={i}>
                                    <motion.span
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + (HEADLINE_LINE_1.length + i) * 0.08, duration: 0.5, ease: 'easeOut' }}
                                        className="inline-block"
                                    >
                                        {isHighlight ? (
                                            <span className="relative inline-block text-gradient px-2 py-0.5">
                                                <span className="relative z-10">{word}</span>
                                                <span
                                                    className="absolute bottom-1.5 left-0 right-0 h-3 -z-0 rounded-md bg-emerald-100/80 shadow-sm"
                                                />
                                            </span>
                                        ) : (
                                            word
                                        )}
                                    </motion.span>
                                    {i < HEADLINE_LINE_2.length - 1 ? ' ' : ''}
                                </Fragment>
                            );
                        })}
                    </span>
                </h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65, duration: 0.6 }}
                    className="mx-auto mt-6 max-w-xl text-base text-zinc-600 sm:text-lg leading-relaxed font-medium"
                >
                    Pantau produksi telur, pakan, populasi, dan kalkulasi HPP otomatis dalam satu dashboard terintegrasi. Dirancang presisi untuk peternak Indonesia.
                </motion.p>

                {/* Interactive CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75, duration: 0.6 }}
                    className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
                >
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 px-6.5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-zinc-950/10 hover:shadow-2xl hover:shadow-zinc-950/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                    >
                        Mulai Gratis Sekarang
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <a
                        href="#demo"
                        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 hover:bg-white px-6.5 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm shadow-zinc-100 hover:border-zinc-300 hover:shadow active:scale-95 transition-all duration-300"
                    >
                        <Play className="h-4 w-4 fill-zinc-600 text-zinc-600 group-hover:fill-emerald-500 group-hover:text-emerald-500 transition-colors" />
                        Tonton Demo Asisten
                    </a>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="mt-4 text-xs font-semibold text-zinc-400 uppercase tracking-widest"
                >
                    Free account · No credit card required · Instant setup
                </motion.p>

                {/* Glassmorphic Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.95, duration: 0.6 }}
                    className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
                >
                    {STATS.map((stat, i) => (
                        <div key={i} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4.5 text-center shadow-sm backdrop-blur-sm">
                            <p className="text-xl sm:text-2xl font-extrabold text-zinc-950">{stat.node}</p>
                            <p className="mt-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wide">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Detailed Premium Dashboard mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="mt-16 sm:mt-20"
                >
                    <DashboardMockup />
                </motion.div>
            </div>
        </section>
    );
}
