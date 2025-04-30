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
  X,
  GraduationCap,
  Activity
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';
import SideNav from '../components/SideNav';
import { createServerClient } from '@/lib/supabase';

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

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideNav 
        links={[
          { href: '/panel', label: 'Anasayfa', icon: 'home' },
          { href: '/panel/sinavlar', label: 'Sınavlar', icon: 'book' },
          { href: '/panel/soru-bankasi', label: 'Soru Bankası', icon: 'database' },
          { href: '/panel/ogrenciler', label: 'Öğrenciler', icon: 'users' },
          { href: '/panel/bolumler', label: 'Bölümler', icon: 'layers' },
          { 
            href: '/panel/performans', 
            label: 'Performans', 
            icon: 'activity',
            highlight: true
          },
          { href: '/panel/profil', label: 'Profil', icon: 'user' },
          { href: '/panel/ayarlar', label: 'Ayarlar', icon: 'settings' }
        ]}
      />
      <div className="flex-1">
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}