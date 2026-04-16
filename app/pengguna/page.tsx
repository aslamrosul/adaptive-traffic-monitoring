"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ModalTambahUser from "@/components/ModalTambahUser";
import ModalEditUser from "@/components/ModalEditUser";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function PenggunaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users");
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      } else {
        toast.error("Gagal memuat data pengguna");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (newUser: any) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Pengguna berhasil ditambahkan");
        fetchUsers(); // Refresh list
      } else {
        toast.error(result.error || "Gagal menambahkan pengguna");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Gagal menambahkan pengguna");
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedUser: any) => {
    try {
      // In production, implement PUT endpoint
      // For now, update local state
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      toast.success("Pengguna berhasil diperbarui");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Gagal memperbarui pengguna");
    }
  };

  const handleDelete = (userId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">Hapus pengguna ini?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                // In production, implement DELETE endpoint
                // For now, just remove from local state
                setUsers(users.filter((u) => u.id !== userId));
                toast.dismiss(t.id);
                toast.success("Pengguna berhasil dihapus");
              } catch (error) {
                toast.error("Gagal menghapus pengguna");
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
          >
            Hapus
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
          >
            Batal
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <Header title="Sistem Pantauan Lalu Lintas" />

        <div className="p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
          >
            <div>
              <h3 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">
                Manajemen Pengguna
              </h3>
              <p className="text-slate-500 mt-1">
                Kelola hak akses, perbarui peran, dan pantau aktivitas operator sistem.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-64 placeholder:text-slate-400"
                  placeholder="Cari pengguna..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Tambah Pengguna
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 space-y-6"
            >
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Pengguna
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Jabatan / Role
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-slate-500 text-sm">Memuat data...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">person_off</span>
                            <p className="text-slate-500 text-sm">
                              {searchQuery ? "Tidak ada pengguna yang cocok" : "Belum ada pengguna"}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user.name
                                )}&background=0040a1&color=fff`}
                              />
                              <div>
                                <p className="text-sm font-bold text-slate-900 leading-none">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                user.role === "admin"
                                  ? "bg-primary-fixed text-on-primary-fixed-variant"
                                  : "bg-secondary-container text-on-secondary-container"
                              }`}
                            >
                              {user.role === "admin" ? "ADMIN PUSAT" : "OPERATOR LAPANGAN"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  user.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              ></div>
                              <span
                                className={`text-xs font-medium ${
                                  user.status === "active" ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {user.status === "active" ? "Aktif" : "Offline"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(user)}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(user.id)}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-error transition-all"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Informasi Peran</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-primary-fixed/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-primary text-lg">
                        verified_user
                      </span>
                      <span className="text-xs font-extrabold text-on-primary-fixed-variant">
                        Admin Pusat
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Akses penuh ke semua fitur, manajemen sistem, dan pengaturan API eksternal.
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-container/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-secondary text-lg">
                        monitor_heart
                      </span>
                      <span className="text-xs font-extrabold text-on-secondary-container">
                        Operator Lapangan
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Memantau arus lalu lintas secara real-time dan mengelola laporan insiden
                      lokal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Statistik</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total Pengguna</span>
                    <span className="text-lg font-bold text-slate-900">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Aktif</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {users.filter((u) => u.status === "active").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Offline</span>
                    <span className="text-lg font-bold text-slate-400">
                      {users.filter((u) => u.status !== "active").length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <ModalTambahUser
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddUser}
      />

      <ModalEditUser
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUpdate={handleUpdateUser}
        user={selectedUser}
      />
    </>
  );
}
