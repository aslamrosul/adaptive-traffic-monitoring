"use client";

import DashboardLayout from "@/components/DashboardLayout";
import ModalTambahPersimpangan from "@/components/ModalTambahPersimpangan";
import ModalEditPersimpangan from "@/components/ModalEditPersimpangan";
import { useIntersections } from "@/lib/hooks/useIntersections";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/useT";

export default function PersimpanganPage() {
  const router = useRouter();
  const t = useT();
  const { intersections, isLoading, isError, mutate } = useIntersections();
  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIntersection, setSelectedIntersection] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const INITIAL_DISPLAY_COUNT = isMobile ? 4 : 6;

  const filteredIntersections = intersections.filter((item: any) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      query === "" ||
      String(item.name || "").toLowerCase().includes(query) ||
      String(item.address || "").toLowerCase().includes(query) ||
      String(item.id || item.intersection_id || "")
        .toLowerCase()
        .includes(query) ||
      String(item.deviceId || item.device_id || "")
        .toLowerCase()
        .includes(query);

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const displayedIntersections = showAll
    ? intersections
    : intersections.slice(0, INITIAL_DISPLAY_COUNT);

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

  const handleEdit = (intersection: any) => {
    setSelectedIntersection(intersection);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/intersections/${deleteConfirm}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        mutate(); // Refresh data
        setDeleteConfirm(null);
        // Show success toast (you can add toast library)
        alert('Persimpangan berhasil dihapus');
      } else {
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (error: any) {
      console.error('Error deleting intersection:', error);
      alert('Gagal menghapus persimpangan: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout title="Daftar Persimpangan">
      <div className="p-3 lg:p-6 space-y-3 lg:space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg card-hover"
          >
            <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mb-1">
              Total Persimpangan
            </p>
            <p className="text-3xl font-headline font-extrabold text-white mb-0.5">
              {isLoading ? '...' : intersections.length}
            </p>
            <div className="flex items-center gap-1 text-blue-100 text-[10px] font-bold">
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span>Terdaftar di sistem</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg card-hover"
          >
            <p className="text-[9px] font-bold text-green-100 uppercase tracking-widest mb-1">
              Status Aktif
            </p>
            <p className="text-3xl font-headline font-extrabold text-white mb-0.5">
              {isLoading ? '...' : intersections.filter((i: any) => i.status === 'active').length}
            </p>
            <div className="flex items-center gap-1 text-green-100 text-[10px] font-bold">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>Beroperasi normal</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg card-hover"
          >
            <p className="text-[9px] font-bold text-orange-100 uppercase tracking-widest mb-1">
              Maintenance
            </p>
            <p className="text-3xl font-headline font-extrabold text-white mb-0.5">
              {isLoading ? '...' : intersections.filter((i: any) => i.status === 'maintenance').length}
            </p>
            <div className="flex items-center gap-1 text-orange-100 text-[10px] font-bold">
              <span className="material-symbols-outlined text-xs">build</span>
              <span>Dalam perbaikan</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-xl shadow-lg card-hover"
          >
            <p className="text-[9px] font-bold text-red-100 uppercase tracking-widest mb-1">
              Tidak Aktif
            </p>
            <p className="text-3xl font-headline font-extrabold text-white mb-0.5">
              {isLoading ? '...' : intersections.filter((i: any) => i.status === 'inactive').length}
            </p>
            <div className="flex items-center gap-1 text-red-100 text-[10px] font-bold">
              <span className="material-symbols-outlined text-xs">error</span>
              <span>Perlu perhatian</span>
            </div>
          </motion.div>
        </div>

        {/* Intersections Grid */}
        <div>
          <div className="mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama, alamat, intersection ID, atau device ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline font-bold text-slate-900 text-base lg:text-lg">
              Semua Persimpangan
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="group inline-flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-sm hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105"
            >
              <span className="material-symbols-outlined text-base group-hover:rotate-90 transition-transform duration-300">
                add_circle
              </span>
              <span className="hidden sm:inline">Tambah Persimpangan</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 lg:p-6 shadow-sm animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 lg:p-6 text-center">
              <span className="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
              <p className="text-red-700 font-bold">Gagal memuat data persimpangan</p>
              <p className="text-red-600 text-sm mt-1">Silakan coba lagi nanti</p>
            </div>
          ) : filteredIntersections.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 lg:p-12 text-center">
              <span className="material-symbols-outlined text-slate-400 text-5xl mb-4">inbox</span>
              <p className="text-slate-600 font-bold">Belum ada persimpangan</p>
              <p className="text-slate-500 text-sm mt-1">Tambahkan persimpangan pertama Anda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedIntersections.map((intersection: any, idx: number) => (
                  <motion.div
                    key={intersection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl p-4 lg:p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group border-2 border-transparent hover:border-blue-300 card-hover"
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(intersection);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(intersection.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
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
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Show More Button */}
              {intersections.length > INITIAL_DISPLAY_COUNT && !showAll && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  {/* Gradient Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

                  <button
                    onClick={() => {
                      setShowAll(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-600/40 transition-all duration-300 hover:scale-105 overflow-hidden"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Content */}
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl animate-bounce">visibility</span>
                      <span>Lihat Semua Persimpangan</span>
                    </span>

                    {/* Badge */}
                    <span className="relative z-10 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-extrabold flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">add</span>
                      {intersections.length - INITIAL_DISPLAY_COUNT} lagi
                    </span>

                    {/* Arrow Icon */}
                    <span className="relative z-10 material-symbols-outlined text-xl group-hover:translate-y-1 transition-transform duration-300">
                      expand_more
                    </span>
                  </button>

                  <p className="text-xs text-slate-500 font-medium">
                    Menampilkan {INITIAL_DISPLAY_COUNT} dari {intersections.length} persimpangan
                  </p>
                </motion.div>
              )}

              {/* Show Less Button */}
              {showAll && intersections.length > INITIAL_DISPLAY_COUNT && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  {/* Gradient Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

                  <button
                    onClick={() => {
                      setShowAll(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-primary hover:text-primary hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-xl group-hover:-translate-y-1 transition-transform duration-300">
                      expand_less
                    </span>
                    <span>Tampilkan Lebih Sedikit</span>
                    <span className="material-symbols-outlined text-xl">arrow_upward</span>
                  </button>

                  <p className="text-xs text-slate-500 font-medium">
                    Menampilkan semua {intersections.length} persimpangan
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Tambah Persimpangan */}
      <ModalTambahPersimpangan
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => mutate()}
      />

      {/* Modal Edit Persimpangan */}
      {selectedIntersection && (
        <ModalEditPersimpangan
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedIntersection(null);
          }}
          onSuccess={() => mutate()}
          intersection={selectedIntersection}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Hapus Persimpangan?</h3>
                <p className="text-sm text-slate-600">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-slate-700 mb-6">
              Apakah Anda yakin ingin menghapus persimpangan ini? Semua data terkait akan dihapus secara permanen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">delete</span>
                    Hapus
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
