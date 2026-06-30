'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, LineChart, Globe, Trophy } from 'lucide-react';

const POINTS = [
    { 
        icon: Globe, 
        title: 'Dibuat Khusus Peternak Indonesia', 
        desc: 'Bahasa Indonesia yang mudah dipahami, standar konversi kilogram telur nasional, serta mata uang Rupiah siap cetak.',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    { 
        icon: LineChart, 
        title: 'Satu Aplikasi untuk Semua Data', 
        desc: 'Tidak perlu spreadsheet atau buku terpisah. Dari log harian kandang hingga rekap laba rugi tersinkronisasi sempurna.',
        color: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    },
    { 
        icon: Zap, 
        title: 'Kalkulasi Instan & Otomatis', 
        desc: 'HPP dan profit dihitung real-time langsung oleh server kami. Mengurangi kesalahan hitung manual yang merugikan.',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    { 
        icon: ShieldCheck, 
        title: 'Privasi & Data Terenkripsi', 
        desc: 'Semua database diamankan menggunakan Row-Level Security Supabase. Data peternakan Anda sepenuhnya aman milik Anda.',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
];

const containerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.08
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
};

export default function WhySection() {
    return (
        <section className="bg-zinc-950 py-20 sm:py-28 px-4 relative overflow-hidden">
            {/* Dark background grids & lights */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(16,185,129,0.06),transparent)]" />
            <div className="absolute right-[-10%] top-[-10%] h-[30rem] w-[30rem] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            <div className="mx-auto max-w-5xl relative z-10">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                        <Trophy className="h-3.5 w-3.5" /> Mengapa Memilih Kami
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                        Menggabungkan Operasional <br className="sm:block hidden" />
                        Dengan <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">Manajemen Finansial</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-medium">
                        Bukan sekadar buku catatan digital — PoultryOS memberikan wawasan bisnis nyata untuk mengoptimalkan profitabilitas peternakan Anda.
                    </p>
                </motion.div>

                {/* Points Grid */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid sm:grid-cols-2 gap-6"
                >
                    {POINTS.map(({ icon: Icon, title, desc, color }) => (
                        <motion.div 
                            key={title} 
                            variants={itemVariants}
                            className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 shadow-xl"
                        >
                            <div className={`mb-4 inline-flex rounded-xl border p-3 ${color}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="mb-2 text-sm font-bold text-white tracking-tight">{title}</h3>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">{desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Dark Glass Stats Row */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6 }}
                    className="mt-14 grid grid-cols-3 gap-4 rounded-2xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm shadow-2xl"
                >
                    {[
                        { value: '6+', label: 'Modul Integrasi' },
                        { value: '100%', label: 'Akses Cloud' },
                        { value: 'Selamanya', label: 'Biaya Lisensi' },
                    ].map(({ value, label }) => (
                        <div key={label} className="text-center">
                            <p className="text-xl sm:text-3xl font-black text-white">{value}</p>
                            <p className="mt-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
