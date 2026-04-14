import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProfileContent from "@/components/ProfileContent";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="ml-64 flex-1 min-h-screen">
        <Header title="Profil Saya" />
        
        <div className="p-8 max-w-7xl mx-auto">
          <ProfileContent />
        </div>
      </main>
    </div>
  );
}
