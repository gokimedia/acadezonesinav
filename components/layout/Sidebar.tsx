'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Home,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Ana Sayfa', href: '/panel', icon: Home },
  { name: 'Sınavlar', href: '/panel/sinavlar', icon: BookOpen },
  { name: 'Öğrenciler', href: '/panel/ogrenciler', icon: Users },
  { name: 'Bölümler', href: '/panel/bolumler', icon: GraduationCap },
  { name: 'Sonuçlar', href: '/panel/sonuclar', icon: BarChart3 },
  { name: 'Ayarlar', href: '/panel/ayarlar', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Belirli bir path aktif mi değil mi kontrol fonksiyonu
  const isActive = (path: string) => {
    if (path === '/panel') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Backdrop (mobilde sidebar açıksa arkayı kaplamak için) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-white shadow-md',
          'transition-transform duration-300 ease-in-out md:sticky md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Ana menü"
      >
        {/* Üst kısım: Logo ve Kapat Butonu */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link
            href="/panel"
            className="flex items-center space-x-2"
            onClick={onClose} // Logoya tıklanınca da sidebar'ı kapatmak istenirse
          >
            <span className="text-xl font-bold text-indigo-600">AcadeZone</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menü Kısmı */}
        <nav className="flex-1 space-y-1 px-2 py-4" role="navigation">
          <h2 className="sr-only">Ana menü</h2>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    active
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
