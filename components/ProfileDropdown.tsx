"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { useProfileStore } from "@/lib/store";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
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
        router.push("/pengaturan");
        setIsOpen(false);
      },
    },
    {
      icon: "help",
      label: "Bantuan",
      action: () => {
        router.push("/bantuan");
        setIsOpen(false);
      },
    },
    {
      icon: "logout",
      label: "Keluar",
      action: () => {
        toast.success("Berhasil keluar dari sistem");
        setIsOpen(false);
      },
      danger: true,
    },
  ];

  const displayName = profile?.name || "Admin Pusat";
  const displayEmail = profile?.email || "admin@traffic-command.go.id";
  const displayAvatar = profile?.avatar || "https://ui-avatars.com/api/?name=Admin+Pusat&background=0040a1&color=fff";
  const displayId = profile?.id ? `#${profile.id.split("-")[1].toUpperCase()}` : "#8829";

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
          <p className="text-[10px] text-slate-500">{displayId}</p>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm relative">
          <Image
            alt="Profil Pengguna"
            src={displayAvatar}
            fill
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
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm">{displayName}</p>
                  <p className="text-xs text-primary-fixed/80">{displayEmail}</p>
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
