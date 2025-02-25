'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  LogOut, 
  X 
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  hasSubMenu?: boolean;
  isSubMenuOpen?: boolean;
  onToggleSubMenu?: () => void;
  children?: React.ReactNode;
}

const NavItem = ({ 
  href, 
  icon, 
  title, 
  isActive, 
  hasSubMenu, 
  isSubMenuOpen, 
  onToggleSubMenu,
  children 
}: NavItemProps) => {
  return (
    <li className="mb-1">
      <Link 
        href={hasSubMenu ? '#' : href}
        onClick={hasSubMenu ? onToggleSubMenu : undefined}
        className={`flex items-center gap-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-50 text-blue-700' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-grow font-medium">{title}</span>
        {hasSubMenu && (
          <span className="flex-shrink-0">
            {isSubMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        )}
      </Link>
      
      {hasSubMenu && isSubMenuOpen && (
        <ul className="mt-1 ml-6 pl-4 border-l border-gray-200 space-y-1">
          {children}
        </ul>
      )}
    </li>
  );
};

const SubNavItem = ({ href, title, isActive }: { href: string; title: string; isActive: boolean }) => {
  return (
    <li>
      <Link 
        href={href}
        className={`flex items-center py-2 px-2 rounded-md transition-colors ${
          isActive 
            ? 'text-blue-700 bg-blue-50' 
            : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
        }`}
      >
        <span className="before:content-['•'] before:mr-2 before:text-gray-400">{title}</span>
      </Link>
    </li>
  );
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sinavlarOpen, setSinavlarOpen] = useState(true);
  const [ogrencilerOpen, setOgrencilerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Aşağıdaki kod mobil ekranlarda kenar çubuğunu otomatik gizler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Sayfa yüklendiğinde çalıştır

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Kenar Çubuğu (Sidebar) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200">
            <Link href="/panel" className="flex items-center">
              <img 
                src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/logo.png" 
                alt="AcadeZone" 
                className="h-8"
              />
              <span className="ml-3 text-xl font-bold text-blue-900">AcadeZone</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              <NavItem 
                href="/panel" 
                icon={<BarChart3 size={20} />}
                title="Dashboard"
                isActive={pathname === '/panel'}
              />
              
              <NavItem 
                href="#" 
                icon={<Layers size={20} />}
                title="Sınavlar"
                isActive={pathname.startsWith('/panel/sinavlar')}
                hasSubMenu={true}
                isSubMenuOpen={sinavlarOpen}
                onToggleSubMenu={() => setSinavlarOpen(!sinavlarOpen)}
              >
                <SubNavItem 
                  href="/panel/sinavlar" 
                  title="Tüm Sınavlar" 
                  isActive={pathname === '/panel/sinavlar'}
                />
                <SubNavItem 
                  href="/panel/sinavlar/create" 
                  title="Yeni Sınav" 
                  isActive={pathname === '/panel/sinavlar/create'}
                />
              </NavItem>
              
              <NavItem 
                href="#" 
                icon={<Users size={20} />}
                title="Öğrenciler"
                isActive={pathname.startsWith('/panel/ogrenciler')}
                hasSubMenu={true}
                isSubMenuOpen={ogrencilerOpen}
                onToggleSubMenu={() => setOgrencilerOpen(!ogrencilerOpen)}
              >
                <SubNavItem 
                  href="/panel/ogrenciler" 
                  title="Tüm Öğrenciler" 
                  isActive={pathname === '/panel/ogrenciler'}
                />
                <SubNavItem 
                  href="/panel/ogrenciler/create" 
                  title="Yeni Öğrenci" 
                  isActive={pathname === '/panel/ogrenciler/create'}
                />
              </NavItem>
              
              <NavItem 
                href="/panel/ayarlar" 
                icon={<Settings size={20} />}
                title="Ayarlar"
                isActive={pathname === '/panel/ayarlar'}
              />
            </ul>
          </nav>
          
          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} className="mr-3" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 focus:outline-none lg:hidden"
              >
                <Menu size={24} />
              </button>
              <h1 className="ml-4 text-lg font-semibold text-gray-800">Yönetici Paneli</h1>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                  <img
                    src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
                    alt="User"
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}