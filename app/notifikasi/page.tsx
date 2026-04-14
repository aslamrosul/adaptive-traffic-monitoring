import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import NotificationList from "@/components/NotificationList";

export default function NotifikasiPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="ml-64 flex-1 min-h-screen">
        <Header title="Notifikasi" />
        
        <div className="p-8 max-w-4xl mx-auto">
          <NotificationList />
        </div>
      </main>
    </div>
  );
}
