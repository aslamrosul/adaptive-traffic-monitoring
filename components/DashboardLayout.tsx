"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  title: string;
  dateRange?: string;
  children: React.ReactNode;
}

export default function DashboardLayout({ title, dateRange, children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed by default
  
  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setIsSidebarOpen(savedState === 'true');
    } else {
      // Default: open on desktop, closed on mobile
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);
  
  // Save sidebar state to localStorage whenever it changes
  const handleToggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    localStorage.setItem('sidebarOpen', String(open));
  };

  return (
    <div className="flex min-h-screen bg-surface overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          title={title} 
          dateRange={dateRange}
          onToggleSidebar={() => handleToggleSidebar(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        
        <main className={`flex-1 transition-all duration-300 ease-in-out lg:pt-16 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}>
          <div className="transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
