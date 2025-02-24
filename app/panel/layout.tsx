'use client';

import { useState, useCallback } from 'react';
// import { Navbar } from '@/components/layout/Navbar'; // <-- Artık kullanmıyoruz
import { Sidebar } from '@/components/layout/Sidebar';

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebarAction = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {/* <Navbar onToggleSidebarAction={toggleSidebarAction} /> <-- Bu satırı kaldırdık */}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        {/* İçerik alanı */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
