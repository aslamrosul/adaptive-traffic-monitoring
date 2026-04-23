"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  title: string;
  dateRange?: string;
  children: React.ReactNode;
}

export default function DashboardLayout({ title, dateRange, children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} />
      
      <main className="lg:ml-64 flex-1 min-h-screen">
        <Header 
          title={title} 
          dateRange={dateRange}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        
        {children}
      </main>
    </div>
  );
}
