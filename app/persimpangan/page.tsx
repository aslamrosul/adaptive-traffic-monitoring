"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function PersimpanganPage() {
  const router = useRouter();
  const { intersections, isLoading, isError } = useIntersections();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Tidak Aktif';
      default:
        return status;
    }
  };

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-slate-50">
        <Header title="Daftar Persimpangan" />

        <div className="p-8 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Total Persimpangan
              </p>
              <p className="text-4xl font-headline font-extrabold text-primary mb-1">
                {isLoading ? '...' : intersections.length}
              </p>
              <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>Terdaftar di sistem</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Status Aktif
              </p>
              <p className="text-4xl font-headline font-extrabold text-green-600 mb-1">
                {isLoading ? '...' : intersections.filter((i: any) => i.status === 'active').length}
              </p>
              <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Beroperasi normal</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Maintenance
              </p>
              <p className="text-4xl font-headline font-extrabold text-orange-500 mb-1">
                {isLoading ? '...' : intersections.filter((i: any) => i.status === 'maintenance').length}
              </p>
              <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">build</span>
                <span>Dalam perbaikan</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Tidak Aktif
              </p>
              <p className="text-4xl font-headline font-extrabold text-red-500 mb-1">
                {isLoading ? '...' : intersections.filter((i: any) => i.status === 'inactive').length}
              </p>
              <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>Perlu perhatian</span>
              </div>
            </motion.div>
          </div>

          {/* Intersections Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-slate-900 text-lg">
                Semua Persimpangan
              </h3>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                <p className="text-red-700 font-bold">Gagal memuat data persimpangan</p>
                <p className="text-red-600 text-sm mt-1">Silakan coba lagi nanti</p>
              </div>
            ) : intersections.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                <span className="material-symbols-outlined text-slate-400 text-5xl mb-4">inbox</span>
                <p className="text-slate-600 font-bold">Belum ada persimpangan</p>
                <p className="text-slate-500 text-sm mt-1">Tambahkan persimpangan pertama Anda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {intersections.map((intersection: any, idx: number) => (
                  <motion.div
                    key={intersection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => router.push(`/persimpangan/${intersection.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                          {intersection.name}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {intersection.address}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(intersection.status)}`}>
                        {getStatusText(intersection.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Device ID</p>
                        <p className="text-sm font-bold text-slate-900">{intersection.deviceId || '-'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Jalur</p>
                        <p className="text-sm font-bold text-slate-900">{intersection.lanes?.count || 4}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-sm">update</span>
                        <span>Update: {new Date(intersection.updatedAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/persimpangan/${intersection.id}`);
                        }}
                        className="text-primary text-sm font-bold hover:underline flex items-center gap-1"
                      >
                        Detail
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
