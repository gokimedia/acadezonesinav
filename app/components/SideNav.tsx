'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Book, 
  Database, 
  Users, 
  Layers, 
  User, 
  Settings,
  Activity,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface NavLink {
  href: string
  label: string
  icon: string
  highlight?: boolean
  children?: NavLink[]
}

export default function SideNav({ links }: { links: NavLink[] }) {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Mobil cihazlarda otomatik olarak menüyü kapat
  useState(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsOpen(window.innerWidth >= 1024)
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      handleResize()
      
      return () => window.removeEventListener('resize', handleResize)
    }
  })
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return <Home size={18} />
      case 'book': return <Book size={18} />
      case 'database': return <Database size={18} />
      case 'users': return <Users size={18} />
      case 'layers': return <Layers size={18} />
      case 'activity': return <Activity size={18} />
      case 'user': return <User size={18} />
      case 'settings': return <Settings size={18} />
      default: return <Home size={18} />
    }
  }
  
  return (
    <>
      {/* Mobil menü açma butonu */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        <Menu size={24} />
      </button>
      
      {/* Kenar çubuğu */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo ve başlık */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200">
            <Link href="/panel" className="flex items-center">
              <span className="text-xl font-bold text-blue-900">AcadeZone</span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Navigasyon menü öğeleri */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {links.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${
                      pathname === link.href 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-slate-700 hover:bg-slate-100'
                    } ${link.highlight ? 'border border-blue-200' : ''}`}
                  >
                    <span className="mr-3 text-[1.1em]">{getIcon(link.icon)}</span>
                    <span className="font-medium">{link.label}</span>
                    {link.highlight && (
                      <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        Yeni
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Alt bölüm - çıkış yap */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut size={18} className="mr-3" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Karartma overlay - sadece mobil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
} 