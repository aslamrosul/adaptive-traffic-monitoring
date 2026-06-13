"use client";

import DashboardLayout from "@/components/DashboardLayout";
import NotificationList from "@/components/NotificationList";
import { useT } from "@/lib/useT";

export default function NotifikasiPage() {
  const t = useT();
  
  return (
    <DashboardLayout title={t('navigation.notifications')}>
      <div className="p-3 lg:p-6 max-w-[1920px] mx-auto">
        <NotificationList />
      </div>
    </DashboardLayout>
  );
}
