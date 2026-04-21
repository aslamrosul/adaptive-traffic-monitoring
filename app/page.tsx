"use client";

import LandingFooter from "@/components/LandingFooter";
import LandingNav from "@/components/LandingNav";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 antialiased">
      <LandingNav />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden" id="beranda">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50 -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  Smart City Ready
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                  Revolusi Manajemen{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Lalu Lintas
                  </span>{" "}
                  Kota Anda
                </h1>

                <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                  Aerial Command memanfaatkan kekuatan IoT dan AI untuk mengoptimalkan durasi lampu lalu lintas secara otomatis berdasarkan kepadatan kendaraan aktual, mengurangi kemacetan hingga 40%.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="#tentang-kami"
                    className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5"
                  >
                    Pelajari Lebih Lanjut
                    <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                  </Link>
                  <a
                    href="#tim-kami"
                    className="inline-flex justify-center items-center px-8 py-4 text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                  >
                    Lihat Tim Kami
                  </a>
                </div>
              </motion.div>

              {/* Right Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur-2xl opacity-20 z-0"></div>
                <img
                  alt="Smart city intersection"
                  className="relative z-10 w-full h-[500px] object-cover rounded-2xl shadow-2xl border border-white/20"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQUIbvVoAv8N3k25XgwSIhgwZ-6snr_S1tm-HgQqJTsdQ56aMWtsLHoKdC9ghy7z9OpFmDQOouj4Lxd1iWd-_--txSkZlTQS0nEagCgb5pXbQGY2XJEba85jaa9R_w1VLbuWXBk9zT0jfzS4kYmee_bBxvv2twO4VCjyVYG03OhZcGDLfJMeJVDfWcy6-jop0O90UYZh-uSF7wnZtyTfCajAAwUcJhprjohG04tpFnqBrOzavAfambcwPRv0Q38eR5IOGROES0bvQ"
                />
                
                {/* Floating Data Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl z-20 border border-slate-100 flex items-center gap-4"
                >
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined">trending_down</span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Pengurangan Antrean</p>
                    <p className="text-xl font-bold text-slate-900">-42%</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white relative" id="fitur">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Kecerdasan Buatan untuk Mobilitas Lebih Baik
              </h2>
              <p className="text-lg text-slate-600">
                Fitur komprehensif kami dirancang untuk menangani kompleksitas lalu lintas perkotaan modern dengan presisi tinggi.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    multiline_chart
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Monitoring Real-time</h3>
                <p className="text-slate-600 leading-relaxed">
                  Pantau 4 simpangan atau lebih secara langsung melalui dashboard terpusat. Visibilitas penuh atas kondisi jalan raya setiap detik.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    psychology
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Adaptif AI</h3>
                <p className="text-slate-600 leading-relaxed">
                  Penyesuaian waktu lampu hijau otomatis. AI menganalisis jumlah kendaraan dan memprioritaskan jalur yang padat secara dinamis.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    query_stats
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Analitik Cerdas</h3>
                <p className="text-slate-600 leading-relaxed">
                  Laporan data mendalam. Pola lalu lintas historis untuk membantu pengambil keputusan dalam perencanaan kota jangka panjang.
                </p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="h-14 w-14 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    health_and_safety
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Fail-safe Mode</h3>
                <p className="text-slate-600 leading-relaxed">
                  Keamanan terjamin. Sistem secara otomatis kembali ke pengaturan waktu default yang aman jika sensor IoT mengalami gangguan koneksi.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tentang Kami Section */}
        <section className="py-24 bg-white" id="tentang-kami">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-2 lg:order-1"
              >
                <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-3">
                  Tentang Kami
                </h2>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                  Misi Kami Merevolusi Mobilitas Perkotaan
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed mb-6">
                  Aerial Command adalah sistem manajemen lalu lintas cerdas yang mengintegrasikan kecerdasan buatan dengan armada drone otonom. Kami percaya bahwa teknologi dapat menyelesaikan tantangan transportasi modern yang semakin kompleks.
                </p>
                <p className="text-slate-600 text-lg leading-relaxed">
                  Platform kami dirancang untuk membantu pemerintah kota dan otoritas transportasi dalam memantau, menganalisis, dan mengoptimalkan arus lalu lintas secara real-time, menciptakan jalan raya yang lebih aman dan efisien bagi semua orang.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-1 lg:order-2 bg-slate-100 rounded-3xl p-8 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-blue-600 text-[120px]">
                  hub
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tim Kami Section */}
        <section className="py-24 bg-slate-50" id="tim-kami">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-3">
                Tim Kami
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Para Inovator di Balik Aerial Command
              </h3>
              <p className="text-slate-600 text-lg">
                Dedikasi kami untuk menciptakan solusi teknologi yang berdampak nyata bagi masyarakat.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Member 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center rounded-full p-2">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      AP
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg z-20">
                    <span className="material-symbols-outlined text-blue-600 text-xl">verified</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900">Aditya Pratama</h4>
                <p className="text-blue-600 font-medium text-sm mb-1">Lead Developer</p>
                <p className="text-slate-500 text-xs">NIM: 2101234567</p>
              </motion.div>

              {/* Member 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center rounded-full p-2">
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      SN
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900">Siti Nurhaliza</h4>
                <p className="text-blue-600 font-medium text-sm mb-1">AI Specialist</p>
                <p className="text-slate-500 text-xs">NIM: 2101234568</p>
              </motion.div>

              {/* Member 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center rounded-full p-2">
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      BS
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900">Budi Santoso</h4>
                <p className="text-blue-600 font-medium text-sm mb-1">UI/UX Designer</p>
                <p className="text-slate-500 text-xs">NIM: 2101234569</p>
              </motion.div>

              {/* Member 4 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center group"
              >
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center rounded-full p-2">
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      DA
                    </div>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900">Dewi Anggraini</h4>
                <p className="text-blue-600 font-medium text-sm mb-1">System Analyst</p>
                <p className="text-slate-500 text-xs">NIM: 2101234570</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
