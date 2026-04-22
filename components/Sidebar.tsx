"use client";

import { useProfileStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
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

export default function Sidebar() {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, fetchProfile } = useProfileStore();

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
      {/* Mobile Header with Logo - Always Visible */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-[55] flex items-center px-4 gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined text-xl">
            {isSidebarOpen ? "close" : "menu"}
          </span>
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-blue-800 tracking-tighter font-headline">
            Aerial Command
          </h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <p className="text-[10px] text-slate-500 font-medium">IoT: Terhubung</p>
          </div>
        </div>
      </div>

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
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : -256,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="h-screen w-64 fixed left-0 top-0 bg-slate-50 border-r border-slate-200 flex flex-col p-4 z-50 lg:translate-x-0"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 px-2"
        >
          <h1 className="text-lg font-black text-blue-800 tracking-tighter font-headline">
            Aerial Command
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            ></motion.div>
            <p className="text-xs text-slate-500 font-medium">Status IoT: Terhubung</p>
          </div>
        </motion.div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item, idx) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-manrope font-semibold text-sm transition-all duration-300 ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-200/50"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 pt-4 border-t border-slate-200/60">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="w-full mb-4 py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-blue-900/10 transition-all"
          >
            Laporan Baru
          </motion.button>
          <Link
            href="/profile?tab=settings"
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/50 rounded-lg font-manrope font-semibold text-sm transition-all duration-300"
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Pengaturan</span>
          </Link>
          <Link
            href="/profile?tab=help"
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200/50 rounded-lg font-manrope font-semibold text-sm transition-all duration-300"
          >
            <span className="material-symbols-outlined">help</span>
            <span>Bantuan</span>
          </Link>
        </div>
      </motion.aside>

      <ModalLaporan isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
