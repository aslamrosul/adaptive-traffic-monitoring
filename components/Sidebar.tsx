"use client";

import { useProfileStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ModalLaporan from "./ModalLaporan";

const menuItems = [
  { icon: "dashboard", label: "Dasbor", href: "/dashboard" },
  { icon: "traffic", label: "Persimpangan", href: "/persimpangan" },
  { icon: "analytics", label: "Analist", href: "/Analist" },
  { icon: "settings_remote", label: "Remote IoT", href: "/iot-config" },
  { icon: "group", label: "Manajemen Pengguna", href: "/pengguna" },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function Sidebar({ isOpen: externalIsOpen, onToggle }: SidebarProps = {}) {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
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
    setIsSidebarOpen(false);
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
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
        className={`h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-slate-200 flex flex-col p-4 z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-10 px-2">
          {/* Mobile: Toggle Button + Logo + Status in one row */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
              aria-label="Close Menu"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <Link href="/" className="flex-1 min-w-0 flex items-center gap-2">
              <div className="min-w-0">
                <h1 className="text-sm font-black text-blue-800 tracking-tighter font-headline truncate hover:text-blue-600 transition-colors cursor-pointer">
                  Aerial Command
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <p className="text-[10px] text-slate-500 font-medium">IoT: Terhubung</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop: Logo + Status (original layout) */}
          <div className="hidden lg:block">
            <Link href="/" className="flex items-start gap-2.5">
              <Image src="/logo.png" alt="Aerial Command" width={40} height={40} className=" flex-shrink-0" />
              <div className="flex flex-col">
                <h1 className="text-lg font-black text-blue-800 tracking-tighter font-headline hover:text-blue-600 transition-colors cursor-pointer">
                  Aerial Command
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  ></motion.div>
                  <p className="text-xs text-slate-500 font-medium">Status IoT: Terhubung</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg font-manrope font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white text-blue-700 shadow-md"
                      : "text-slate-600 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined transition-all duration-200 ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className="transition-transform duration-200">
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-slate-200/60">
          <button
            onClick={() => setShowModal(true)}
            className="w-full mb-4 py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-blue-900/10 transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Laporan Baru
            </span>
          </button>
          <Link
            href="/profile?tab=settings"
            className="group flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-lg font-manrope font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-200">
              settings
            </span>
            <span>Pengaturan</span>
          </Link>
          <Link
            href="/profile?tab=help"
            className="group flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-lg font-manrope font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform duration-200">
              help
            </span>
            <span>Bantuan</span>
          </Link>
        </div>
      </aside>

      <ModalLaporan isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
