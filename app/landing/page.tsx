"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-6xl font-black text-blue-800 tracking-tighter font-headline mb-4">
              Aerial Command
            </h1>
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-3 h-3 rounded-full bg-emerald-500"
              ></motion.div>
              <p className="text-slate-600 text-lg font-medium">
                Sistem Pantauan Lalu Lintas Adaptif
              </p>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-600 mb-12 leading-relaxed"
          >
            Platform monitoring dan kontrol lalu lintas berbasis IoT dengan
            analitik real-time dan AI untuk mengoptimalkan arus kendaraan di
            persimpangan.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/login"
              className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              Masuk ke Dashboard
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
            >
              Daftar Sekarang
            </Link>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto"
        >
          {[
            {
              icon: "sensors",
              title: "IoT Real-time",
              description:
                "Monitoring lalu lintas secara real-time dengan sensor IoT terintegrasi",
            },
            {
              icon: "analytics",
              title: "AI Analytics",
              description:
                "Analitik cerdas dengan AI untuk prediksi dan optimasi arus lalu lintas",
            },
            {
              icon: "cloud_done",
              title: "Cloud Integration",
              description:
                "Terintegrasi dengan Azure Cloud untuk skalabilitas dan keandalan tinggi",
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + idx * 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
