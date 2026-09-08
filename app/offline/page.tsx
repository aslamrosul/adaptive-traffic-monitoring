"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center">
      <span className="material-symbols-outlined text-5xl text-slate-400">
        wifi_off
      </span>
      <h1 className="text-xl font-extrabold text-slate-800">
        ASTRAEA sedang offline
      </h1>
      <p className="max-w-sm text-sm text-slate-500">
        Koneksi internet diperlukan untuk data lalu lintas real-time, kamera,
        dan kontrol sistem.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700"
      >
        Coba Lagi
      </button>
    </main>
  );
}
