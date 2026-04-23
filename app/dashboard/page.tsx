import AlertsPanel from "@/components/AlertsPanel";
import DashboardStats from "@/components/DashboardStats";
import IntersectionGrid from "@/components/IntersectionGrid";
import TrafficTrendChart from "@/components/TrafficTrendChart";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout title="Sistem Pantauan Lalu Lintas">
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
    </DashboardLayout>
  );
}
