"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProfileContent from "@/components/ProfileContentNew";
import SettingsTabs from "@/components/SettingsTabs";
import HelpContent from "@/components/HelpContent";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="ml-64 flex-1 min-h-screen">
        <Header title={
          tab === "settings" ? "Pengaturan" : 
          tab === "help" ? "Bantuan" : 
          "Profil Saya"
        } />
        
        <div className="p-8 max-w-7xl mx-auto">
          {tab === "settings" ? (
            <SettingsTabs />
          ) : tab === "help" ? (
            <HelpContent />
          ) : (
            <ProfileContent />
          )}
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
