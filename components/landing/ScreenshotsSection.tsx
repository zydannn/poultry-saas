'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Layout, Calculator, LineChart, CheckCircle2, TrendingUp, Info } from 'lucide-react';

const TABS = [
    {
        id: 'dashboard',
        label: 'Dashboard Produksi',
        icon: Layout,
        title: 'Kelola Produksi Secara Real-Time',
        desc: 'Pantau total panen harian, performa HDP, status pakan aktif, dan sisa ayam bertelur di semua kandang dalam satu layar ringkas.',
        badge: 'Utama',
    },
    {
        id: 'hpp',
        label: 'Analisis HPP',
        icon: Calculator,
        title: 'HPP Akurat Metode Full Costing',
        desc: 'Lacak pengeluaran pakan (BBB), gaji pekerja kandang (BTKL), hingga penyusutan penyusutan ayam (depresiasi pullet) secara otomatis.',
        badge: 'Akuntansi',
    },
    {
        id: 'bep',
        label: 'Analisis BEP & Profit',
        icon: LineChart,
        title: 'Visualisasi Profit & Titik Impas',
        desc: 'Ketahui di butir ke berapa peternakan Anda mencapai Break Even Point (BEP). Optimalkan harga jual dengan simulasi cerdas.',
        badge: 'Finansial',
    },
];

export default function ScreenshotsSection() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <section className="bg-zinc-50 py-20 sm:py-28 px-4 border-b border-zinc-200/50">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Tur Antarmuka</p>
                    <h2 className="text-2xl font-bold leading-tight text-zinc-950 sm:text-3xl md:text-4xl">
                        Tampilan Modern,<span className="text-zinc-500"> Mudah Dipahami</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-500 sm:text-base font-medium">
                        Dirancang khusus dengan prinsip ergonomi visual agar peternak pemula pun langsung mengerti data mereka.
                    </p>
                </div>

                {/* Interactive Slider/Tabs Wrapper */}
                <div className="flex flex-col gap-8">
                    {/* Tab Selectors */}
                    <div className="flex flex-wrap items-center justify-center gap-2 border-b border-zinc-200/60 pb-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
                                        isActive
                                            ? 'border-emerald-500 text-emerald-600 bg-white shadow-sm shadow-emerald-500/5'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/50'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200/60 text-zinc-600'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Detailed Mockup Interface Screen */}
                    <div className="grid md:grid-cols-12 gap-8 items-center">
                        {/* Info details (left) */}
                        <div className="md:col-span-4 flex flex-col gap-4">
                            {TABS.map((tab) => {
                                if (tab.id !== activeTab) return null;
                                return (
                                    <motion.div
                                        key={tab.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <h3 className="text-lg font-bold text-zinc-950">{tab.title}</h3>
                                        <p className="text-sm text-zinc-500 leading-relaxed font-medium">{tab.desc}</p>
                                        
                                        <div className="space-y-2 pt-2">
                                            {[
                                                'Responsif di Handphone & Laptop',
                                                'Terhubung dengan Database Supabase',
                                                'Ekspor Excel & PDF dengan 1 klik',
                                            ].map((text) => (
                                                <div key={text} className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    <span>{text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Interactive UI Screen Mock (right) */}
                        <div className="md:col-span-8">
                            <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xl p-1.5 overflow-hidden w-full relative">
                                {/* Browser Toolbar */}
                                <div className="flex items-center gap-1.5 border-b border-zinc-150 bg-zinc-50 px-3 py-2">
                                    <div className="h-2 w-2 rounded-full bg-red-400" />
                                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                                    <div className="h-2 w-2 rounded-full bg-green-400" />
                                    <span className="text-[9px] text-zinc-400 font-semibold tracking-wider ml-2">Secure Sandbox Mode</span>
                                </div>

                                {/* Simulator Viewport */}
                                <div className="h-64 sm:h-80 bg-zinc-900/5 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'dashboard' && (
                                            <motion.div
                                                key="dash-mock"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="h-full flex flex-col gap-3.5"
                                            >
                                                {/* Mini cards */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { title: 'Panen Hari Ini', val: '2.840', badge: 'Stabil', col: 'text-emerald-500 bg-emerald-50' },
                                                        { title: 'Stok Gudang', val: '1.696', badge: '+12%', col: 'text-blue-500 bg-blue-50' },
                                                        { title: 'Persen HDP', val: '86.4%', badge: 'Target HDP', col: 'text-violet-500 bg-violet-50' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="rounded-xl border border-zinc-200/60 bg-white p-3 shadow-sm relative overflow-hidden">
                                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{item.title}</p>
                                                            <p className="text-base font-extrabold text-zinc-950 mt-1">{item.val}</p>
                                                            <span className={`absolute top-2 right-2 text-[8px] font-bold px-1 py-0.2 rounded ${item.col}`}>{item.badge}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Graphic section mockup */}
                                                <div className="flex-1 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm flex flex-col justify-between">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[9px] font-bold text-zinc-700 uppercase">Tren HDP Harian</span>
                                                        <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Grafik Bagus</span>
                                                    </div>
                                                    {/* Custom line svg */}
                                                    <div className="flex-1 flex items-end">
                                                        <svg viewBox="0 0 300 80" className="w-full h-16 sm:h-24">
                                                            <path d="M0,60 Q30,40 60,50 T120,20 T180,30 T240,10 T300,5" fill="none" stroke="#10b981" strokeWidth="3" />
                                                            <path d="M0,60 Q30,40 60,50 T120,20 T180,30 T240,10 T300,5 L300,80 L0,80 Z" fill="rgba(16,185,129,0.06)" />
                                                            <circle cx="240" cy="10" r="4" fill="#10b981" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'hpp' && (
                                            <motion.div
                                                key="hpp-mock"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="h-full flex flex-col gap-3.5"
                                            >
                                                {/* Top summary bar */}
                                                <div className="flex items-center justify-between rounded-xl bg-zinc-950 text-white p-4 shadow-md">
                                                    <div>
                                                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">HPP per Butir Bulan Juni</p>
                                                        <p className="text-lg font-black text-amber-400 mt-0.5">Rp 1.150 <span className="text-xs font-semibold text-zinc-400">/butir</span></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Setara HPP per Kg</p>
                                                        <p className="text-sm font-extrabold text-white mt-0.5">Rp 19.167 <span className="text-[10px] font-semibold text-zinc-400">/Kg</span></p>
                                                    </div>
                                                </div>

                                                {/* Break down cost chart list */}
                                                <div className="flex-1 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm flex flex-col gap-2 justify-center">
                                                    <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Rincian Komponen Biaya HPP</p>
                                                    {[
                                                        { name: 'Pakan (BBB)', val: 'Rp 825', percent: '71.7%', col: 'bg-emerald-500' },
                                                        { name: 'Pekerja Kandang (BTKL)', val: 'Rp 120', percent: '10.4%', col: 'bg-blue-500' },
                                                        { name: 'Overhead & Listrik (BOP)', val: 'Rp 85', percent: '7.4%', col: 'bg-amber-500' },
                                                        { name: 'Depresiasi Ayam (Pullet)', val: 'Rp 120', percent: '10.5%', col: 'bg-violet-500' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex flex-col gap-1">
                                                            <div className="flex justify-between text-[9px] font-semibold text-zinc-600">
                                                                <span>{item.name}</span>
                                                                <span className="font-bold text-zinc-900">{item.val} ({item.percent})</span>
                                                            </div>
                                                            <div className="h-1.5 w-full rounded bg-zinc-100 overflow-hidden">
                                                                <div className={`h-full rounded ${item.col}`} style={{ width: item.percent }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'bep' && (
                                            <motion.div
                                                key="bep-mock"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="h-full flex flex-col gap-3.5"
                                            >
                                                {/* Card BEP target stats */}
                                                <div className="bg-white rounded-xl border border-zinc-200/60 p-4 flex items-center justify-between shadow-sm">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Break-Even Point (BEP)</span>
                                                        <p className="text-base font-extrabold text-zinc-950 mt-1">2.450 Butir / Hari</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Harga Pasar Terkini</span>
                                                        <p className="text-sm font-extrabold text-emerald-600 mt-1">Rp 1.450 / Butir</p>
                                                    </div>
                                                </div>

                                                {/* Chart lines simulation preview */}
                                                <div className="flex-1 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                                    <div className="flex justify-between items-center mb-1 z-10">
                                                        <span className="text-[9px] font-bold text-zinc-700 uppercase">Kurva BEP Analitik</span>
                                                        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                            <TrendingUp className="h-3 w-3" /> Profit Tercapai
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Chart curves SVG lines */}
                                                    <div className="flex-1 flex items-end">
                                                        <svg viewBox="0 0 300 80" className="w-full h-16 sm:h-20">
                                                            {/* Fixed Cost Line (Biaya tetap) */}
                                                            <line x1="0" y1="50" x2="300" y2="50" stroke="#d4d4d8" strokeWidth="2" strokeDasharray="3 3" />
                                                            {/* Total Cost Line (Biaya total) */}
                                                            <line x1="0" y1="50" x2="300" y2="25" stroke="#f59e0b" strokeWidth="2.5" />
                                                            {/* Revenue Line (Pendapatan) */}
                                                            <line x1="0" y1="75" x2="300" y2="10" stroke="#10b981" strokeWidth="2.5" />
                                                            
                                                            {/* Intersection dot (BEP) */}
                                                            <circle cx="150" cy="37.5" r="4.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                                                        </svg>
                                                        
                                                        {/* BEP indicator tag badge */}
                                                        <div className="absolute left-[52%] top-[45%] rounded bg-zinc-950 px-1.5 py-0.5 text-[8px] font-bold text-white shadow shadow-zinc-950/20 flex items-center gap-1 z-10">
                                                            <Info className="h-2.5 w-2.5 text-amber-400" /> BEP (Titik Impas)
                                                        </div>
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
            </div>
        </section>
    );
}
