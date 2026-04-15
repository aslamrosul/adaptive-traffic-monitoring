import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ReportsContent from "@/components/ReportsContent";

export default function LaporanPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="ml-64 flex-1 min-h-screen">
        <Header title="Laporan & Analisis" />
        
        <div className="p-8 max-w-7xl mx-auto">
          <ReportsContent />
        </div>
      </main>
    </div>
  );
}
