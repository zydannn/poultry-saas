'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Egg, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Mode = 'request' | 'update' | 'done';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    // PKCE flow: callback route adds ?recovery=1 after exchanging the code server-side.
    // Implicit flow: PASSWORD_RECOVERY event fires when hash token is detected client-side.
    const params = new URLSearchParams(window.location.search);
    if (params.get('recovery') === '1') {
      setMode('update');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal mengirim email. Periksa alamat email Anda.' });
    } else {
      setMessage({
        type: 'success',
        text: 'Link reset password telah dikirim ke email Anda. Silakan periksa inbox.',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui password. Coba minta link reset baru.' });
    } else {
      setMode('done');
      setTimeout(() => router.push('/dashboard'), 3000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-lg">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 border-b border-border px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Egg className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-card-foreground">PoultryOS</h1>
          <p className="text-xs text-muted-foreground text-center">
            {mode === 'update' ? 'Buat password baru' : 'Reset password akun Anda'}
          </p>
        </div>

        <div className="p-6">
          {/* Mode: Done */}
          {mode === 'done' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Password berhasil diubah!</p>
                <p className="text-xs text-zinc-500 mt-1">Mengalihkan ke dashboard...</p>
              </div>
            </div>
          )}

          {/* Mode: Request */}
          {mode === 'request' && (
            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Masukkan email akun Anda. Kami akan mengirimkan link untuk membuat password baru.
              </p>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anda@contoh.com"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              {message && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  message.type === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {message.type === 'error'
                    ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>
          )}

          {/* Mode: Update */}
          {mode === 'update' && (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Masukkan password baru untuk akun Anda.
              </p>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-sm font-medium text-card-foreground">
                  Konfirmasi Password
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              {message && (
                <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  message.type === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {message.type === 'error'
                    ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}

          {/* Back to login */}
          {mode !== 'done' && (
            <div className="mt-5 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke halaman masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
