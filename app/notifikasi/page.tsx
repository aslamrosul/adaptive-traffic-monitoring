"use client";

import DashboardLayout from "@/components/DashboardLayout";
import NotificationList from "@/components/NotificationList";

export default function NotifikasiPage() {
  return (
    <DashboardLayout title="Notifikasi">
      <div className="p-3 lg:p-6 max-w-[1920px] mx-auto">
        <NotificationList />
      </div>
    </DashboardLayout>
  );
}
