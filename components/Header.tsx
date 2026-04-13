"use client";

import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";

export default function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 w-full h-16 glass-header px-8 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="font-headline font-extrabold text-xl tracking-tight text-slate-900">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors active:scale-95">
          <span className="material-symbols-outlined">sensors</span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <ProfileDropdown />
      </div>
    </header>
  );
}
