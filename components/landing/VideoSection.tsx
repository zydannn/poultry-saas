'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Sparkles, Keyboard, Calculator, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const STEPS = [
    {
        title: '1. Catat Input Harian',
        desc: 'Peternak menginput data produksi telur, konsumsi pakan, dan mortalitas ayam per kandang hanya dalam 1 menit.',
        icon: Keyboard,
        color: 'from-emerald-500 to-teal-400',
    },
    {
        title: '2. Hitung HPP Otomatis',
        desc: 'Sistem langsung memproses biaya bahan baku pakan, tenaga kerja, dan penyusutan aset menggunakan metode Full Costing.',
        icon: Calculator,
        color: 'from-amber-500 to-orange-400',
    },
    {
        title: '3. Laporan & BEP Siap',
        desc: 'Dashboard menyajikan analisis titik impas (BEP), margin keuntungan, dan grafik tren laba rugi secara visual.',
        icon: BarChart3,
        color: 'from-blue-500 to-cyan-400',
    },
];

export default function VideoSection() {
    const [activeStep, setActiveStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-advance step every 5 seconds if playing
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setActiveStep((prev) => (prev + 1) % STEPS.length);
            }, 5000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying]);

    const handleStepClick = (index: number) => {
        setActiveStep(index);
        setIsPlaying(false); // Pause auto-play when user interacts manually
    };

    return (
        <section id="demo" className="scroll-mt-16 bg-white py-20 px-4 sm:py-28 overflow-hidden relative">
            {/* Background design elements */}
            <div className="absolute right-[-10%] top-[20%] h-[35rem] w-[35rem] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
            <div className="absolute left-[-10%] bottom-[10%] h-[35rem] w-[35rem] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

            <div className="mx-auto max-w-5xl relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="mb-14 text-center"
                >
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        Alur Kerja Sistem
                    </p>
                    <h2 className="text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl md:text-4xl">
                        Bagaimana PoultryOS Bekerja?
                    </h2>
                    <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 sm:text-base font-medium">
                        Pelajari alur pencatatan dari data kandang harian hingga menjadi metrik finansial siap cetak.
                    </p>
                </motion.div>

                {/* Tour Controller Layout */}
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                    {/* Sidebar Steps Selector (Left Column) */}
                    <div className="lg:col-span-5 flex flex-col gap-4 order-2 lg:order-1">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = activeStep === idx;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleStepClick(idx)}
                                    className={`text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                                        isActive
                                            ? 'border-zinc-300 bg-zinc-50/50 shadow-md'
                                            : 'border-zinc-200/60 bg-white hover:border-zinc-300 hover:bg-zinc-50/30'
                                    }`}
                                >
                                    {/* Small animated progress bar indicator for active step */}
                                    {isActive && isPlaying && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-400 animate-progress" />
                                    )}

                                    <div className="flex gap-4">
                                        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-sm ${step.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className={`text-sm font-bold transition-colors ${isActive ? 'text-zinc-950' : 'text-zinc-700 group-hover:text-zinc-950'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed font-medium">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Interactive Play/Pause Controller */}
                        <div className="flex items-center justify-between px-2 mt-2">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors uppercase tracking-widest"
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="h-4 w-4 text-emerald-500" /> Auto-play Aktif
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 text-zinc-400" /> Putar Otomatis
                                    </>
                                )}
                            </button>
                            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                                Demo Interaktif · Step {activeStep + 1} dari 3
                            </span>
                        </div>
                    </div>

                    {/* Step Visualizer Frame (Right Column) */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                        <div className="relative rounded-2xl border border-zinc-200 bg-zinc-950 p-1.5 shadow-2xl aspect-[4/3] w-full overflow-hidden">
                            {/* Browser Header dots */}
                            <div className="flex items-center gap-1.5 border-b border-zinc-900 bg-zinc-950 px-4 py-3">
                                <div className="h-2 w-2 rounded-full bg-red-500/80" />
                                <div className="h-2 w-2 rounded-full bg-yellow-500/80" />
                                <div className="h-2 w-2 rounded-full bg-green-500/80" />
                                <span className="ml-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">PoultryOS Live Flow Simulator</span>
                            </div>

                            {/* View Screen content area */}
                            <div className="relative w-full h-[calc(100%-2.5rem)] bg-zinc-900 flex items-center justify-center p-6 text-white overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {activeStep === 0 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full max-w-sm flex flex-col gap-4"
                                        >
                                            <div className="text-center mb-2">
                                                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Form Input Harian</span>
                                            </div>
                                            
                                            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-4 space-y-3.5 shadow-inner">
                                                <div>
                                                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Butir Telur Utuh (Panen)</label>
                                                    <div className="relative">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '100%' }}
                                                            transition={{ delay: 0.8, duration: 1.2 }}
                                                            className="absolute inset-y-0 left-0 bg-emerald-500/5 rounded-lg border border-emerald-500/10"
                                                        />
                                                        <input type="text" readOnly value="1.450" className="h-9 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-emerald-400 font-bold focus:outline-none relative z-10" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Telur Pecah</label>
                                                    <input type="text" readOnly value="12" className="h-9 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-rose-400 font-bold focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-zinc-500 font-bold uppercase mb-1">Konsumsi Pakan (Kg)</label>
                                                    <div className="relative">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '100%' }}
                                                            transition={{ delay: 1.2, duration: 1.2 }}
                                                            className="absolute inset-y-0 left-0 bg-emerald-500/5 rounded-lg border border-emerald-500/10"
                                                        />
                                                        <input type="text" readOnly value="90" className="h-9 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs text-white font-semibold focus:outline-none relative z-10" />
                                                    </div>
                                                </div>
                                            </div>

                                            <motion.button 
                                                animate={{ scale: [1, 1.03, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.8 }}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs h-10 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                                            >
                                                Simpan Catatan Harian <CheckCircle2 className="h-4 w-4" />
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {activeStep === 1 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full max-w-sm flex flex-col gap-4"
                                        >
                                            <div className="text-center mb-1">
                                                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">Engine Kalkulasi HPP</span>
                                            </div>

                                            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-4 space-y-3.5 shadow-inner">
                                                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Pakan (BBB)</span>
                                                    <span className="text-xs font-bold">Rp 825.000</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Tenaga Kerja (BTKL)</span>
                                                    <span className="text-xs font-bold">Rp 120.000</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Overhead (BOP)</span>
                                                    <span className="text-xs font-bold">Rp 85.000</span>
                                                </div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] text-amber-400 font-bold uppercase">Total HPP per Butir</span>
                                                    <motion.span 
                                                        initial={{ opacity: 0, scale: 1.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ duration: 0.4 }}
                                                        className="text-sm font-extrabold text-amber-400"
                                                    >
                                                        Rp 1.150
                                                    </motion.span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-center">
                                                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                                                    Metode Full Costing otomatis berjalan setiap kali data harian berhasil disimpan.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeStep === 2 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full max-w-sm flex flex-col gap-4"
                                        >
                                            <div className="text-center mb-1">
                                                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider">Hasil Akhir Dashboard</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-3 shadow-inner text-center">
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Titik Impas (BEP)</p>
                                                    <p className="text-sm font-extrabold text-emerald-400 mt-1">2.450 Butir</p>
                                                </div>
                                                <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-3 shadow-inner text-center">
                                                    <p className="text-[9px] text-zinc-500 font-bold uppercase">Margin Profit</p>
                                                    <p className="text-sm font-extrabold text-blue-400 mt-1">24.5%</p>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-4 shadow-inner">
                                                <p className="text-[9px] text-zinc-500 font-bold uppercase mb-2">Simulasi Keuntungan</p>
                                                <div className="flex h-14 items-end gap-1.5 justify-center">
                                                    {[20, 35, 45, 52, 68, 80, 95].map((h, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${h}%` }}
                                                            transition={{ delay: i * 0.08, duration: 0.4 }}
                                                            className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-sm"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
