export type Locale = 'en' | 'id';

export const translations = {
    en: {
        // App
        appName: 'PoultryOS',
        appTagline: 'Farm Intelligence Platform',
        mockBadge: 'Demo · Mock Data',

        // Nav / Header
        logout: 'Logout',
        logoutConfirm: 'Logging out…',
        navOpen: 'Open navigation',

        // Sidebar
        navDashboard: 'Dashboard',
        navDailyInput: 'Daily Input',
        navFlocks: 'Flock Management',
        navInventory: 'Inventory & Stock',
        navFinance: 'Finance',
        navReports: 'Reports',
        navDataCenter: 'Master Data',
        navSettings: 'Settings',

        // Dashboard
        dashboardTitle: 'Farm Dashboard',
        dashboardPeriod: 'Financial overview · Period: February 2026',
        bigThreeLabel: 'Key Performance Metrics',
        dailyRecordingLabel: 'Daily Recording',
        priceComparisonLabel: 'Price Comparison',
        footer: 'PoultryOS · Alpha · Mock data for UI demonstration',

        // Summary Bar
        totalEggs: 'Total Eggs',
        fixedCost: 'Fixed Cost',
        variableCost: 'Variable Cost',

        // KPI Cards
        hppLabel: 'HPP / Egg',
        hppSub: 'Cost of Goods Sold per egg',
        recommendedPriceLabel: 'Recommended Price',
        recommendedPriceSub: 'Recommended selling price',
        bepProfitBadge: 'Profit',
        bepLossBadge: 'Loss',
        profitPerEgg: 'profit per egg vs. market',
        lossPerEgg: 'loss per egg vs. market',
        bepNeeded: 'eggs needed',
        eggsProduced: 'eggs produced',

        // Price Comparison
        marketPrice: 'Market Price',
        hppCostPerEgg: 'HPP (Cost/Egg)',
        recommendedPriceShort: 'Recommended Price',

        // Login Page
        signIn: 'Sign In',
        signUp: 'Create Account',
        email: 'Email',
        password: 'Password',
        emailPlaceholder: 'you@example.com',
        passwordPlaceholder: 'Min. 6 characters',
        signingIn: 'Signing in…',
        signingUp: 'Creating account…',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        authError: 'An error occurred. Please try again.',
        checkEmail: 'Check your email to confirm your account!',

        // Daily Input Form
        dailyInputTitle: 'Daily Input',
        dailyInputSub: "Record today's farm activity",
        goodEggs: 'Good Eggs',
        damagedEggs: 'Damaged Eggs',
        mortality: 'Mortality',
        feedUsed: 'Feed Used',
        totalEggsLabel: 'Total eggs',
        saveData: 'Save Data',
        saved: 'Saved!',
    },

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
        checkEmail: 'Periksa email Anda untuk konfirmasi akun!',

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

export type TranslationKey = keyof typeof translations.en;
