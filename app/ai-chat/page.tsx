"use client";

import { useState } from "react";
import AiChatBox from "@/components/AiChatBox";
import AiInsightsPanel from "@/components/AiInsightsPanel";
import DashboardLayout from "@/components/DashboardLayout";
import { useActivityLogger } from "@/lib/hooks/useActivityLogger";
import { useT } from "@/lib/useT";

type Mode = "chat" | "insight";

export default function AiChatPage() {
  const t = useT();
  const [mode, setMode] = useState<Mode>("chat");

  useActivityLogger({
    type: "ai_chat.view",
    action: "Membuka AI Chat",
    description: "Pengguna membuka halaman AI Chat",
  });

  return (
    <DashboardLayout title={t("ai.page.title") || "Asisten AI"}>
      <div className="flex h-[calc(100vh-4rem)] flex-col bg-gradient-to-tr from-[#f6f9fc] via-white to-[#f0f4f8]">
        {/* Top bar - slim, super clean elegant style ala Gemini */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-md px-4 py-3 lg:px-8 shadow-sm">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shadow shadow-indigo-100">
              <span className="material-symbols-outlined text-xl">
                auto_awesome
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-extrabold text-slate-800 lg:text-lg tracking-tight">
                  ASTRAEA AI
                </h1>
                <span className="hidden shrink-0 rounded-full bg-blue-50 border border-blue-100/50 px-2 py-0.5 text-[9px] font-bold text-blue-600 sm:inline tracking-wider uppercase">
                  Gemini Flash 3.1
                </span>
              </div>
              <p className="hidden text-[10px] font-medium text-slate-400 lg:block">
                Asisten kecerdasan buatan untuk optimasi lalu lintas real-time
              </p>
            </div>
          </div>

          {/* Luxury Switch Mode Button */}
          <div className="flex shrink-0 rounded-2xl bg-slate-100 p-1 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                mode === "chat"
                  ? "bg-white text-blue-600 shadow-sm shadow-blue-500/10 border border-slate-200/30"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-sm font-semibold">forum</span>
              Chat AI
            </button>
            <button
              type="button"
              onClick={() => setMode("insight")}
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                mode === "insight"
                  ? "bg-white text-blue-600 shadow-sm shadow-blue-500/10 border border-slate-200/30"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-sm font-semibold">
                insights
              </span>
              Insight AI
            </button>
          </div>
        </div>

        {/* Content area */}
        {mode === "chat" ? (
          <div className="flex-1 overflow-hidden flex flex-col justify-between">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-4 md:py-6">
              <AiChatBox heightClass="h-full" showQuickNav chatgptStyle />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1280px] p-4 lg:p-8">
              <AiInsightsPanel />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}