'use client';

import {
    createContext,
    useContext,
    type ReactNode,
} from 'react';
import { translations, type Locale, type TranslationKey } from '@/lib/i18n';

interface LanguageContextValue {
    locale: Locale;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // PoultryOS targets Indonesian farmers only — locale is always 'id'.
    const locale: Locale = 'id';
    const t = (key: TranslationKey): string => translations.id[key];

    return (
        <LanguageContext.Provider value={{ locale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
    return ctx;
}
