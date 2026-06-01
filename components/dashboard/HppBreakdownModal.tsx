'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import {
  X, Loader2, Calculator, Leaf, Wrench, Bird,
  ChevronDown, ChevronUp, Info
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExpenseLine {
  category: string;
  total: number;
}

interface FlockDepreciation {
  name: string;
  acquisitionCost: number;
  productiveDays: number;
  daysInMonth: number;
  monthlyAmount: number;
}

interface BreakdownData {
  variableCosts: ExpenseLine[];   // BBB + BOP Variabel
  btklCosts: ExpenseLine[];       // Biaya Tenaga Kerja Langsung (gaji, upah, honor)
  bopFixedCosts: ExpenseLine[];   // BOP Tetap Cash lainnya (non-BTKL)
  bioDepreciation: FlockDepreciation[];
  totalVC: number;
  totalBTKL: number;
  totalBOPFixed: number;
  totalFCCash: number;            // = totalBTKL + totalBOPFixed
  totalBioDepreciation: number;
  totalFC: number;
  totalCost: number;
  totalEggs: number;
  hppPerUnit: number;
  hppPerKg: number;
  defaultEggWeight: number;
  monthLabel: string;
}

// ─── Keyword-based classifier (sama dengan laporan/page.tsx) ──────────────────
type ExpClass = 'vc' | 'btkl' | 'bop_fixed' | 'skip';

function classifyExpLine(category: string | null, costType: string | null): ExpClass {
  const cat = (category ?? '').toLowerCase();
  const ct  = costType ?? '';
  if (cat.startsWith('pembelian'))                          return 'skip'; // aset inventaris
  if (/gaji|upah|honor|tenaga kerja/i.test(cat))           return 'btkl'; // BTKL regardless of cost_type
  if (ct === 'Variable')                                    return 'vc';
  if (ct === 'Fixed')                                       return 'bop_fixed';
  return 'skip'; // NULL cost_type + bukan BTKL keyword = tidak diklasifikasi
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** HPP per butir dari dashboard (untuk verifikasi konsistensi) */
  hpp: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon, label, subtotal, total, color, badge,
}: {
  icon: React.ReactNode;
  label: string;
  subtotal: number;
  total: number;
  color: string;
  badge?: string;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${color}`}>
      <div className="flex items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        {badge && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/60 text-current">
            {badge}
          </span>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{formatRp(subtotal)}</p>
        <p className="text-[10px] opacity-70">{pct(subtotal, total)}% dari total</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HppBreakdownModal({ isOpen, onClose, hpp }: Props) {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    vc: true, fc: true, bio: true,
  });

  const toggleSection = (s: 'vc' | 'fc' | 'bio') =>
    setExpandedSections(p => ({ ...p, [s]: !p[s] }));

  const fetchBreakdown = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      // ── Parallel queries ────────────────────────────────────────────────────
      const [
        { data: expenses },
        { data: flocks },
        { data: production },
        { data: profile },
      ] = await Promise.all([
        // 1. Rincian finance_expenses bulan ini — SEMUA (kecuali Pembelian aset).
        //    Klasifikasi pakai keyword (bukan hanya cost_type) agar robust
        //    meski ada record dengan cost_type = NULL seperti gaji baru.
        supabase
          .from('finance_expenses')
          .select('category, cost_type, amount')
          .gte('date', firstDay)
          .not('category', 'ilike', 'Pembelian%'),

        // 2. Flocks aktif dengan acquisition_cost untuk amortisasi
        supabase
          .from('flocks')
          .select('name, acquisition_cost_total, estimated_productive_days, status')
          .not('status', 'in', '("Afkir","Selesai","Archived","Inactive")')
          .gt('acquisition_cost_total', 0),

        // 3. Total telur panen bulan ini
        supabase
          .from('egg_inventory_ledger')
          .select('qty_in')
          .eq('transaction_type', 'Harvest')
          .gte('date', firstDay),

        // 4. Farm profile untuk berat telur default
        supabase
          .from('farm_profile')
          .select('default_egg_weight_grams')
          .limit(1)
          .maybeSingle(),
      ]);

      // ── Klasifikasi expense dengan keyword (sama dg laporan) ───────────────
      const vcMap      = new Map<string, number>();
      const btklMap    = new Map<string, number>();
      const bopFixMap  = new Map<string, number>();

      for (const e of expenses ?? []) {
        const amt = Number(e.amount ?? 0);
        if (amt <= 0) continue;
        const cls = classifyExpLine(e.category, e.cost_type);
        if      (cls === 'vc')        vcMap.set(e.category,     (vcMap.get(e.category)     ?? 0) + amt);
        else if (cls === 'btkl')      btklMap.set(e.category,   (btklMap.get(e.category)   ?? 0) + amt);
        else if (cls === 'bop_fixed') bopFixMap.set(e.category, (bopFixMap.get(e.category) ?? 0) + amt);
        // 'skip' = tidak masuk kalkulasi HPP (Pembelian, atau NULL non-gaji)
      }

      const variableCosts: ExpenseLine[] = Array.from(vcMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      const btklCosts: ExpenseLine[] = Array.from(btklMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      const bopFixedCosts: ExpenseLine[] = Array.from(bopFixMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      // ── Proses Biological Depreciation ─────────────────────────────────────
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      const bioDepreciation: FlockDepreciation[] = (flocks ?? []).map(f => {
        const acquisitionCost = Number(f.acquisition_cost_total ?? 0);
        const productiveDays = Math.max(Number(f.estimated_productive_days ?? 1), 1);
        const monthlyAmount = (acquisitionCost / productiveDays) * daysInMonth;
        return {
          name: f.name ?? 'Batch tidak diketahui',
          acquisitionCost,
          productiveDays,
          daysInMonth,
          monthlyAmount,
        };
      });

      // ── Hitung totals ───────────────────────────────────────────────────────
      const totalVC              = variableCosts.reduce((s, e) => s + e.total, 0);
      const totalBTKL            = btklCosts.reduce((s, e) => s + e.total, 0);
      const totalBOPFixed        = bopFixedCosts.reduce((s, e) => s + e.total, 0);
      const totalFCCash          = totalBTKL + totalBOPFixed;
      const totalBioDepreciation = bioDepreciation.reduce((s, e) => s + e.monthlyAmount, 0);
      const totalFC              = totalFCCash + totalBioDepreciation;
      const totalCost            = totalVC + totalFC;
      const totalEggs            = Math.max(
        (production ?? []).reduce((s, r) => s + Number(r.qty_in ?? 0), 0),
        1,
      );
      const hppPerUnit       = totalCost / totalEggs;
      const defaultEggWeight = Number(profile?.default_egg_weight_grams ?? 60);
      const hppPerKg         = defaultEggWeight > 0 ? hppPerUnit / (defaultEggWeight / 1000) : 0;

      setData({
        variableCosts, btklCosts, bopFixedCosts, bioDepreciation,
        totalVC, totalBTKL, totalBOPFixed, totalFCCash,
        totalBioDepreciation, totalFC,
        totalCost, totalEggs, hppPerUnit, hppPerKg,
        defaultEggWeight, monthLabel,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchBreakdown();
  }, [isOpen, fetchBreakdown]);

  if (!isOpen) return null;

  const totalCost = data?.totalCost ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Calculator className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Rincian HPP</h2>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {data?.monthLabel ?? '…'} · Full Costing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Memuat rincian biaya…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* ── Info note ── */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  HPP dihitung dari total biaya bulan ini dibagi total telur dipanen.
                  Angka akan semakin akurat seiring bertambahnya produksi di bulan berjalan.
                </p>
              </div>

              {/* ══ BAGIAN I: BIAYA VARIABEL ══════════════════════════════════ */}
              <div className="rounded-xl border border-emerald-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('vc')}
                  className="w-full text-left"
                >
                  <SectionHeader
                    icon={<Leaf className="w-3.5 h-3.5 text-emerald-700" />}
                    label="Biaya Variabel (BBB + BOP Variabel)"
                    subtotal={data.totalVC}
                    total={totalCost}
                    color="bg-emerald-50 text-emerald-800"
                    badge={expandedSections.vc ? '▲' : '▼'}
                  />
                </button>

                {expandedSections.vc && (
                  <div className="divide-y divide-zinc-50">
                    {data.variableCosts.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-zinc-400 italic">
                        Belum ada biaya variabel dicatat bulan ini.
                      </p>
                    ) : (
                      data.variableCosts.map((e) => (
                        <div key={e.category} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-700 font-medium">{e.category}</span>
                            <span className="text-xs font-bold text-zinc-900">{formatRp(e.total)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ProgressBar value={pct(e.total, totalCost)} color="bg-emerald-400" />
                            <span className="text-[10px] text-zinc-400 whitespace-nowrap w-8 text-right">
                              {pct(e.total, totalCost)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="px-4 py-2 bg-emerald-50/50 flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">VC per Butir</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatRp(data.totalEggs > 0 ? data.totalVC / data.totalEggs : 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ══ BAGIAN II: BIAYA TETAP CASH (BTKL + BOP Tetap) ══════════ */}
              <div className="rounded-xl border border-amber-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('fc')}
                  className="w-full text-left"
                >
                  <SectionHeader
                    icon={<Wrench className="w-3.5 h-3.5 text-amber-700" />}
                    label="Biaya Tetap Cash (BTKL + BOP)"
                    subtotal={data.totalFCCash}
                    total={totalCost}
                    color="bg-amber-50 text-amber-800"
                    badge={expandedSections.fc ? '▲' : '▼'}
                  />
                </button>

                {expandedSections.fc && (
                  <div className="divide-y divide-zinc-50">
                    {/* ── Sub-seksi BTKL ── */}
                    {data.btklCosts.length > 0 && (
                      <>
                        <div className="px-4 py-1.5 bg-orange-50">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-500">
                            II.a Biaya Tenaga Kerja Langsung (BTKL)
                          </span>
                        </div>
                        {data.btklCosts.map((e) => (
                          <div key={e.category} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-700 font-medium">{e.category}</span>
                              <span className="text-xs font-bold text-zinc-900">{formatRp(e.total)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <ProgressBar value={pct(e.total, totalCost)} color="bg-orange-400" />
                              <span className="text-[10px] text-zinc-400 whitespace-nowrap w-8 text-right">
                                {pct(e.total, totalCost)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* ── Sub-seksi BOP Tetap Cash ── */}
                    {data.bopFixedCosts.length > 0 && (
                      <>
                        <div className="px-4 py-1.5 bg-amber-50">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600">
                            II.b BOP Tetap Cash (Listrik, Disinfektan, dll)
                          </span>
                        </div>
                        {data.bopFixedCosts.map((e) => (
                          <div key={e.category} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-700 font-medium">{e.category}</span>
                              <span className="text-xs font-bold text-zinc-900">{formatRp(e.total)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <ProgressBar value={pct(e.total, totalCost)} color="bg-amber-400" />
                              <span className="text-[10px] text-zinc-400 whitespace-nowrap w-8 text-right">
                                {pct(e.total, totalCost)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {data.btklCosts.length === 0 && data.bopFixedCosts.length === 0 && (
                      <p className="px-4 py-3 text-xs text-zinc-400 italic">
                        Belum ada biaya tetap cash dicatat bulan ini.
                        Contoh: catat gaji karyawan di menu Keuangan → Pengeluaran.
                      </p>
                    )}

                    <div className="px-4 py-2 bg-amber-50/50 flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">FC Cash per Butir</span>
                      <span className="text-xs font-bold text-amber-700">
                        {formatRp(data.totalEggs > 0 ? data.totalFCCash / data.totalEggs : 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ══ BAGIAN III: AMORTISASI BIOLOGIS ══════════════════════════ */}
              <div className="rounded-xl border border-violet-100 overflow-hidden">
                <button
                  onClick={() => toggleSection('bio')}
                  className="w-full text-left"
                >
                  <SectionHeader
                    icon={<Bird className="w-3.5 h-3.5 text-violet-700" />}
                    label="Amortisasi Aset Biologis (Pullet)"
                    subtotal={data.totalBioDepreciation}
                    total={totalCost}
                    color="bg-violet-50 text-violet-800"
                    badge={expandedSections.bio ? '▲' : '▼'}
                  />
                </button>

                {expandedSections.bio && (
                  <div className="divide-y divide-zinc-50">
                    {data.bioDepreciation.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-zinc-400 italic">
                        Tidak ada flock aktif dengan biaya pengadaan.
                      </p>
                    ) : (
                      data.bioDepreciation.map((f) => (
                        <div key={f.name} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-700 font-medium">{f.name}</span>
                            <span className="text-xs font-bold text-zinc-900">{formatRp(f.monthlyAmount)}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {formatRp(f.acquisitionCost)} ÷ {f.productiveDays} hr × {f.daysInMonth} hr/bln
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ProgressBar value={pct(f.monthlyAmount, totalCost)} color="bg-violet-400" />
                            <span className="text-[10px] text-zinc-400 whitespace-nowrap w-8 text-right">
                              {pct(f.monthlyAmount, totalCost)}%
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="px-4 py-2 bg-violet-50/50 flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-violet-700 uppercase tracking-wide">Amortisasi per Butir</span>
                      <span className="text-xs font-bold text-violet-700">
                        {formatRp(data.totalEggs > 0 ? data.totalBioDepreciation / data.totalEggs : 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ══ FORMULA SUMMARY ══════════════════════════════════════════ */}
              <div className="rounded-xl bg-zinc-900 text-white p-4 space-y-2 text-xs font-mono">
                <p className="text-zinc-500 text-[9px] font-sans not-italic uppercase tracking-widest mb-2">
                  Kalkulasi HPP
                </p>

                <div className="flex justify-between">
                  <span className="text-emerald-400">I. Biaya Variabel (BBB + BOP Var)</span>
                  <span>{formatRp(data.totalVC)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-400">II.a BTKL (Gaji & Upah)</span>
                  <span>{formatRp(data.totalBTKL)}</span>
                </div>
                {data.totalBOPFixed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-400">II.b BOP Tetap Cash</span>
                    <span>{formatRp(data.totalBOPFixed)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-violet-400">III. Amortisasi Biologis</span>
                  <span>{formatRp(data.totalBioDepreciation)}</span>
                </div>

                <div className="border-t border-zinc-700 pt-2 flex justify-between">
                  <span className="text-zinc-300 font-bold">Total Biaya Bulan Ini</span>
                  <span className="font-bold">{formatRp(data.totalCost)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>÷ Total Telur Dipanen</span>
                  <span>{data.totalEggs.toLocaleString('id-ID')} butir</span>
                </div>

                <div className="border-t border-zinc-600 pt-2 flex justify-between items-baseline">
                  <span className="text-white font-bold text-sm font-sans not-italic">= HPP per Butir</span>
                  <span className="text-indigo-400 font-bold text-xl font-sans not-italic">
                    {formatRp(data.hppPerUnit)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[10px]">
                  <span>Setara per Kg ({data.defaultEggWeight}g/butir)</span>
                  <span>{formatRp(data.hppPerKg)}</span>
                </div>

                {/* Konsistensi check */}
                {Math.abs(data.hppPerUnit - hpp) > 5 && (
                  <div className="mt-2 flex items-start gap-1.5 text-amber-300 text-[10px] font-sans not-italic">
                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>
                      Rincian ini dihitung ulang secara real-time dan mungkin sedikit berbeda
                      dari angka dashboard ({formatRp(hpp)}) karena data baru yang masuk.
                    </span>
                  </div>
                )}
              </div>

              {/* Volume info */}
              <p className="text-center text-[10px] text-zinc-400 pb-1">
                Berdasarkan <strong>{data.totalEggs.toLocaleString('id-ID')} butir</strong> panen
                bulan {data.monthLabel} · Akan semakin akurat seiring bertambahnya produksi
              </p>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
