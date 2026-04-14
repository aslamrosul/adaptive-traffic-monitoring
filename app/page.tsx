import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardStats from "@/components/DashboardStats";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import IntersectionGrid from "@/components/IntersectionGrid";
import AlertsPanel from "@/components/AlertsPanel";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="ml-64 flex-1 min-h-screen">
        <Header title="Sistem Pantauan Lalu Lintas" />
        
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
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
