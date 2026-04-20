"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Gagal menghubungkan ke Google. Pastikan Google OAuth sudah dikonfigurasi dengan benar.",
    OAuthCallback: "Google OAuth callback error. Periksa redirect URI di Google Console.",
    OAuthCreateAccount: "Gagal membuat akun dengan Google.",
    EmailSignInError: "Email atau password salah.",
    CredentialsSignin: "Email atau password salah.",
    default: "Terjadi kesalahan saat login. Silakan coba lagi.",
  };

  const message = errorMessages[error || "default"] || errorMessages.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-container flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <span className="material-symbols-outlined text-6xl text-red-500">
              error
            </span>
          </div>

          <h1 className="text-2xl font-bold font-headline text-slate-900 mb-4">
            Oops! Ada Kesalahan
          </h1>

          <p className="text-slate-600 mb-6">
            {message}
          </p>

          {error && (
            <div className="bg-slate-100 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-slate-500 font-mono">
                Error Code: <span className="text-red-600 font-bold">{error}</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:brightness-110 transition-all"
            >
              Kembali ke Login
            </Link>
            <Link
              href="/register"
              className="block w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Daftar Akun Baru
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Jika masalah berlanjut, gunakan <strong>manual login</strong> dengan email dan password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
