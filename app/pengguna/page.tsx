"use client";

import DashboardLayout from "@/components/DashboardLayout";
import ModalTambahUser from "@/components/ModalTambahUser";
import ModalEditUser from "@/components/ModalEditUser";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useT } from "@/lib/useT";

export default function PenggunaPage() {
  const t = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
        toast.error(t('errors.loadData') || "Gagal memuat data pengguna");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t('errors.loadData') || "Gagal memuat data pengguna");
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
        toast.success(t('users.addSuccess'));
        fetchUsers(); // Refresh list
      } else {
        toast.error(result.error || t('users.addSuccess').replace('berhasil ditambahkan', 'gagal ditambahkan'));
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
      const response = await fetch(`/api/users/${updatedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedUser),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('users.editSuccess'));
        fetchUsers(); // Refresh list
      } else {
        toast.error(result.error || t('users.editSuccess').replace('berhasil diperbarui', 'gagal diperbarui'));
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Gagal memperbarui pengguna");
    }
  };

  const handleDelete = (userId: string) => {
    toast((toastObj) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">{t('users.deleteConfirm')}</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(toastObj.id);
              const loadingToast = toast.loading(t('common.delete') + '...');
              
              try {
                const response = await fetch(`/api/users/${userId}`, {
                  method: "DELETE",
                });

                const result = await response.json();
                toast.dismiss(loadingToast);

                if (result.success) {
                  toast.success(t('users.deleteSuccess'));
                  fetchUsers(); // Refresh list
                } else {
                  toast.error(result.error || t('users.deleteSuccess').replace('berhasil dihapus', 'gagal dihapus'));
                }
              } catch (error) {
                console.error("Error deleting user:", error);
                toast.dismiss(loadingToast);
                toast.error("Gagal menghapus pengguna");
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            {t('common.delete')}
          </button>
          <button
            onClick={() => toast.dismiss(toastObj.id)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    ), { 
      duration: 5000,
      position: 'top-center',  // Pindah ke tengah atas
      style: {
        minWidth: '300px'
      }
    });
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <>
      <DashboardLayout title="Sistem Pantauan Lalu Lintas">
        <div className="p-3 lg:p-6 max-w-[1920px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 mb-4 lg:mb-6"
          >
            <div>
              <h3 className="text-base lg:text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                {t('users.title')}
              </h3>
              <p className="text-slate-500 mt-0.5 text-xs lg:text-sm">
                {t('users.list')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm lg:text-base">
                  search
                </span>
                <input
                  className="w-full pl-8 lg:pl-9 pr-3 py-1.5 lg:py-2 bg-white border border-slate-200 rounded-lg text-xs lg:text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                  placeholder={t('users.searchPlaceholder') || "Cari pengguna..."}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-bold text-xs lg:text-sm shadow-lg shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm lg:text-base">person_add</span>
                <span>{t('users.add')}</span>
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 space-y-3 lg:space-y-4"
            >
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden divide-y divide-slate-100">
                  {isLoading ? (
                    <div className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-xs">{t('common.loading')}</p>
                      </div>
                    </div>
                  ) : currentUsers.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">person_off</span>
                      <p className="text-slate-500 text-xs">
                        {searchQuery ? t('users.noUsers') : t('users.noUsers')}
                      </p>
                    </div>
                  ) : (
                    currentUsers.map((user, idx) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.name
                            )}&background=0040a1&color=fff`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() =>
                                    window.open(
                                      `/profile/public/${user.id}`,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  }
                                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-blue-600 transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">person</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEdit(user)}
                                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(user.id)}
                                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-error transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </motion.button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  user.role === "admin"
                                    ? "bg-primary-fixed text-on-primary-fixed-variant"
                                    : "bg-secondary-container text-on-secondary-container"
                                }`}
                              >
                                {user.role === "admin" ? "ADMIN" : "OPERATOR"}
                              </span>
                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    user.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                                  }`}
                                ></div>
                                <span
                                  className={`text-[10px] font-medium ${
                                    user.status === "active" ? "text-slate-700" : "text-slate-400"
                                  }`}
                                >
                                  {user.status === "active" ? t('users.active') : t('users.inactive')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {t('users.name')}
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {t('users.role')}
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {t('users.status')}
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                          {t('common.edit')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-slate-500 text-xs">{t('common.loading')}</p>
                            </div>
                          </td>
                        </tr>
                      ) : currentUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-1">person_off</span>
                            <p className="text-slate-500 text-xs">
                              {searchQuery ? t('users.noUsers') : t('users.noUsers')}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        currentUsers.map((user, idx) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user.name
                                )}&background=0040a1&color=fff`}
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-none">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                user.role === "admin"
                                  ? "bg-primary-fixed text-on-primary-fixed-variant"
                                  : "bg-secondary-container text-on-secondary-container"
                              }`}
                            >
                              {user.role === "admin" ? t('modals.centralAdmin').toUpperCase() : t('modals.fieldOperator').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  user.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                                }`}
                              ></div>
                              <span
                                className={`text-[10px] font-medium ${
                                  user.status === "active" ? "text-slate-700" : "text-slate-400"
                                }`}
                              >
                                {user.status === "active" ? t('users.active') : t('users.inactive')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  window.open(
                                    `/profile/public/${user.id}`,
                                    "_blank",
                                    "noopener,noreferrer",
                                  )
                                }
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-blue-600 transition-all"
                              >
                                <span className="material-symbols-outlined text-base">person</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(user)}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all"
                              >
                                <span className="material-symbols-outlined text-base">edit</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(user.id)}
                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-error transition-all"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
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

              {/* Pagination */}
              {!isLoading && filteredUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-surface-container-lowest rounded-xl shadow-sm p-3 lg:p-4"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 text-center sm:text-left">
                      {t('common.show')} <span className="font-semibold text-slate-700">{startIndex + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(endIndex, filteredUsers.length)}</span> {t('common.of') || 'dari'} <span className="font-semibold text-slate-700">{filteredUsers.length}</span> {t('users.title').toLowerCase()}
                    </p>
                    
                    <div className="flex items-center gap-1 lg:gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 lg:p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined text-base lg:text-lg text-slate-600">first_page</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 lg:p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined text-base lg:text-lg text-slate-600">chevron_left</span>
                      </motion.button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, idx, arr) => {
                            // Add ellipsis
                            const prevPage = arr[idx - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;
                            
                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsis && (
                                  <span className="px-1 text-slate-400 text-xs">...</span>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                                    currentPage === page
                                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                      : "hover:bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {page}
                                </motion.button>
                              </div>
                            );
                          })}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 lg:p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined text-base lg:text-lg text-slate-600">chevron_right</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 lg:p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined text-base lg:text-lg text-slate-600">last_page</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3 lg:space-y-6"
            >
              <div className="bg-surface-container-lowest p-3 lg:p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <h4 className="text-xs lg:text-sm font-bold text-slate-900 mb-3 lg:mb-4">{t('users.role')}</h4>
                <div className="space-y-3 lg:space-y-4">
                  <div className="p-3 lg:p-4 bg-primary-fixed/30 rounded-xl">
                    <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
                      <span className="material-symbols-outlined text-primary text-base lg:text-lg">
                        verified_user
                      </span>
                      <span className="text-[10px] lg:text-xs font-extrabold text-on-primary-fixed-variant">
                        {t('modals.centralAdmin')}
                      </span>
                    </div>
                    <p className="text-[10px] lg:text-[11px] text-slate-600 leading-relaxed">
                      {t('users.admin')}
                    </p>
                  </div>
                  <div className="p-3 lg:p-4 bg-secondary-container/30 rounded-xl">
                    <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
                      <span className="material-symbols-outlined text-secondary text-base lg:text-lg">
                        monitor_heart
                      </span>
                      <span className="text-[10px] lg:text-xs font-extrabold text-on-secondary-container">
                        {t('modals.fieldOperator')}
                      </span>
                    </div>
                    <p className="text-[10px] lg:text-[11px] text-slate-600 leading-relaxed">
                      {t('users.operator')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-3 lg:p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <h4 className="text-xs lg:text-sm font-bold text-slate-900 mb-3 lg:mb-4">{t('dashboard.statistics')}</h4>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] lg:text-xs text-slate-500">{t('users.title')}</span>
                    <span className="text-base lg:text-lg font-bold text-slate-900">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] lg:text-xs text-slate-500">{t('users.active')}</span>
                    <span className="text-base lg:text-lg font-bold text-emerald-600">
                      {users.filter((u) => u.status === "active").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] lg:text-xs text-slate-500">{t('users.inactive')}</span>
                    <span className="text-base lg:text-lg font-bold text-slate-400">
                      {users.filter((u) => u.status !== "active").length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

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
