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
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1280px] flex-col gap-3 p-3 lg:gap-4 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              ASTRAEA AI
            </p>
            <h1 className="truncate text-lg font-black text-slate-900 lg:text-2xl">
              {t("ai.page.title")}
            </h1>
          </div>

          <div className="flex shrink-0 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "chat"
                  ? "bg-white text-blue-600 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              {t("ai.page.chat")}
            </button>
            <button
              type="button"
              onClick={() => setMode("insight")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "insight"
                  ? "bg-white text-blue-600 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                query_stats
              </span>
              {t("ai.page.insight")}
            </button>
          </div>
        </div>

        {mode === "chat" ? (
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-center gap-2 border-b border-slate-100 px-4 py-3">
              <span className="material-symbols-outlined text-blue-600">
                smart_toy
              </span>
              <p className="text-sm font-bold text-slate-800">
                {t("ai.page.model")}
              </p>
            </div>
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-3 py-4 lg:px-4">
              <AiChatBox heightClass="h-full" showQuickNav />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-2xl">
            <AiInsightsPanel />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}