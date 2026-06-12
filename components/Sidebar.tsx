"use client";

import { useProfileStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  { icon: "dashboard", label: "Dasbor", href: "/dashboard" },
  { icon: "traffic", label: "Persimpangan", href: "/persimpangan" },
  { icon: "analytics", label: "Analist", href: "/Analist" },
  { icon: "settings_remote", label: "Remote IoT", href: "/iot-config" },
  { icon: "group", label: "Manajemen Pengguna", href: "/pengguna" },
  { icon: "menu_book", label: "Panduan Sistem", href: "/panduan" },
  { icon: "article", label: "Panduan Lengkap", href: "/panduan-lengkap" },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function Sidebar({ isOpen: externalIsOpen, onToggle }: SidebarProps = {}) {
  const pathname = usePathname();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { fetchProfile } = useProfileStore();

  // Use external state if provided, otherwise use internal
  const isSidebarOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsSidebarOpen = (open: boolean) => {
    if (onToggle) {
      onToggle(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    // Desktop: keep sidebar state as is (don't auto-close or auto-open)
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // On mobile, close sidebar
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
      // On desktop, keep current state (don't force open/close)
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Header - Removed, now handled by Header component */}

      {/* Overlay - Mobile Only */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`h-screen lg:h-[calc(100vh-4rem)] fixed left-0 top-0 lg:top-16 flex flex-col z-50 shadow-2xl overflow-hidden ${
          isSidebarOpen 
            ? "w-64 translate-x-0 p-4 bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800" 
            : "w-0 lg:w-20 -translate-x-full lg:translate-x-0 lg:p-2 lg:bg-gradient-to-b lg:from-blue-600 lg:via-blue-700 lg:to-indigo-800"
        }`}
      >
        <div className={`lg:hidden ${isSidebarOpen ? 'block px-2 mb-6' : 'hidden'}`}>
          {/* Toggle Button + Logo + Status - Mobile Only */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0"
              aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
              title={isSidebarOpen ? "Tutup Menu" : "Buka Menu"}
            >
              <span className="material-symbols-outlined text-xl">
                menu
              </span>
            </button>
            
            {/* Logo and Status - Mobile Only */}
            <Link 
              href="/" 
              className="flex-1 min-w-0 flex items-center gap-2"
            >
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white tracking-tighter font-headline truncate hover:text-blue-200 transition-colors cursor-pointer">
                  ASTRAEA
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-[10px] text-blue-200 font-medium">IoT: Terhubung</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl font-manrope font-semibold text-sm relative ${
                    isActive
                      ? "bg-white text-blue-700 shadow-xl shadow-blue-900/30"
                      : "text-blue-100 hover:bg-white/10 hover:text-white hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm"
                  } ${
                    isSidebarOpen 
                      ? 'px-4 py-3' 
                      : 'lg:justify-center lg:px-3 lg:py-3 lg:mx-auto lg:w-14'
                  }`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <span
                    className={`material-symbols-outlined ${
                      isActive ? "" : "group-hover:scale-110"
                    } ${!isSidebarOpen ? 'lg:text-2xl' : ''}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className={`whitespace-nowrap ${
                    isSidebarOpen ? 'block' : 'hidden'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && isSidebarOpen && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!isSidebarOpen && (
                    <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-white/20">
          <Link
            href="/profile?tab=settings"
            className={`group flex items-center gap-3 text-blue-100 hover:bg-white/10 hover:text-white hover:shadow-lg rounded-xl font-manrope font-semibold text-sm hover:-translate-y-0.5 backdrop-blur-sm relative ${
              isSidebarOpen 
                ? 'px-4 py-3' 
                : 'lg:justify-center lg:px-3 lg:py-3 lg:mx-auto lg:w-14'
            }`}
            title={!isSidebarOpen ? 'Pengaturan' : ''}
          >
            <span className={`material-symbols-outlined group-hover:scale-110 ${
              !isSidebarOpen ? 'lg:text-2xl' : ''
            }`}>
              settings
            </span>
            <span className={`whitespace-nowrap ${
              isSidebarOpen ? 'block' : 'hidden'
            }`}>
              Pengaturan
            </span>
            
            {/* Tooltip for collapsed state */}
            {!isSidebarOpen && (
              <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Pengaturan
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            )}
          </Link>
          <Link
            href="/profile?tab=help"
            className={`group flex items-center gap-3 text-blue-100 hover:bg-white/10 hover:text-white hover:shadow-lg rounded-xl font-manrope font-semibold text-sm hover:-translate-y-0.5 backdrop-blur-sm relative ${
              isSidebarOpen 
                ? 'px-4 py-3' 
                : 'lg:justify-center lg:px-3 lg:py-3 lg:mx-auto lg:w-14'
            }`}
            title={!isSidebarOpen ? 'Bantuan' : ''}
          >
            <span className={`material-symbols-outlined group-hover:scale-110 ${
              !isSidebarOpen ? 'lg:text-2xl' : ''
            }`}>
              help
            </span>
            <span className={`whitespace-nowrap ${
              isSidebarOpen ? 'block' : 'hidden'
            }`}>
              Bantuan
            </span>
            
            {/* Tooltip for collapsed state */}
            {!isSidebarOpen && (
              <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                Bantuan
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
