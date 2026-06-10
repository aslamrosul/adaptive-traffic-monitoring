"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = String(params?.id || "");

  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchProfile() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/profile/public/${userId}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.error || "Gagal memuat profil publik",
          );
        }

        setProfile(result.data);
      } catch (error: any) {
        setError(error.message || "Gagal memuat profil");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <span className="material-symbols-outlined text-5xl text-slate-300">
            lock
          </span>

          <h1 className="mt-3 text-xl font-bold text-slate-900">
            Profil tidak tersedia
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-8 text-white">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
              <Image
                src={profile.avatar}
                alt={profile.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>

            <div>
              <h1 className="text-3xl font-black">
                {profile.name}
              </h1>

              <p className="mt-1 text-blue-100">
                {profile.position} · {profile.department}
              </p>

              {profile.email && (
                <p className="mt-2 text-sm text-blue-50">
                  {profile.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 lg:p-8">
          <section>
            <h2 className="text-lg font-bold text-slate-900">
              Tentang
            </h2>

            <p className="mt-2 text-slate-600">
              {profile.bio || "Belum ada bio."}
            </p>
          </section>

          {profile.showActivity && (
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                Aktivitas Publik
              </h2>

              <div className="mt-3 space-y-3">
                {profile.activities?.length > 0 ? (
                  profile.activities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.color}`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {activity.icon}
                        </span>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {activity.action}
                        </p>

                        {activity.description && (
                          <p className="text-sm text-slate-500">
                            {activity.description}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Belum ada aktivitas publik.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
