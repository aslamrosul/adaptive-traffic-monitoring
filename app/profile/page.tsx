"use client";

import DashboardLayout from "@/components/DashboardLayout";
import ProfileContent from "@/components/ProfileContentNew";
import SettingsTabs from "@/components/SettingsTabs";
import HelpContent from "@/components/HelpContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/useT";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const t = useT();
  const tab = searchParams.get("tab");

  const title = tab === "settings" ? t('navigation.settings') : 
                tab === "help" ? t('navigation.help') : 
                t('profile.myProfile');

  return (
    <DashboardLayout title={title}>
      <div className="p-3 lg:p-6 max-w-[1920px] mx-auto">
        {tab === "settings" ? (
          <SettingsTabs />
        ) : tab === "help" ? (
          <HelpContent />
        ) : (
          <ProfileContent />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
