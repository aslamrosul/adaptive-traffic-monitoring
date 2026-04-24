"use client";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import NotificationList from "@/components/NotificationList";
import { useState } from "react";

export default function NotifikasiPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />
      
      <main className="lg:ml-64 flex-1 min-h-screen">
        <Header 
          title="Notifikasi"
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <NotificationList />
        </div>
      </main>
    </div>
  );
}
