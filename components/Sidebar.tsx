'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
    LayoutDashboard,
    Database,
    TrendingUp,
    BarChart2,
    Settings,
    Egg,
    X,
    Package,
    Bird,
    ClipboardList,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { type TranslationKey } from '@/lib/i18n';

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
    href:     string;
    icon:     React.ElementType;
    labelKey: TranslationKey;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard',    icon: LayoutDashboard, labelKey: 'navDashboard'  },
    { href: '/daily-input',  icon: ClipboardList,   labelKey: 'navDailyInput' },
    { href: '/flocks',       icon: Bird,            labelKey: 'navFlocks'     },
    { href: '/inventory',  icon: Package,         labelKey: 'navInventory'  },
    { href: '/keuangan',   icon: TrendingUp,      labelKey: 'navFinance'    },
    { href: '/laporan',    icon: BarChart2,       labelKey: 'navReports'    },
    { href: '/pusat-data', icon: Database,         labelKey: 'navDataCenter' },
    { href: '/pengaturan', icon: Settings,        labelKey: 'navSettings'   },
];

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({
    item,
    pathname,
    onClick,
}: {
    item:     NavItem;
    pathname: string;
    onClick?: () => void;
}) {
    const { t } = useLanguage();
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
        >
            <Icon
                className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
            />
            <span>{t(item.labelKey)}</span>
        </Link>
    );
}

// ─── Shared sidebar content ───────────────────────────────────────────────────

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();
    const { t }    = useLanguage();

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <Egg className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white leading-tight">{t('appName')}</p>
                    <p className="text-[10px] text-zinc-500 leading-tight">{t('appTagline')}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    Menu
                </p>
                <ul className="flex flex-col gap-0.5">
                    {NAV_ITEMS.map((item) => (
                        <li key={item.href}>
                            <NavLink
                                item={item}
                                pathname={pathname}
                                onClick={onLinkClick}
                            />
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="shrink-0 border-t border-white/10 px-5 py-3">
                <p className="text-[10px] text-zinc-600">{t('appName')} · Alpha</p>
            </div>
        </div>
    );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
//
// NOTE: No `fixed` positioning — AppShell uses a flex-row layout so this
// sidebar is a natural flex item. This guarantees it renders on every browser
// and Tailwind version without relying on CSS variable resolution.
//

export function Sidebar() {
    return (
        <aside className="hidden lg:flex w-64 flex-col bg-zinc-950 text-white border-r border-zinc-800" style={{ backgroundColor: '#09090b' }}>
            <SidebarContent />
        </aside>
    );
}

// ─── Mobile Sidebar (Dialog / Sheet) ─────────────────────────────────────────

interface MobileSidebarProps {
    open:    boolean;
    onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
    const { t } = useLanguage();

    return (
        <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                    className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300"
                    style={{ backgroundColor: '#09090b' }}
                >
                    <Dialog.Title className="sr-only">Navigasi Utama</Dialog.Title>
                    <Dialog.Description className="sr-only">Menu navigasi utama aplikasi PoultryOS</Dialog.Description>
                    <Dialog.Close asChild>
                        <button
                            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Dialog.Close>
                    <SidebarContent onLinkClick={onClose} />
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
