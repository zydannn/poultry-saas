'use client';

import { useEffect, useRef } from 'react';
import { X, Check, FileText, Calculator, FolderOpen, BarChart2 } from 'lucide-react';

const PROBLEMS = [
    { icon: FileText,   text: 'Catatan produksi masih manual di buku atau kertas' },
    { icon: Calculator, text: 'Sulit menghitung HPP telur secara akurat' },
    { icon: FolderOpen, text: 'Data produksi dan keuangan tercecer di mana-mana' },
    { icon: BarChart2,  text: 'Tidak tahu apakah usaha sedang untung atau rugi' },
];

const SOLUTIONS = [
    'Pencatatan harian produksi, pakan, dan mortalitas secara digital',
    'Kalkulasi HPP otomatis dengan metode Full Costing',
    'Semua data terpusat: laporan keuangan, stok, dan populasi',
    'Dashboard real-time: profit, BEP, dan tren bulanan langsung terlihat',
];

function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(32px)';
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                    obs.disconnect();
                }
            },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return ref;
}

export default function ProblemSection() {
    const ref = useScrollReveal();

    return (
        <section className="bg-zinc-50 py-20 sm:py-28 px-4">
            <div ref={ref} className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-14">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Masalah → Solusi
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
                        Kenali Masalahnya,{' '}
                        <span className="text-emerald-600">PoultryOS Solusinya</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto">
                        Banyak peternak menghadapi tantangan yang sama setiap hari.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Problems */}
                    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 sm:p-8">
                        <div className="mb-6 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                                <X className="h-3.5 w-3.5 text-red-500" />
                            </div>
                            <h3 className="text-sm font-semibold text-red-700">Tanpa PoultryOS</h3>
                        </div>
                        <ul className="space-y-4">
                            {PROBLEMS.map(({ icon: Icon, text }) => (
                                <li key={text} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-red-100 shadow-sm">
                                        <Icon className="h-3.5 w-3.5 text-red-400" />
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Solutions */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 sm:p-8">
                        <div className="mb-6 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-semibold text-emerald-700">Dengan PoultryOS</h3>
                        </div>
                        <ul className="space-y-4">
                            {SOLUTIONS.map((text) => (
                                <li key={text} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    </div>
                                    <p className="text-sm text-zinc-700 leading-relaxed">{text}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
