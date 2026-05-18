export type Locale = 'id';

export const translations = {
    id: {
        // App
        appName: 'PoultryOS',
        appTagline: 'Platform Kecerdasan Peternakan',
        mockBadge: 'Demo · Data Uji Coba',

        // Nav / Header
        logout: 'Keluar',
        logoutConfirm: 'Sedang keluar…',
        navOpen: 'Buka navigasi',

        // Sidebar
        navDashboard: 'Dasbor',
        navDailyInput: 'Input Harian',
        navFlocks: 'Manajemen Kandang',
        navInventory: 'Inventory & Stok',
        navFinance: 'Keuangan',
        navReports: 'Laporan',
        navDataCenter: 'Master Data',
        navSettings: 'Pengaturan',

        // Dashboard
        dashboardTitle: 'Dasbor Peternakan',
        dashboardPeriod: 'Ringkasan keuangan · Periode: Februari 2026',
        bigThreeLabel: 'Metrik Kinerja Utama',
        dailyRecordingLabel: 'Pencatatan Harian',
        priceComparisonLabel: 'Perbandingan Harga',
        footer: 'PoultryOS · Alpha · Data uji coba untuk demonstrasi',

        // Summary Bar
        totalEggs: 'Total Telur',
        fixedCost: 'Biaya Tetap',
        variableCost: 'Biaya Variabel',

        // KPI Cards
        hppLabel: 'HPP / Butir',
        hppSub: 'Harga Pokok Produksi per butir telur',
        recommendedPriceLabel: 'Harga Jual Rekomendasi',
        recommendedPriceSub: 'Harga jual yang disarankan',
        bepProfitBadge: 'Untung',
        bepLossBadge: 'Rugi',
        profitPerEgg: 'keuntungan per butir vs. pasar',
        lossPerEgg: 'kerugian per butir vs. pasar',
        bepNeeded: 'telur diperlukan',
        eggsProduced: 'telur diproduksi',

        // Price Comparison
        marketPrice: 'Harga Pasar',
        hppCostPerEgg: 'HPP (Biaya/Butir)',
        recommendedPriceShort: 'Harga Rekomendasi',

        // Login Page
        signIn: 'Masuk',
        signUp: 'Buat Akun',
        email: 'Email',
        password: 'Kata Sandi',
        emailPlaceholder: 'anda@contoh.com',
        passwordPlaceholder: 'Min. 6 karakter',
        signingIn: 'Sedang masuk…',
        signingUp: 'Membuat akun…',
        noAccount: 'Belum punya akun?',
        hasAccount: 'Sudah punya akun?',
        authError: 'Terjadi kesalahan. Silakan coba lagi.',
        authErrorInvalidCredentials: 'Email atau kata sandi salah. Silakan coba lagi.',
        authErrorEmailNotConfirmed: 'Email Anda belum dikonfirmasi. Periksa kotak masuk (atau folder spam) dan klik link konfirmasi yang dikirim saat pendaftaran.',
        authErrorResendConfirmation: 'Kirim ulang email konfirmasi',
        authErrorResendSuccess: 'Email konfirmasi terkirim! Silakan periksa kotak masuk Anda.',
        checkEmail: 'Akun berhasil dibuat! Periksa email Anda dan klik link konfirmasi untuk mengaktifkan akun.',

        // Daily Input Form
        dailyInputTitle: 'Input Harian',
        dailyInputSub: 'Catat aktivitas peternakan hari ini',
        goodEggs: 'Telur Baik',
        damagedEggs: 'Telur Retak',
        mortality: 'Kematian',
        feedUsed: 'Pakan Terpakai',
        totalEggsLabel: 'Total telur',
        saveData: 'Simpan Data',
        saved: 'Tersimpan!',
    },
} as const;

export type TranslationKey = keyof typeof translations.id;
