"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/useT";

export interface AiChatAction {
  label: string;
  href: string;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  text: string;
  source?: "ai" | "template";
  actions?: AiChatAction[];
}

interface AiChatBoxProps {
  intersectionId?: string;
  startDate?: string;
  endDate?: string;
  heightClass?: string;
  showQuickNav?: boolean;
}

const QUICK_NAV: { labelKey: string; href: string }[] = [
  { labelKey: "ai.widget.navDashboard", href: "/dashboard" },
  { labelKey: "ai.widget.navAnalytics", href: "/Analist" },
  { labelKey: "ai.widget.navIntersections", href: "/persimpangan" },
  { labelKey: "ai.widget.navIot", href: "/iot-config" },
  { labelKey: "ai.widget.navGuide", href: "/panduan" },
];

export default function AiChatBox({
  intersectionId,
  startDate,
  endDate,
  heightClass = "h-80",
  showQuickNav = true,
}: AiChatBoxProps) {
  const t = useT();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || thinking) return;

    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setThinking(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          intersectionId: intersectionId || null,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: json.data.answer,
          source: json.data.source,
          actions: json.data.actions,
        },
      ]);
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: err?.message || t("ai.chat.error"),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = [
    t("ai.chat.suggestCongested"),
    t("ai.chat.suggestPeak"),
    t("ai.chat.suggestTutorial"),
    t("ai.chat.suggestRecommend"),
  ];

  return (
    <div className={`flex ${heightClass} flex-col`}>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-4xl text-blue-300">
              smart_toy
            </span>
            <p className="text-sm text-slate-500">{t("ai.chat.welcome")}</p>

            {showQuickNav && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {QUICK_NAV.map((nav) => (
                  <Link
                    key={nav.href}
                    href={nav.href}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      arrow_forward
                    </span>
                    {t(nav.labelKey)}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-600 hover:bg-blue-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === "user"
                  ? "rounded-br-sm bg-blue-600 text-white"
                  : "rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              <p className="whitespace-pre-line">{message.text}</p>
              {message.source && (
                <p className="mt-1 text-[10px] opacity-60">
                  {message.source === "ai" ? "AI" : "Template"}
                </p>
              )}
            </div>

            {message.actions && message.actions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {message.actions.map((action) => (
                  <Link
                    key={`${action.label}-${action.href}`}
                    href={action.href}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      arrow_forward
                    </span>
                    {action.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              <span className="material-symbols-outlined animate-spin text-sm align-middle">
                progress_activity
              </span>{" "}
              {t("ai.chat.thinking")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
          placeholder={t("ai.chat.placeholder")}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={thinking || !input.trim()}
          className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </div>
  );
}