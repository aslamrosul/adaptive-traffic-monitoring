import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TeamGrid from "@/components/TeamGrid";
import TeamHero from "@/components/TeamHero";
import TeamFooter from "@/components/TeamFooter";

export default function TeamPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 flex-1 min-h-screen">
        <Header title="Tim Kami" />
        
        <div className="p-8 max-w-7xl mx-auto">
          <TeamHero />
          <TeamGrid />
          <TeamFooter />
        </div>
      </main>
    </div>
  );
}
