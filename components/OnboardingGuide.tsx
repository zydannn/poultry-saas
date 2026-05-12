"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Egg,
  Settings,
  Package,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Wallet,
  Sparkles,
  Bird,
} from 'lucide-react';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    id:    'setup',
    num:   1,
    icon:  Settings,
    color: 'bg-violet-100 text-violet-600',
    ring:  'ring-violet-200',
    title: 'Setup Profil & Parameter',
    desc:  'Isi nama peternakan, berat telur default, harga jual target, dan margin laba yang diinginkan.',
    tip:   'Data ini jadi acuan otomatis kalkulasi BEP, HPP, dan rekomendasi harga jual.',
    href:  '/pengaturan',
    cta:   'Buka Pengaturan',
  },
  {
    id:    'flock',
    num:   2,
    icon:  Bird,
    color: 'bg-amber-100 text-amber-600',
    ring:  'ring-amber-200',
    title: 'Daftarkan Batch Ayam',
    desc:  'Buat batch pertama: isi nama kandang, ras, tanggal tetas, populasi awal, dan biaya pengadaan ayam.',
    tip:   'Satu batch = satu kandang. Biaya pengadaan masuk ke penyusutan biologis.',
    href:  '/flocks',
    cta:   'Tambah Batch',
  },
  {
    id:    'inventory',
    num:   3,
    icon:  Package,
    color: 'bg-emerald-100 text-emerald-600',
    ring:  'ring-emerald-200',
    title: 'Isi Stok Pakan Awal',
    desc:  'Catat pembelian pakan pertama ke gudang. Harga beli per Kg otomatis masuk ke kalkulasi HPP.',
    tip:   'Setiap konsumsi pakan harian langsung mengurangi stok ini secara otomatis.',
    href:  '/inventory',
    cta:   'Tambah Stok Pakan',
  },
  {
    id:    'daily',
    num:   4,
    icon:  ClipboardList,
    color: 'bg-indigo-100 text-indigo-600',
    ring:  'ring-indigo-200',
    title: 'Catat Produksi Harian',
    desc:  'Input telur baik, telur retak, konsumsi pakan (Kg), dan mortalitas — setiap hari per shift.',
    tip:   'Biaya variabel pakan otomatis tercatat ke HPP setiap kali Anda simpan data harian.',
    href:  '/daily-input',
    cta:   'Mulai Input Harian',
  },
  {
    id:    'income',
    num:   5,
    icon:  Wallet,
    color: 'bg-rose-100 text-rose-600',
    ring:  'ring-rose-200',
    title: 'Catat Penjualan & Biaya',
    desc:  'Setiap jual telur → catat di Keuangan. Biaya tetap (listrik, gaji) juga dicatat di sini.',
    tip:   'Data ini langsung muncul di Laporan Laba Rugi dan grafik tren bulanan.',
    href:  '/keuangan',
    cta:   'Buka Keuangan',
  },
];

const LS_PREFIX  = 'poultryos_step_done_';
const LS_DISMISS = 'poultryos_onboarding_done';

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingGuideProps {
  isOpen:   boolean;
  onClose?: () => void;
}

export default function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [dismissed, setDismissed]   = useState(false);
  const [doneSteps, setDoneSteps]   = useState<Record<string, boolean>>({});
  const [expanded,  setExpanded]    = useState<string | null>(null);

  // Load per-step completion from localStorage
  useEffect(() => {
    const saved: Record<string, boolean> = {};
    STEPS.forEach(s => {
      saved[s.id] = localStorage.getItem(LS_PREFIX + s.id) === '1';
    });
    setDoneSteps(saved);
  }, [isOpen]);

  const toggleDone = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !doneSteps[id];
    localStorage.setItem(LS_PREFIX + id, next ? '1' : '0');
    setDoneSteps(prev => ({ ...prev, [id]: next }));
  };

  const close = (permanent = false) => {
    if (permanent) localStorage.setItem(LS_DISMISS, '1');
    setDismissed(true);
    onClose?.();
  };

  if (!isOpen || dismissed) return null;

  const completedCount = STEPS.filter(s => doneSteps[s.id]).length;
  const progressPct    = Math.round((completedCount / STEPS.length) * 100);
  const allDone        = completedCount === STEPS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-6 pt-6 pb-5 shrink-0">
          <button
            onClick={() => close(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
              Panduan Memulai
            </span>
          </div>

          <h2 className="text-xl font-bold text-white leading-tight">
            {allDone
              ? <>Semua langkah selesai! <span className="text-amber-300">🎉</span></>
              : <>Selamat datang di <span className="text-amber-300">PoultryOS</span></>
            }
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
            {allDone
              ? 'Peternakan Anda sudah siap dipantau secara penuh. Dashboard dan laporan sudah aktif.'
              : '5 langkah mudah agar data peternakan Anda bisa terpantau dan teranalis secara real-time.'
            }
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Progress</span>
              <span className="text-[10px] font-bold text-amber-300">{completedCount}/{STEPS.length} selesai</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Steps ── */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2.5">
          {STEPS.map((step) => {
            const Icon    = step.icon;
            const isDone  = doneSteps[step.id];
            const isOpen  = expanded === step.id;

            return (
              <div
                key={step.id}
                className={`rounded-xl border transition-all duration-200 ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-zinc-100 bg-zinc-50/50'
                }`}
              >
                {/* Row */}
                <div className="flex items-center gap-3 p-3.5">
                  {/* Done toggle */}
                  <button
                    onClick={(e) => toggleDone(step.id, e)}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-zinc-300 hover:border-emerald-400'
                    }`}
                    title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Icon */}
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${step.color} ${isDone ? 'opacity-60' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-400">{step.num}.</span>
                      <p className={`text-sm font-semibold truncate ${isDone ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                        {step.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{step.desc.split('.')[0]}.</p>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : step.id)}
                    className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-4 pb-3.5 space-y-3 border-t border-zinc-100 pt-3">
                    <p className="text-xs text-zinc-600 leading-relaxed">{step.desc}</p>
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-700 leading-relaxed">{step.tip}</p>
                    </div>
                    <Link
                      href={step.href}
                      onClick={() => close(false)}
                      className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98] ${
                        isDone
                          ? 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                          : 'bg-zinc-900 text-white'
                      }`}
                    >
                      {step.cta}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 pb-4 pt-2 border-t border-zinc-100 shrink-0 space-y-2">
          {allDone ? (
            <button
              onClick={() => close(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesai — Jangan tampilkan lagi
            </button>
          ) : (
            <>
              <button
                onClick={() => close(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                Lewati panduan ini
              </button>
              <p className="text-[10px] text-center text-zinc-300">
                Panduan bisa dibuka kembali dari tombol{' '}
                <span className="font-semibold text-zinc-400">? Panduan</span> di dashboard
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
