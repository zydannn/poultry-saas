"use client";

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

// ─── Glossary ─────────────────────────────────────────────────────────────────

export const GLOSSARY: Record<string, { short: string; detail?: string }> = {
  HPP: {
    short: 'Harga Pokok Produksi — biaya total untuk menghasilkan satu butir telur.',
    detail: 'Dihitung dari total biaya pakan harian + amortisasi ayam, dibagi jumlah telur dipanen.',
  },
  BEP: {
    short: 'Break Even Point — harga jual minimum agar tidak rugi.',
    detail: 'BEP = Total Biaya Tetap ÷ (Harga Jual − Biaya Variabel per Unit). Di bawah BEP = rugi.',
  },
  HDP: {
    short: 'Hen Day Production — % telur yang diproduksi per ekor per hari.',
    detail: 'HDP = (Telur Dipanen ÷ Populasi Aktif) × 100%. Standar sehat > 70%.',
  },
  FCR: {
    short: 'Feed Conversion Ratio — kg pakan yang dibutuhkan per kg telur.',
    detail: 'FCR rendah = efisiensi tinggi. Standar layer < 2.2. Dihitung: total pakan (kg) ÷ total telur (kg).',
  },
  FC: {
    short: 'Fixed Cost / Biaya Tetap — tidak berubah meski produksi naik/turun.',
    detail: 'Contoh: gaji, penyusutan kandang, listrik bulanan. Harus ditanggung meski produksi nol.',
  },
  VC: {
    short: 'Variable Cost / Biaya Variabel — berubah sesuai volume produksi.',
    detail: 'Contoh: pakan, obat-obatan, vaksin. Makin banyak ayam, makin besar biaya ini.',
  },
  Penyusutan: {
    short: 'Alokasi biaya aset (ayam/kandang) sepanjang umur produktifnya.',
    detail: 'Ayam dengan masa produktif 600 hari: penyusutan harian = Harga Beli ÷ 600 ÷ Populasi.',
  },
  'Aset Biologis': {
    short: 'Ayam petelur sebagai aset hidup yang memiliki nilai ekonomi.',
    detail: 'Berbeda dari inventaris, nilai aset biologis menyusut seiring umur dan produksi.',
  },
  'Biaya Tetap': {
    short: 'Biaya yang tidak berubah terlepas dari jumlah produksi.',
    detail: 'Contoh: gaji karyawan tetap, cicilan kandang, penyusutan aset.',
  },
  'Biaya Variabel': {
    short: 'Biaya yang naik/turun sesuai volume produksi.',
    detail: 'Komponen terbesar biasanya pakan — langsung mempengaruhi HPP per butir.',
  },
  'Matching Principle': {
    short: 'Prinsip akuntansi: biaya diakui saat manfaatnya diterima.',
    detail: 'Pembelian pakan = aset (inventaris). Biaya pakan masuk P&L saat pakan dikonsumsi, bukan saat dibeli.',
  },
  'Saran Harga Jual': {
    short: 'Harga jual minimum agar mencapai target laba yang Anda tetapkan.',
    detail: 'Dihitung: HPP ÷ (1 − target margin%). Contoh: HPP Rp 1.000 + target margin 20% → Saran Rp 1.250/butir.',
  },
  'Margin Profit': {
    short: 'Persentase laba dari harga jual. Makin tinggi = makin untung.',
    detail: 'Margin = (Harga Jual − HPP) ÷ Harga Jual × 100%. Target margin diatur di menu Pengaturan.',
  },
  'Harga Pasar': {
    short: 'Harga telur yang berlaku di pasar lokal saat ini.',
    detail: 'Diisi manual di Pengaturan. Dipakai sebagai pembanding: jika HPP Anda lebih tinggi dari harga pasar, Anda sedang merugi.',
  },
  'HDP': {
    short: 'Hen Day Production — % telur yang diproduksi per ekor per hari.',
    detail: 'HDP = (Telur Dipanen ÷ Populasi Aktif) × 100%. Standar sehat layer > 70%. Turun tajam = tanda stres atau penyakit.',
  },
  'Stok Telur': {
    short: 'Jumlah telur yang sudah dipanen tapi belum terjual.',
    detail: 'Dihitung: Total Panen − Telur Pecah − Total Terjual. Klik kartu ini untuk melihat riwayat mutasi harian.',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface TermTooltipProps {
  term: keyof typeof GLOSSARY;
  children?: React.ReactNode;
  className?: string;
}

export default function TermTooltip({ term, children, className = '' }: TermTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const entry = GLOSSARY[term];

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  if (!entry) return <>{children ?? term}</>;

  return (
    <span ref={ref} className={`relative inline-flex items-baseline gap-0.5 ${className}`}>
      <span
        className="underline decoration-dotted decoration-zinc-400 underline-offset-2 cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      >
        {children ?? term}
      </span>
      <HelpCircle
        className="w-3 h-3 text-zinc-400 cursor-help shrink-0 self-center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      />

      {open && (
        <span
          role="tooltip"
          className="
            absolute bottom-full left-0 z-50 mb-2
            w-64 rounded-xl border border-zinc-200 bg-white shadow-xl
            px-4 py-3 text-left pointer-events-none
          "
        >
          <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {term}
          </span>
          <span className="block text-xs font-medium text-zinc-800 leading-relaxed">
            {entry.short}
          </span>
          {entry.detail && (
            <span className="block mt-1.5 text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-100 pt-1.5">
              {entry.detail}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
