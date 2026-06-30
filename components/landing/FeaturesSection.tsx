'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Egg, Package, Calculator, BarChart2, Users, ArrowUpRight, Sparkles } from 'lucide-react';

const BENTO_FEATURES = [
    { 
        icon: LayoutDashboard, 
        title: 'Dashboard Produksi Canggih', 
        desc: 'Lihat ringkasan produksi harian, metrik Hen Day Production (HDP), stok telur, dan performa per batch kandang secara live.', 
        color: 'text-violet-600 bg-violet-50 border-violet-100/70', 
        badge: 'Real-time',
        grid: 'md:col-span-2' // Bento card size
    },
    { 
        icon: Calculator, 
        title: 'Kalkulasi HPP Otomatis', 
        desc: 'Kalkulasi instan Harga Pokok Produksi menggunakan metode akuntansi Full Costing (Biaya Bahan Baku + Tenaga Kerja + Overhead BOP + Pullet).', 
        color: 'text-amber-600 bg-amber-50 border-amber-100/70', 
        badge: 'Full Costing',
        grid: 'md:col-span-1' // Bento card size
    },
    { 
        icon: Egg, 
        title: 'Monitoring Stok Telur', 
        desc: 'Pencatatan produksi telur baik & pecah secara harian. Mengurangi resiko selisih stok gudang.', 
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100/70', 
        badge: 'Ledger Otomatis',
        grid: 'md:col-span-1'
    },
    { 
        icon: Package, 
        title: 'Manajemen Pakan', 
        desc: 'Kelola keluar-masuk stok pakan konsentrat, jagung, atau dedak. Pantau sisa hari pakan agar tidak kekurangan.', 
        color: 'text-blue-600 bg-blue-50 border-blue-100/70', 
        badge: 'Inventory',
        grid: 'md:col-span-1'
    },
    { 
        icon: BarChart2, 
        title: 'Laporan Finansial & Laba Rugi', 
        desc: 'Sajikan grafik profitabilitas bersih bulanan, break-even point chart, dan download laporan berformat rapi siap cetak PDF.', 
        color: 'text-rose-600 bg-rose-50 border-rose-100/70', 
        badge: 'PDF Export',
        grid: 'md:col-span-1'
    },
    { 
        icon: Users, 
        title: 'Multi-Kandang & Populasi', 
        desc: 'Pantau jumlah ayam aktif, mortalitas (kematian), pemindahan kandang, dan FCR (Feed Conversion Ratio) per sekat kandang.', 
        color: 'text-teal-600 bg-teal-50 border-teal-100/70', 
        badge: 'Multi-Batch',
        grid: 'md:col-span-2'
    },
];

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
};

export default function FeaturesSection() {
    return (
        <section id="fitur" className="scroll-mt-16 bg-white py-20 sm:py-28 px-4">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 24 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, amount: 0.3 }} 
                    transition={{ duration: 0.6 }} 
                    className="text-center mb-16"
                >
                    <p className="mb-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        <Sparkles className="h-3.5 w-3.5" /> Fitur Unggulan
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 leading-tight">
                        Semua yang Dibutuhkan<br className="hidden sm:block" />
                        <span className="text-zinc-500"> Untuk Memajukan Peternakan</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-zinc-500 max-w-lg mx-auto font-medium">
                        Dari pencatatan harian sederhana hingga visualisasi laporan akuntansi profitabilitas lengkap.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <motion.div 
                    variants={containerVariants} 
                    initial="hidden" 
                    whileInView="show" 
                    viewport={{ once: true, amount: 0.15 }} 
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                    {BENTO_FEATURES.map(({ icon: Icon, title, desc, color, badge, grid }) => (
                        <motion.div 
                            key={title} 
                            variants={itemVariants} 
                            className={`group relative rounded-2xl border border-zinc-200/70 bg-zinc-50/30 p-6 transition-all duration-300 hover:border-zinc-300 hover:bg-white hover:shadow-xl hover:shadow-zinc-200/40 hover:-translate-y-0.5 ${grid}`}
                        >
                            {/* Accent badge */}
                            <span className="absolute top-4 right-4 rounded-full border border-zinc-200/80 bg-white px-2.5 py-0.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">
                                {badge}
                            </span>
                            
                            {/* Icon in container */}
                            <div className={`mb-4 inline-flex rounded-xl border p-3 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2 ${color}`}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex items-center gap-1">
                                <h3 className="text-sm font-bold text-zinc-950 tracking-tight">{title}</h3>
                                <ArrowUpRight className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                            </div>
                            
                            <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
                                {desc}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
