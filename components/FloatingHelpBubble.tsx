"use client";

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import OnboardingGuide from '@/components/OnboardingGuide';
import { useSettings } from '@/context/SettingsContext';

export default function FloatingHelpBubble() {
  const { showHelpBubble, settingsLoaded } = useSettings();
  const [guideOpen, setGuideOpen] = useState(false);

  // Don't render anything until we know the setting, or if it's turned off
  if (!settingsLoaded || !showHelpBubble) return null;

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setGuideOpen(true)}
        aria-label="Buka Panduan"
        className={`
          fixed bottom-6 right-6 z-40
          w-13 h-13 p-3.5
          bg-zinc-900 text-white rounded-full shadow-xl
          hover:bg-zinc-700 hover:scale-110 active:scale-95
          transition-all duration-200
          flex items-center justify-center
          ring-2 ring-white/10
        `}
      >
        {guideOpen
          ? <X className="w-5 h-5" />
          : <HelpCircle className="w-5 h-5" />}
      </button>

      {/* Tooltip label (shows on hover via group, CSS-only) */}
      <span
        className={`
          fixed bottom-7 right-20 z-40
          bg-zinc-900 text-white text-xs font-medium
          px-2.5 py-1.5 rounded-lg shadow-md
          pointer-events-none select-none
          opacity-0 translate-x-2 transition-all duration-200
          peer-hover:opacity-100
        `}
      >
        Panduan
      </span>

      {/* ── Controlled OnboardingGuide Modal ─────────────────────────────── */}
      <OnboardingGuide
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
}
