'use client';

import React, { useState } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar'; // adjust import based on your exports
import Header from './Header';

export default function AppShell({ children, userEmail }: { children: React.ReactNode, userEmail?: string }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50">
      {/* 1. Desktop Sidebar (Static, Fixed Width) */}
      <Sidebar />

      {/* 2. Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userEmail={userEmail} onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* 3. Mobile Drawer */}
      <MobileSidebar open={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </div>
  );
}
