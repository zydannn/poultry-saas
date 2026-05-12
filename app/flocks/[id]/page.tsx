'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { submitDailyRecord } from '../actions';
import { 
  Bird, 
  Calendar, 
  ChevronLeft, 
  Egg, 
  AlertTriangle, 
  Activity, 
  ShoppingBag,
  Loader2,
  Save,
  CheckCircle2,
  History
} from 'lucide-react';
import Link from 'next/link';

export default function FlockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [flock, setFlock] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    good_eggs: '',
    broken_eggs: '',
    mortality: '',
    feed_consumed_kg: ''
  });
  
  const [shift, setShift] = useState<'Pagi' | 'Sore'>('Pagi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  const fetchFlockData = async () => {
    try {
      const [flockRes, recordsRes] = await Promise.all([
        supabase.from('flocks').select('*').eq('id', id).maybeSingle(),
        supabase.from('daily_records').select('*').eq('flock_id', id).order('date', { ascending: false }).limit(5)
      ]);

      if (flockRes.data) {
        const hatchDate = new Date(flockRes.data.hatch_date);
        const today = new Date();
        const ageWeeks = Math.floor(Math.abs(today.getTime() - hatchDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        setFlock({ ...flockRes.data, ageWeeks });
      } else {
        router.push('/flocks');
      }

      if (recordsRes.data) {
        setRecentRecords(recordsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFlockData();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const result = await submitDailyRecord({
        flock_id: id,
        date: formData.date,
        shift,
        good_eggs: Number(formData.good_eggs),
        broken_eggs: Number(formData.broken_eggs),
        mortality: Number(formData.mortality),
        feed_consumed_kg: Number(formData.feed_consumed_kg)
      });

      if (!result.success) throw new Error(result.error);

      setSubmitStatus('success');
      setFormData(prev => ({
        ...prev,
        good_eggs: '',
        broken_eggs: '',
        mortality: '',
        feed_consumed_kg: ''
      }));

      // Refresh data
      fetchFlockData();
      
      setTimeout(() => setSubmitStatus('idle'), 3000);

    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </main>
    );
  }

  if (!flock) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 bg-zinc-50 min-h-[calc(100vh-64px)]">
      
      {/* Header with Navigation */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-4">
          <ChevronLeft className="h-4 w-4" /> Kembali ke Dasbor
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
              <Bird className="h-8 w-8 text-emerald-600" />
              {flock.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${flock.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
              Status: {flock.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Umur</p>
            <p className="text-2xl font-bold text-zinc-900">{flock.ageWeeks} <span className="text-sm font-medium text-zinc-500">Minggu</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Input Harian */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="border-b border-zinc-100 pb-4 mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-zinc-900">Catat Data Harian</h2>
            </div>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-medium">Data harian berhasil disimpan!</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Shift Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wide">Pilih Shift</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShift('Pagi')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                      shift === 'Pagi'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    🌅 Pagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShift('Sore')}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                      shift === 'Sore'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-zinc-200 text-zinc-400 hover:bg-zinc-50'
                    }`}
                  >
                    🌇 Sore
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Tanggal Pencatatan</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Egg className="h-4 w-4 text-amber-500" /> Telur Utuh
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="good_eggs"
                      value={formData.good_eggs}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">butir</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-500" /> Telur Retak/Kotor
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="broken_eggs"
                      value={formData.broken_eggs}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">butir</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-emerald-500" /> Pakan Habis
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="feed_consumed_kg"
                      value={formData.feed_consumed_kg}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">Kg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-rose-600" /> Kematian Ayam
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="mortality"
                      value={formData.mortality}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">ekor</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 active:scale-95 transition-all text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Bird className="h-4 w-4 text-emerald-600" /> Info Populasi
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-1">Awal Check-in</p>
                  <p className="font-semibold text-zinc-900">{new Intl.NumberFormat('id-ID').format(flock.initial_population)} ekor</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-500 mb-1">Sisa Hidup</p>
                  <p className="font-bold text-emerald-600 text-lg">{new Intl.NumberFormat('id-ID').format(flock.current_population)} ekor</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <History className="h-4 w-4 text-blue-600" /> 5 Data Terakhir
            </h3>
            {recentRecords.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Belum ada data tercatat.</p>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((record) => (
                  <div key={record.id} className="flex justify-between items-center py-2 border-b border-zinc-50 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                        {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {record.shift && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            record.shift === 'Pagi' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>{record.shift}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-500">{record.feed_consumed_kg} Kg Pakan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-600">{record.good_eggs} butir</p>
                      {record.mortality > 0 && <p className="text-[10px] text-rose-500 font-medium">Mati: {record.mortality}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
