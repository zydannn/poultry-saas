"use client";

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Database } from 'lucide-react';

// Import komponen modular (Kita akan mengaktifkannya di Tahap 2)
import InventoryTab from '@/components/master-data/InventoryTab';
import FinanceTab from '@/components/master-data/FinanceTab';
import ProductionTab from '@/components/master-data/ProductionTab';
import AssetTab from '@/components/master-data/AssetTab';
import SupplementTab from '@/components/master-data/SupplementTab';

type TabType = 'keuangan' | 'produksi' | 'inventaris' | 'aset' | 'suplemen';

export default function PusatDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('keuangan');

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-2 sm:p-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">

          {/* Header */}
          <div className="px-2 pt-2 sm:p-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Master Data
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Sistem manajemen histori pencatatan, validasi, dan mutasi data (Single Source of Truth).
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('keuangan')}
              className={`flex-none px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'keuangan' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
            >
              Keuangan & Biaya
            </button>
            <button
              onClick={() => setActiveTab('produksi')}
              className={`flex-none px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'produksi' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
            >
              Log Produksi
            </button>
            <button
              onClick={() => setActiveTab('inventaris')}
              className={`flex-none px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'inventaris' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
            >
              Mutasi Inventaris
            </button>
            <button
              onClick={() => setActiveTab('aset')}
              className={`flex-none px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'aset' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
            >
              Manajemen Aset
            </button>
            <button
              onClick={() => setActiveTab('suplemen')}
              className={`flex-none px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'suplemen' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
            >
              Suplemen &amp; Obat
            </button>
          </div>

          {/* Render Tab Contents */}
          <div className="mt-4">
            {activeTab === 'inventaris' && <InventoryTab />}

            {activeTab === 'keuangan' && <FinanceTab />}

            {activeTab === 'produksi' && <ProductionTab />}

            {activeTab === 'aset' && <AssetTab />}

            {activeTab === 'suplemen' && <SupplementTab />}
          </div>

        </div>
      </div>
    </AppShell>
  );
}