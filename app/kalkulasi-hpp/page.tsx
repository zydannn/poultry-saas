"use client";

import React from 'react';
import AppShell from '@/components/AppShell';
import TermTooltip from '@/components/TermTooltip';
import Link from 'next/link';
import {
  Calculator,
  Settings,
  ArrowRight,
  Info,
  Beef,
  TrendingUp,
  Weight
} from 'lucide-react';

export default function KalkulasiHppPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-5">

          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Kalkulasi <TermTooltip term="HPP">HPP</TermTooltip>
            </h1>
            <p className="text-zinc-500 mt-1">
              Manajemen Harga Pokok Produksi berbasis unit-costing otomatis.
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4">
            <div className="shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">HPP Kini Dihitung Otomatis</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                PoultryOS menggunakan model <strong>unit-costing standar peternakan</strong> untuk menghitung{' '}
                <TermTooltip term="HPP">HPP</TermTooltip> secara real-time di Dashboard. Tidak perlu input manual lagi.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2 mb-5">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Cara Kerja Kalkulasi Otomatis
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Beef className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    <TermTooltip term="Biaya Variabel">Biaya Pakan Harian</TermTooltip>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Populasi Aktif × Standar Konsumsi Pakan/Ekor × Harga Pakan/Kg
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <Weight className="h-4 w-4 text-indigo-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    Amortisasi / <TermTooltip term="Penyusutan">Penyusutan</TermTooltip>{' '}
                    <TermTooltip term="Aset Biologis">Ayam</TermTooltip>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Populasi Aktif × Nilai Penyusutan per Ekor per Hari (Rp)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <TrendingUp className="h-4 w-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    <TermTooltip term="HPP">HPP</TermTooltip> Per Butir (Output)
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Total Biaya Produksi Harian ÷ Jumlah Telur Dipanen
                    <span className="ml-1 italic">
                      (atau proyeksi <TermTooltip term="HDP">HDP</TermTooltip> jika belum ada panen hari ini)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formula Breakdown */}
          <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-sm font-mono text-sm space-y-2">
            <p className="text-zinc-400 text-xs mb-3 font-sans not-italic font-semibold uppercase tracking-widest">Formula (Full Costing — Berbasis Pengeluaran Aktual)</p>
            <p><span className="text-emerald-400">total_vc</span> = Σ biaya_pakan_harian + Σ biaya_suplemen (cost_type=Variable)</p>
            <p><span className="text-emerald-400">total_fc_cash</span> = Σ gaji + listrik + dll (cost_type=Fixed, bukan Pembelian)</p>
            <p><span className="text-emerald-400">amortisasi_biologis</span> = (harga_pullet ÷ hari_produktif) × hari_dalam_bulan</p>
            <p><span className="text-amber-400">total_fc</span> = total_fc_cash + amortisasi_biologis</p>
            <p><span className="text-blue-400">hpp_per_butir</span> = (total_vc + total_fc) ÷ total_telur_panen_bulan_ini</p>
            <p className="text-zinc-500 text-xs mt-2 font-sans not-italic">* Pembelian Pakan = aset inventaris, BUKAN beban periode — dikecualikan dari HPP</p>
          </div>

          {/* Glossary quick-reference */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-widest mb-4">Glosarium Istilah</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['HPP', 'BEP', 'HDP', 'FC', 'VC', 'Penyusutan'] as const).map((term) => (
                <div key={term} className="flex items-start gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <span className="shrink-0 mt-0.5 font-bold text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 min-w-[2.5rem] text-center">
                    {term}
                  </span>
                  <span className="text-xs text-zinc-600 leading-relaxed">
                    <TermTooltip term={term}>{term}</TermTooltip>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-800">Konfigurasi Parameter HPP</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Atur standar konsumsi pakan, <TermTooltip term="Penyusutan">penyusutan</TermTooltip> ayam, dan target{' '}
                <TermTooltip term="HDP">HDP</TermTooltip> di halaman Pengaturan.
              </p>
            </div>
            <Link
              href="/pengaturan"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Buka Pengaturan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
