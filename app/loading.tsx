/**
 * Root loading.tsx — ditampilkan Next.js App Router selama navigasi antar route
 * sebelum server component selesai render (auth check di setiap page.tsx).
 */
export default function RootLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-900" />
                <p className="text-sm font-medium text-zinc-400">Memuat...</p>
            </div>
        </div>
    );
}
