'use client';

import { motion } from 'framer-motion';
import { X, Check, FileText, Calculator, FolderOpen, BarChart2, ShieldAlert, Sparkles } from 'lucide-react';

const PROBLEMS = [
    { icon: FileText, text: 'Catatan produksi manual di buku, rawan hilang & basah' },
    { icon: Calculator, text: 'Sulit & rumit menghitung HPP telur secara akurat' },
    { icon: FolderOpen, text: 'Data harian & keuangan tercecer di lembaran kertas' },
    { icon: BarChart2, text: 'Menebak-nebak laba rugi peternakan tanpa kepastian' },
];

const SOLUTIONS = [
    { icon: FileText, text: 'Pencatatan digital cepat untuk produksi, pakan, & mortalitas' },
    { icon: Calculator, text: 'Kalkulasi HPP otomatis per butir & per kg real-time' },
    { icon: FolderOpen, text: 'Data aman terpusat di cloud, diakses kapan saja' },
    { icon: BarChart2, text: 'Dashboard laba rugi & BEP otomatis siap ekspor PDF' },
];

export default function ProblemSection() {
    return (
        <section className="bg-zinc-50 py-20 sm:py-28 px-4 border-y border-zinc-200/50 relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="mx-auto max-w-5xl relative z-10">
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Masalah → Solusi
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 leading-tight">
                        Tinggalkan Cara Lama, <br className="sm:hidden" />
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">PoultryOS Solusinya</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto font-medium">
                        Banyak peternak menghadapi tantangan pencatatan manual yang melelahkan setiap hari. Saatnya beralih ke digital.
                    </p>
                </motion.div>

                {/* Grid Comparison */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Problems Card - Red Theme */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="rounded-2xl border border-red-100 bg-white p-6 sm:p-8 shadow-md shadow-red-500/5 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 relative group overflow-hidden"
                    >
                        {/* Red Accent top border */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
                        
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
                                    <X className="h-4 w-4 text-red-500" />
                                </div>
                                <h3 className="text-base font-bold text-red-950">Cara Lama (Manual)</h3>
                            </div>
                            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-wider">Membingungkan</span>
                        </div>
                        
                        <ul className="space-y-5">
                            {PROBLEMS.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3.5 group/item">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50/50 border border-red-100/50 shadow-sm transition-transform group-hover/item:scale-105 duration-200">
                                        <item.icon className="h-4 w-4 text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-700 leading-normal">{item.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Solutions Card - Emerald Theme */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="rounded-2xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-md shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 relative group overflow-hidden"
                    >
                        {/* Green Accent top border */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                                    <Check className="h-4 w-4 text-emerald-600" />
                                </div>
                                <h3 className="text-base font-bold text-emerald-950">Pakai PoultryOS</h3>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-3 w-3 animate-pulse" /> Solusi Cerdas
                            </span>
                        </div>
                        
                        <ul className="space-y-5">
                            {SOLUTIONS.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3.5 group/item">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100/50 shadow-sm transition-transform group-hover/item:scale-105 duration-200">
                                        <item.icon className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-800 leading-normal">{item.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
