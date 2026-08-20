"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AiChatBox from "@/components/AiChatBox";
import { useT } from "@/lib/useT";

const HIDDEN_PATHS = ["/login", "/register", "/auth-error"];

export default function AiChatWidget() {
  const t = useT();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const firstOpenRef = useRef(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const hidden =
    status !== "authenticated" ||
    HIDDEN_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));

  if (hidden) {
    return null;
  }

  const handleOpen = () => {
    if (!firstOpenRef.current) {
      firstOpenRef.current = true;
      setUnread(false);
    }
    setOpen((current) => !current);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 left-4 z-[70] flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white">
                smart_toy
              </span>
              <div>
                <p className="text-sm font-bold text-white">
                  {t("ai.widget.title")}
                </p>
                <p className="text-[11px] text-white/80">
                  {t("ai.widget.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white hover:bg-white/20"
                aria-label={t("ai.widget.close")}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-3">
            <AiChatBox heightClass="h-full" />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("ai.widget.title")}
        className="fixed bottom-4 left-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-transform hover:scale-105 hover:bg-blue-700"
      >
        <span className="material-symbols-outlined text-2xl">
          {open ? "close" : "smart_toy"}
        </span>
        {!open && !firstOpenRef.current && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
        )}
      </button>
    </>
  );
}