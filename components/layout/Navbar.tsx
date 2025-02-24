'use client';

import { useState } from 'react';
import { Menu, X, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onToggleSidebarAction: () => void;
  isLoggedIn?: boolean;         // Kullanıcının giriş yapıp yapmadığını belirlemek için ekledik
  onLogout?: () => void;        // Çıkış işlemini tetiklemek için callback
  onLogin?: () => void;         // Giriş işlemini tetiklemek için callback (opsiyonel)
}

export function Navbar({
  onToggleSidebarAction,
  isLoggedIn = false,
  onLogout,
  onLogin,
}: NavbarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    onToggleSidebarAction?.();
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          {/* Sol kısım: Menü butonu ve logo */}
          <div className="flex items-center">
            <button
              onClick={handleToggleSidebar}
              type="button"
              aria-label="Toggle sidebar"
              className="inline-flex items-center p-2 text-sm text-gray-600 rounded-lg 
                         hover:bg-gray-100 focus:outline-none focus:ring-2 
                         focus:ring-gray-200 transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <Link
              href="/panel"
              className="flex ml-2 md:mr-24 gap-2 items-center"
            >
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
                AcadeZone
              </span>
            </Link>
          </div>

          {/* Sağ kısım: Giriş/Çıkış butonları */}
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Çıkış Yap
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
