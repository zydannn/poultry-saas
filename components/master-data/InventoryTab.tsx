'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Loader2, Wheat, RefreshCw } from 'lucide-react';

// SSOT Type: matches feed_stock_ledger view exactly
interface FeedStockRow {
  feed_name: string;
  category: string;
  actual_stock: number;
}

const formatNumber = (n: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);

export default function InventoryTab() {
  const [data, setData] = useState<FeedStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData() {
    setLoading(true);
    const { data: ledger, error } = await supabase
      .from('feed_stock_ledger')        // SSOT: strictly query the view
      .select('*')
      .order('feed_name', { ascending: true });

    if (error) {
      console.error('[InventoryTab] feed_stock_ledger fetch error:', error.message);
    }

    if (ledger) {
      setData(ledger as FeedStockRow[]);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const totalStock = data.reduce((sum, row) => sum + (Number(row.actual_stock) || 0), 0);
  const LOW_STOCK_THRESHOLD_KG = 50;

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Memuat data stok pakan...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 bg-white border border-zinc-200 rounded-xl text-sm">
        Belum ada data stok pakan di ledger.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-xl px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
            <Wheat className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Stok Pakan Aktif</p>
            <p className="text-xl font-bold text-zinc-900">{formatNumber(totalStock)} Kg</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-3 py-1.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Segarkan
          {lastUpdated && (
            <span className="text-zinc-400 font-normal">
              ({lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </button>
      </div>

      {/* Feed Stock Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-6 py-3.5">Nama Pakan</th>
                <th className="px-6 py-3.5">Kategori</th>
                <th className="px-6 py-3.5 text-right">Stok Aktual (Kg)</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60">
              {data.map((row, i) => {
                const stock = Number(row.actual_stock) || 0;
                const isLow = stock < LOW_STOCK_THRESHOLD_KG;
                const isCritical = stock <= 0;

                return (
                  <tr key={i} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-800">{row.feed_name}</td>
                    <td className="px-6 py-4 text-zinc-500">{row.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900">
                      {formatNumber(stock)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCritical ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                          Habis
                        </span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          Menipis
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-zinc-400 text-right">
        Sumber: <code className="font-mono">feed_stock_ledger</code> view · Nilai = SUM(quantity) dari inventory_transactions
      </p>
    </div>
  );
}
