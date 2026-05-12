'use client';

import React, { useState, useMemo } from 'react';
import { FlaskConical, TrendingUp, AlertTriangle, XCircle, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

interface SimulationPanelProps {
  baseFixedCost: number;
  baseVC: number;
  basePrice: number;
  currentProduction: number;
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n));

function ShiftInput({
  label,
  value,
  onChange,
  min = -5000,
  max = 5000,
  step = 100,
  color = 'indigo',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  color?: 'indigo' | 'rose';
}) {
  const colorMap = {
    indigo: {
      track: 'accent-indigo-500',
      badge: value >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      btn: 'hover:bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    rose: {
      track: 'accent-rose-500',
      badge: value <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      btn: 'hover:bg-rose-50 text-rose-600 border-rose-200',
    },
  }[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">{label}</label>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap.badge}`}>
          {value >= 0 ? '+' : ''}{formatRupiah(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full ${colorMap.track} cursor-pointer`}
      />
      <div className="flex justify-between text-[10px] text-zinc-400">
        <span>{formatRupiah(min)}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onChange(Math.max(min, value - step))}
            className={`border rounded p-0.5 transition-colors ${colorMap.btn}`}
          ><ChevronDown className="w-3 h-3" /></button>
          <button
            onClick={() => onChange(Math.min(max, value + step))}
            className={`border rounded p-0.5 transition-colors ${colorMap.btn}`}
          ><ChevronUp className="w-3 h-3" /></button>
        </div>
        <span>+{formatRupiah(max)}</span>
      </div>
    </div>
  );
}

export default function SimulationPanel({ baseFixedCost, baseVC, basePrice, currentProduction }: SimulationPanelProps) {
  const [priceShift, setPriceShift] = useState(0);
  const [vcShift, setVcShift] = useState(0);

  const result = useMemo(() => {
    const simulatedPrice = basePrice + priceShift;
    const simulatedVC = baseVC + vcShift;
    const margin = simulatedPrice - simulatedVC;
    const simulatedBEP = margin > 0 ? baseFixedCost / margin : Infinity;
    const marginOfSafety = currentProduction > 0 && isFinite(simulatedBEP)
      ? ((currentProduction - simulatedBEP) / currentProduction) * 100
      : -Infinity;

    let status: 'aman' | 'waspada' | 'kritis';
    let title: string;
    let message: string;

    if (!isFinite(simulatedBEP) || marginOfSafety <= 0) {
      status = 'kritis';
      title = 'Kritis / Rugi';
      message = 'Simulasi ini menyebabkan BEP melampaui produksi harian. Perusahaan akan merugi.';
    } else if (marginOfSafety <= 15) {
      status = 'waspada';
      title = 'Waspada';
      message = 'Jarak dengan titik impas menipis. Rentan terhadap fluktuasi harga pakan.';
    } else {
      status = 'aman';
      title = 'Aman';
      message = 'Bisnis memiliki bantalan produksi yang sangat sehat.';
    }

    return { simulatedPrice, simulatedVC, simulatedBEP, marginOfSafety, status, title, message };
  }, [priceShift, vcShift, baseFixedCost, baseVC, basePrice, currentProduction]);

  const statusStyle = {
    aman: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      title: 'text-emerald-800',
      msg: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    waspada: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: 'text-amber-800',
      msg: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
    },
    kritis: {
      bg: 'bg-rose-50 border-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      title: 'text-rose-800',
      msg: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-700',
    },
  }[result.status];

  const isDirty = priceShift !== 0 || vcShift !== 0;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <FlaskConical className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Simulasi Risiko Pasar</h3>
            <p className="text-[10px] text-zinc-400">What-If Analysis · Margin of Safety</p>
          </div>
        </div>
        {isDirty && (
          <button
            onClick={() => { setPriceShift(0); setVcShift(0); }}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-5">
          <div className="bg-zinc-50 rounded-xl p-4 space-y-1 text-xs text-zinc-500 border border-zinc-100">
            <p className="font-semibold text-zinc-700 text-[11px] uppercase tracking-wide mb-2">Nilai Dasar (Aktual)</p>
            <div className="flex justify-between"><span>Harga Jual</span><span className="font-semibold text-zinc-800">{formatRupiah(basePrice)}/butir</span></div>
            <div className="flex justify-between"><span>Biaya Variabel</span><span className="font-semibold text-zinc-800">{formatRupiah(baseVC)}/butir</span></div>
            <div className="flex justify-between"><span>Biaya Tetap</span><span className="font-semibold text-zinc-800">{formatRupiah(baseFixedCost)}/bln</span></div>
          </div>

          <ShiftInput
            label="Pergeseran Harga Jual"
            value={priceShift}
            onChange={setPriceShift}
            min={-5000}
            max={5000}
            step={100}
            color="indigo"
          />

          <ShiftInput
            label="Pergeseran Biaya Variabel"
            value={vcShift}
            onChange={setVcShift}
            min={-5000}
            max={5000}
            step={100}
            color="rose"
          />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
              <p className="text-zinc-500 mb-1">Harga Simulasi</p>
              <p className="font-bold text-zinc-900">{formatRupiah(result.simulatedPrice)}</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-lg p-3">
              <p className="text-zinc-500 mb-1">VC Simulasi</p>
              <p className="font-bold text-zinc-900">{formatRupiah(result.simulatedVC)}</p>
            </div>
          </div>
        </div>

        {/* Right: Insight Card */}
        <div className="flex flex-col gap-4">
          {/* Simulated BEP */}
          <div className="bg-zinc-900 rounded-xl p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">BEP Tersimulasi</p>
            <p className="text-3xl font-bold">
              {isFinite(result.simulatedBEP) ? formatNumber(Math.ceil(result.simulatedBEP)) : '∞'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">butir / bulan untuk impas</p>
            {currentProduction > 0 && isFinite(result.simulatedBEP) && (
              <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between text-xs">
                <span className="text-zinc-400">Produksi Aktual</span>
                <span className="font-semibold">{formatNumber(currentProduction)} butir</span>
              </div>
            )}
          </div>

          {/* Margin of Safety */}
          <div className={`rounded-xl border p-4 flex-1 ${statusStyle.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              {statusStyle.icon}
              <div>
                <span className={`text-sm font-bold ${statusStyle.title}`}>{result.title}</span>
                <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
                  MoS: {isFinite(result.marginOfSafety) ? `${result.marginOfSafety.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${statusStyle.msg}`}>{result.message}</p>

            {isFinite(result.marginOfSafety) && result.marginOfSafety > 0 && (
              <div className="mt-3">
                <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      result.status === 'aman' ? 'bg-emerald-500' :
                      result.status === 'waspada' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, result.marginOfSafety)}%` }}
                  />
                </div>
                <p className="text-[10px] mt-1 text-zinc-500">
                  Buffer produksi sebelum merugi: {formatNumber(Math.max(0, currentProduction - result.simulatedBEP))} butir
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
