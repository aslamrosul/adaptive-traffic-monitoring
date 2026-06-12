"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("beranda");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const sections = ["beranda", "fitur", "tentang-kami", "tim-kami"];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-50% 0px -50% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    toast.loading("Logging out...");
    await signOut({ callbackUrl: "/" });
    toast.dismiss();
    toast.success("Berhasil keluar dari sistem");
  };

  const displayName = session?.user?.name || "User";
  const displayEmail = session?.user?.email || "user@example.com";
  const displayAvatar = (session?.user as any)?.avatar || session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0040a1&color=fff`;
  const displayRole = (session?.user as any)?.role || "operator";
  const displayId = (session?.user as any)?.id ? `#${(session?.user as any).id.split("-")[1]?.toUpperCase() || "USER"}` : "#USER";

  const profileMenuItems = [
    {
      icon: "home",
      label: "Beranda",
      action: () => {
        router.push("/");
        setIsProfileOpen(false);
      },
    },
    {
      icon: "person",
      label: "Profil Saya",
      action: () => {
        router.push("/profile");
        setIsProfileOpen(false);
      },
    },
    {
      icon: "settings",
      label: "Pengaturan",
      action: () => {
        router.push("/profile?tab=settings");
        setIsProfileOpen(false);
      },
    },
    {
      icon: "help",
      label: "Bantuan",
      action: () => {
        router.push("/profile?tab=help");
        setIsProfileOpen(false);
      },
    },
    {
      icon: "logout",
      label: "Keluar",
      action: handleLogout,
      danger: true,
    },
  ];

  const isActive = (section: string) => activeSection === section;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="flex justify-between items-center h-14 md:h-16 px-4 md:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <Link href="/" className="text-sm md:text-lg lg:text-2xl font-bold tracking-tighter text-slate-900 flex items-center gap-1 md:gap-2 flex-shrink-0">
          <Image src="/logo.png" alt="ASTRAEA" width={28} height={28} className="flex-shrink-0 md:w-9 md:h-9" />
          <span>ASTRAEA</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          <a 
            href="#beranda" 
            className={`pb-1 text-sm lg:text-base transition-colors duration-200 ${
              isActive("beranda") 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-slate-600 hover:text-blue-500"
            }`}
          >
            Beranda
          </a>
          <a 
            href="#fitur" 
            className={`pb-1 text-sm lg:text-base transition-colors duration-200 ${
              isActive("fitur") 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-slate-600 hover:text-blue-500"
            }`}
          >
            Fitur
          </a>
          <a 
            href="#tentang-kami" 
            className={`pb-1 text-sm lg:text-base transition-colors duration-200 ${
              isActive("tentang-kami") 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-slate-600 hover:text-blue-500"
            }`}
          >
            Tentang Kami
          </a>
          <a 
            href="#tim-kami" 
            className={`pb-1 text-sm lg:text-base transition-colors duration-200 ${
              isActive("tim-kami") 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-slate-600 hover:text-blue-500"
            }`}
          >
            Tim Kami
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          {status === "loading" ? (
            <div className="w-16 lg:w-20 h-8 lg:h-10 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg font-semibold text-sm lg:text-base transition-all shadow-sm hover:shadow-md flex items-center gap-1 lg:gap-2"
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
              
              {/* Profile Dropdown */}
              <div ref={profileDropdownRef} className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                  title={session.user?.name || "Profile"}
                >
                  <div className="w-8 lg:w-9 h-8 lg:h-9 rounded-full overflow-hidden ring-2 ring-slate-200 relative">
                    <Image
                      alt="Profile"
                      src={displayAvatar}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 lg:w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                      {/* Profile Header */}
                      <div className="p-3 lg:p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-full overflow-hidden border-2 border-white relative flex-shrink-0">
                            <Image
                              alt="Profil"
                              src={displayAvatar}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs lg:text-sm truncate">{displayName}</p>
                            <p className="text-[10px] lg:text-xs text-blue-100 truncate">{displayEmail}</p>
                            <p className="text-[9px] lg:text-[10px] text-blue-200 mt-0.5">{displayId}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1 lg:py-2">
                        {profileMenuItems.map((item, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={item.action}
                            className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 hover:bg-slate-50 transition-colors text-sm lg:text-base ${
                              item.danger ? "text-red-600" : "text-slate-700"
                            }`}
                          >
                            <span className="material-symbols-outlined text-base lg:text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                          </motion.button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="p-2 lg:p-3 bg-slate-50 border-t border-slate-200">
                        <p className="text-[9px] lg:text-[10px] text-slate-400 text-center">
                          ASTRAEA v2.4.0
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg border border-blue-600 hover:bg-blue-50 transition-all text-sm lg:text-base"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md text-sm lg:text-base"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-600 p-2"
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-4 py-3 space-y-2">
              <a 
                href="#beranda" 
                className={`block py-1.5 text-sm ${
                  isActive("beranda") 
                    ? "text-blue-600 font-bold" 
                    : "text-slate-600"
                }`}
              >
                Beranda
              </a>
              <a 
                href="#fitur" 
                className={`block py-1.5 text-sm ${
                  isActive("fitur") 
                    ? "text-blue-600 font-bold" 
                    : "text-slate-600"
                }`}
              >
                Fitur
              </a>
              <a 
                href="#tentang-kami" 
                className={`block py-1.5 text-sm ${
                  isActive("tentang-kami") 
                    ? "text-blue-600 font-bold" 
                    : "text-slate-600"
                }`}
              >
                Tentang Kami
              </a>
              <a 
                href="#tim-kami" 
                className={`block py-1.5 text-sm ${
                  isActive("tim-kami") 
                    ? "text-blue-600 font-bold" 
                    : "text-slate-600"
                }`}
              >
                Tim Kami
              </a>
              <div className="pt-2 space-y-1.5">
                {status === "loading" ? (
                  <div className="w-full h-8 bg-slate-100 animate-pulse rounded-lg"></div>
                ) : session ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block bg-blue-600 text-white text-center px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm"
                    >
                      Dashboard
                    </Link>
                    
                    {/* Mobile Profile Menu */}
                    <div className="border-t border-slate-200 pt-2 mt-2">
                      <div className="px-2 py-1.5 bg-slate-50 rounded-lg mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 relative flex-shrink-0">
                            <Image
                              alt="Profil"
                              src={displayAvatar}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
                          </div>
                        </div>
                      </div>
                      
                      {profileMenuItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={item.action}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors text-sm ${
                            item.danger 
                              ? "text-red-600 hover:bg-red-50" 
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base flex-shrink-0">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-center text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block bg-blue-600 text-white text-center px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all text-sm"
                    >
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
