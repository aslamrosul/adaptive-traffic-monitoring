"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Brand */}
        <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>
            traffic
          </span>
          Aerial Command
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#beranda" className="text-blue-600 border-b-2 border-blue-600 pb-1 hover:text-blue-600 transition-colors duration-200">
            Beranda
          </a>
          <a href="#fitur" className="text-slate-600 hover:text-blue-500 transition-colors duration-200">
            Fitur
          </a>
          <a href="#tentang-kami" className="text-slate-600 hover:text-blue-500 transition-colors duration-200">
            Tentang Kami
          </a>
          <a href="#tim-kami" className="text-slate-600 hover:text-blue-500 transition-colors duration-200">
            Tim Kami
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-semibold px-5 py-2.5 rounded-lg border border-blue-600 hover:bg-blue-50 transition-all"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Daftar
          </Link>
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
            <div className="px-6 py-4 space-y-3">
              <a href="#beranda" className="block text-slate-900 font-medium py-2">
                Beranda
              </a>
              <a href="#fitur" className="block text-slate-600 py-2">
                Fitur
              </a>
              <a href="#tentang-kami" className="block text-slate-600 py-2">
                Tentang Kami
              </a>
              <a href="#tim-kami" className="block text-slate-600 py-2">
                Tim Kami
              </a>
              <div className="pt-4 space-y-2">
                <Link
                  href="/login"
                  className="block text-center text-blue-600 border border-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-blue-600 text-white text-center px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
