"use client";

import React, { useState } from 'react';
import AppShell from '@/components/AppShell';
import { 
  Store, 
  TrendingUp, 
  ShieldCheck, 
  LogOut,
  Save,
  KeyRound,
  Eye,
  Loader2
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

export default function SettingsPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingParams, setIsSavingParams] = useState(false);
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  // Settings Context for global toggle
  const { showHelpBubble: globalShowHelpBubble, setShowHelpBubble: setGlobalShowHelpBubble } = useSettings();
  const [showHelpBubble, setShowHelpBubble] = useState(globalShowHelpBubble);

  // Card 1: Farm Profile State
  const [profile, setProfile] = useState({
    farmName: '',
    ownerName: '',
    location: '',
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Card 2: Business Parameters State
  const [parameters, setParameters] = useState({
    sellingPrice: '',
    marketPrice: '',
    defaultEggWeight: '60',
    targetMarginPercent: '20',
    standardFeedPerBirdKg: '0.115',
    birdDepreciationPerDay: '150',
    targetHdpPercent: '80',
  });
  const [paramsError, setParamsError] = useState<string | null>(null);
  const [paramsSuccess, setParamsSuccess] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);

  // Card 3: Security State
  const [security, setSecurity] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Fetch Data on Load
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('farm_profile')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettingsId(data.id);
        setProfile({
          farmName: data.farm_name || '',
          ownerName: data.owner_name || '',
          location: data.location || '',
        });
        setParameters({
          sellingPrice: data.selling_price?.toString() || '',
          marketPrice: data.market_price?.toString() || '',
          defaultEggWeight: data.default_egg_weight_grams?.toString() || '60',
          targetMarginPercent: data.target_margin_percent?.toString() || '20',
          standardFeedPerBirdKg: data.standard_feed_per_bird_kg?.toString() || '0.115',
          birdDepreciationPerDay: data.bird_depreciation_per_day?.toString() || '150',
          targetHdpPercent: data.target_hdp_percent?.toString() || '80',
        });
        // Default to true if null (column may not exist yet)
        setShowHelpBubble(data.show_help_bubble !== false);
      }
      setIsLoading(false);
      
      // Auto-fill user email from session
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setSecurity(prev => ({ ...prev, email: user.email! }));
      }
    }

    loadSettings();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurity(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
    
    let errorMsg = null;

    if (settingsId) {
      const res = await supabase
        .from('farm_profile')
        .update({
          farm_name: profile.farmName,
          owner_name: profile.ownerName,
          location: profile.location,
        })
        .eq('id', settingsId);
      errorMsg = res.error?.message;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await supabase
        .from('farm_profile')
        .insert({
          farm_name: profile.farmName,
          owner_name: profile.ownerName,
          location: profile.location,
          user_id: user?.id,
        })
        .select('id')
        .maybeSingle();
      if (res.data) setSettingsId(res.data.id);
      errorMsg = res.error?.message;
    }

    setIsSavingProfile(false);
    
    if (errorMsg) {
      setProfileError('Gagal menyimpan profil: ' + errorMsg);
    } else {
      setProfileSuccess(true);
      router.refresh(); // REFRESH CACHE: Trigger Next.js layout/page re-validation
      setTimeout(() => setProfileSuccess(false), 4000);
    }
  };

  const saveParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    setParamsError(null);
    setParamsSuccess(false);
    setIsSavingParams(true);
    let error;

    if (settingsId) {
      const res = await supabase
        .from('farm_profile')
        .update({
          selling_price: Number(parameters.sellingPrice),
          market_price: Number(parameters.marketPrice),
          default_egg_weight_grams: Number(parameters.defaultEggWeight),
          target_margin_percent: Number(parameters.targetMarginPercent),
          standard_feed_per_bird_kg: Number(parameters.standardFeedPerBirdKg),
          bird_depreciation_per_day: Number(parameters.birdDepreciationPerDay),
          target_hdp_percent: Number(parameters.targetHdpPercent),
        })
        .eq('id', settingsId);
      error = res.error;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await supabase
        .from('farm_profile')
        .insert({
          selling_price: Number(parameters.sellingPrice),
          market_price: Number(parameters.marketPrice),
          default_egg_weight_grams: Number(parameters.defaultEggWeight),
          target_margin_percent: Number(parameters.targetMarginPercent),
          standard_feed_per_bird_kg: Number(parameters.standardFeedPerBirdKg),
          bird_depreciation_per_day: Number(parameters.birdDepreciationPerDay),
          target_hdp_percent: Number(parameters.targetHdpPercent),
          user_id: user?.id,
        })
        .select('id')
        .maybeSingle();
      if (res.data) setSettingsId(res.data.id);
      error = res.error;
    }

    setIsSavingParams(false);

    if (error) {
      setParamsError('Gagal memperbarui parameter: ' + error.message);
    } else {
      setParamsSuccess(true);
      router.refresh();
      setTimeout(() => setParamsSuccess(false), 4000);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!security.newPassword) {
      setPasswordError('Masukkan password baru terlebih dahulu.');
      return;
    }
    if (security.newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter.');
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      setPasswordError('Password baru dan konfirmasi tidak cocok. Periksa kembali.');
      return;
    }
    setIsSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: security.newPassword });
    setIsSavingPassword(false);
    if (error) {
      setPasswordError('Gagal memperbarui password: ' + error.message);
    } else {
      setPasswordSuccess(true);
      setSecurity(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      setTimeout(() => setPasswordSuccess(false), 4000);
    }
  };



  useEffect(() => {
    setShowHelpBubble(globalShowHelpBubble);
  }, [globalShowHelpBubble]);

  const savePref = async (newVal: boolean) => {
    // Update local state AND global context immediately for real-time reflection
    setShowHelpBubble(newVal);
    setGlobalShowHelpBubble(newVal);
    
    setIsSavingPref(true);
    let errorMsg = null;

    if (settingsId) {
      const res = await supabase
        .from('farm_profile')
        .update({ show_help_bubble: newVal })
        .eq('id', settingsId);
      errorMsg = res.error?.message;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await supabase
        .from('farm_profile')
        .insert({ show_help_bubble: newVal, user_id: user?.id })
        .select('id')
        .maybeSingle();
      if (res.data) setSettingsId(res.data.id);
      errorMsg = res.error?.message;
    }
    
    if (errorMsg) {
      setPrefError('Gagal menyimpan preferensi: ' + errorMsg);
      // Revert state on failure
      setShowHelpBubble(!newVal);
      setGlobalShowHelpBubble(!newVal);
    }
    
    setIsSavingPref(false);
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8">
          
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Pengaturan Sistem</h1>
            <p className="text-zinc-500 mt-1">Kelola profil, parameter bisnis, dan keamanan akun Anda.</p>
          </div>

          {/* Card 1: Profil Peternakan */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-4 mb-5">
              <Store className="w-5 h-5 text-zinc-500" />
              Profil Peternakan
            </h2>
            <form onSubmit={saveProfile} className="space-y-5">
              {/* UI Banners for Error/Success */}
              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Profil Peternakan berhasil diperbarui!
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Nama Peternakan</label>
                <input
                  type="text"
                  name="farmName"
                  value={profile.farmName}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Nama Pemilik</label>
                <input
                  type="text"
                  name="ownerName"
                  value={profile.ownerName}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Alamat / Lokasi Kandang</label>
                <textarea
                  name="location"
                  value={profile.location}
                  onChange={handleProfileChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  required
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile || isLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Parameter Bisnis & HPP */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-4 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Parameter Keuangan & Produksi
            </h2>
            <p className="text-xs text-zinc-500 mb-5 bg-zinc-50 p-2.5 rounded-md border border-zinc-100">
              <strong className="text-zinc-700">Penting:</strong> Data ini digunakan sebagai patokan dasar untuk kalkulasi estimasi BEP dan margin di Dasbor Anda.
            </p>
            <form onSubmit={saveParameters} className="space-y-5">
              {paramsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {paramsError}
                </div>
              )}
              {paramsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Parameter Bisnis &amp; HPP berhasil diperbarui!
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Harga Jual Telur */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                     Harga Jual Telur
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">Rp / Butir</span>
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={parameters.sellingPrice}
                    onChange={handleParamChange}
                    min="0"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Harga yang Anda pakai saat menjual telur. Dipakai sebagai pembanding HPP — jika lebih rendah dari HPP, Anda merugi per butir.</p>
                </div>

                {/* Harga Pasar Saat Ini */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    Harga Pasar Saat Ini
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">Rp / Butir</span>
                  </label>
                  <input
                    type="number"
                    name="marketPrice"
                    value={parameters.marketPrice}
                    onChange={handleParamChange}
                    min="0"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Harga telur di pasaran lokal hari ini. Diisi manual dan diperbarui sesuai kondisi pasar. Tampil sebagai acuan di Dashboard.</p>
                </div>

                {/* Standar Berat Telur */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    Standar Berat Telur
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">Gram</span>
                  </label>
                  <input
                    type="number"
                    name="defaultEggWeight"
                    value={parameters.defaultEggWeight}
                    onChange={handleParamChange}
                    min="1"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Berat rata-rata per butir telur. Dipakai untuk konversi HPP/butir ke HPP/Kg. Umumnya 55–65 gram untuk layer.</p>
                </div>

                {/* Target Margin Profit */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    Target Margin Profit
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">%</span>
                  </label>
                  <input
                    type="number"
                    name="targetMarginPercent"
                    value={parameters.targetMarginPercent}
                    onChange={handleParamChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Persentase laba yang ingin dicapai. Contoh: isi 20 → sistem sarankan harga jual = HPP ÷ (1 − 20%).</p>
                </div>

                {/* Standar Pakan / Ekor */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    Standar Pakan / Ekor
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">Kg / Hari</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="standardFeedPerBirdKg"
                    value={parameters.standardFeedPerBirdKg}
                    onChange={handleParamChange}
                    min="0"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Konsumsi pakan rata-rata per ekor per hari. Standar ayam layer: 0.110–0.120 Kg. Dipakai untuk proyeksi biaya pakan.</p>
                </div>

                {/* Penyusutan Ayam / Ekor */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    Penyusutan Ayam / Ekor
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">Rp / Hari</span>
                  </label>
                  <input
                    type="number"
                    name="birdDepreciationPerDay"
                    value={parameters.birdDepreciationPerDay}
                    onChange={handleParamChange}
                    min="0"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Biaya penyusutan ayam per ekor per hari. Rumus: Harga Beli Ayam ÷ Jumlah Ekor ÷ Masa Produktif (hari). Masuk ke Biaya Tetap.</p>
                </div>

                {/* Target HDP */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
                    Target HDP
                    <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200">% / Hari</span>
                  </label>
                  <input
                    type="number"
                    name="targetHdpPercent"
                    value={parameters.targetHdpPercent}
                    onChange={handleParamChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">Target Hen Day Production harian. Dipakai untuk memproyeksikan HPP saat belum ada data panen hari ini. Standar produktif: 75–85%.</p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingParams || isLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSavingParams ? 'Menyimpan...' : 'Simpan Parameter'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Preferensi Tampilan */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-4 mb-5">
              <Eye className="w-5 h-5 text-zinc-500" />
              Preferensi Tampilan
            </h2>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-800">Tampilkan Gelembung Panduan (Help Bubble)</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Tombol bantuan mengambang di sudut kanan bawah layar. Nonaktifkan jika Anda sudah mahir menggunakan PoultryOS.
                </p>
              </div>
              {/* Animated Toggle Switch */}
              <button
                role="switch"
                aria-checked={showHelpBubble}
                onClick={() => savePref(!showHelpBubble)}
                disabled={isSavingPref || isLoading}
                className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 ${
                  showHelpBubble ? 'bg-zinc-900' : 'bg-zinc-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    showHelpBubble ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isSavingPref && (
              <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-3">
                <Loader2 className="w-3 h-3 animate-spin" />
                Menyimpan preferensi...
              </p>
            )}
            {prefError && (
              <p className="text-xs text-rose-600 mt-2">{prefError}</p>
            )}
          </div>

          {/* Card 4: Keamanan Akun */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-4 mb-5">
              <ShieldCheck className="w-5 h-5 text-zinc-500" />
              Keamanan Akun
            </h2>
            <form onSubmit={updatePassword} className="space-y-5">
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Password berhasil diperbarui!
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Email Aktif</label>
                <input
                  type="email"
                  value={security.email}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50 text-zinc-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Password Baru</label>
                <input
                  type="password"
                  name="newPassword"
                  value={security.newPassword}
                  onChange={handleSecurityChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Opsional (Kosongkan jika tidak ingin mengubah)"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={security.confirmPassword}
                  onChange={handleSecurityChange}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Ketik ulang password baru"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="flex items-center gap-2 px-5 py-2 border border-zinc-200 bg-white text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingPassword
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                    : <><KeyRound className="w-4 h-4 text-zinc-500" /> Perbarui Password</>
                  }
                </button>
              </div>
            </form>

            <hr className="my-8 border-t border-zinc-200" />
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                <p className="text-xs text-zinc-500">Aksi ini akan mengeluarkan Anda dari sesi saat ini.</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex justify-center items-center gap-2 px-5 py-2.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Memproses Keluar...' : 'Keluar / Logout'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </AppShell>
  );
}
