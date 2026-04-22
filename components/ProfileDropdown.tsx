"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    toast.loading("Logging out...");
    await signOut({ callbackUrl: "/" });
    toast.dismiss();
    toast.success("Berhasil keluar dari sistem");
  };

  const menuItems = [
    {
      icon: "home",
      label: "Beranda",
      action: () => {
        router.push("/");
        setIsOpen(false);
      },
    },
    {
      icon: "person",
      label: "Profil Saya",
      action: () => {
        router.push("/profile");
        setIsOpen(false);
      },
    },
    {
      icon: "settings",
      label: "Pengaturan",
      action: () => {
        router.push("/profile?tab=settings");
        setIsOpen(false);
      },
    },
    {
      icon: "help",
      label: "Bantuan",
      action: () => {
        router.push("/profile?tab=help");
        setIsOpen(false);
      },
    },
    {
      icon: "logout",
      label: "Keluar",
      action: handleLogout,
      danger: true,
    },
  ];

  const displayName = session?.user?.name || "User";
  const displayEmail = session?.user?.email || "user@example.com";
  const displayAvatar = (session?.user as any)?.avatar || session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0040a1&color=fff`;
  const displayRole = (session?.user as any)?.role || "operator";
  const displayId = (session?.user as any)?.id ? `#${(session?.user as any).id.split("-")[1]?.toUpperCase() || "USER"}` : "#USER";

  return (
    <div ref={dropdownRef} className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
            {displayName}
          </p>
          <p className="text-[10px] text-slate-500 capitalize">{displayRole}</p>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm relative">
          <Image
            alt="Profil Pengguna"
            src={displayAvatar}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            {/* Profile Header */}
            <div className="p-4 bg-gradient-to-br from-primary to-primary-container text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white relative">
                  <Image
                    alt="Profil"
                    src={displayAvatar}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{displayName}</p>
                  <p className="text-xs text-primary-fixed/80 truncate">{displayEmail}</p>
                  <p className="text-[10px] text-primary-fixed/60 mt-0.5">{displayId}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                    item.danger ? "text-red-600" : "text-slate-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <p className="text-[10px] text-slate-400 text-center">
                Aerial Command v2.4.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
