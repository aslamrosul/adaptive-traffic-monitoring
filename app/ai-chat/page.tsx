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
      <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50">
        {/* Top bar - slim, seperti header ChatGPT */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">
              smart_toy
            </span>
            <h1 className="truncate text-sm font-bold text-slate-900 lg:text-base">
              {t("ai.page.title")}
            </h1>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 sm:inline">
              gemini-3.1-flash-lite
            </span>
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
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-3 py-4 lg:px-4">
              <AiChatBox heightClass="h-full" showQuickNav chatgptStyle />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1280px] p-3 lg:p-6">
              <AiInsightsPanel />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}