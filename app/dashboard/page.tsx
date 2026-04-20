import AlertsPanel from "@/components/AlertsPanel";
import DashboardStats from "@/components/DashboardStats";
import Header from "@/components/Header";
import IntersectionGrid from "@/components/IntersectionGrid";
import Sidebar from "@/components/Sidebar";
import TrafficTrendChart from "@/components/TrafficTrendChart";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 flex-1 min-h-screen">
        <Header title="Sistem Pantauan Lalu Lintas" />
        
        <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          <DashboardStats />
          
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <TrafficTrendChart />
              <IntersectionGrid />
            </div>
            
            <div className="lg:col-span-4">
              <AlertsPanel />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
