"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

interface SettingsContextType {
  showHelpBubble: boolean;
  setShowHelpBubble: (show: boolean) => void;
  settingsLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [showHelpBubble, setShowHelpBubble] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      // Guard: skip query if no active session (e.g. on login / reset-password pages)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSettingsLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from('farm_profile')
        .select('show_help_bubble')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        // Default to true if the column doesn't exist yet or is null
        setShowHelpBubble(data.show_help_bubble !== false);
      }
      setSettingsLoaded(true);
    }

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ showHelpBubble, setShowHelpBubble, settingsLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
