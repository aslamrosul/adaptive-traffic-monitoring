"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MarkdownText from "@/components/MarkdownText";
import { useLocale, useT } from "@/lib/useT";

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
  const locale = useLocale();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const sendRef = useRef<(text?: string) => Promise<void>>(async () => {});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const speechLanguage = locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "id-ID";

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggleMic = () => {
    if (listening) {
      stopListening();
      return;
    }

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicSupported(false);
      return;
    }

    try {
      const recognition = new SR();
      recognition.lang = speechLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      let finalText = "";
      let interim = "";

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        setInput((current) => {
          const base = finalText || current;
          return (interim ? base + interim : base).trim();
        });
      };

      recognition.onerror = (event: any) => {
        setListening(false);
        recognitionRef.current = null;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setInput((current) => current + t("ai.chat.micDenied"));
        }
      };

      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
        const final = finalText.trim();
        if (final) {
          setInput("");
          void sendRef.current(final);
        }
      };

      recognition.start();
      setListening(true);
    } catch {
      setMicSupported(false);
      setListening(false);
    }
  };

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
  sendRef.current = send;

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
                {message.role === "assistant" ? (
                  <MarkdownText text={message.text} />
                ) : (
                  <p className="whitespace-pre-line">{message.text}</p>
                )}
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
        {micSupported && (
          <button
            type="button"
            onClick={toggleMic}
            title={t("ai.chat.mic")}
            aria-label={t("ai.chat.mic")}
            className={`relative shrink-0 rounded-xl p-2 transition-colors ${
              listening
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {listening ? "mic" : "mic_none"}
            </span>
            {listening && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
          </button>
        )}

        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
          placeholder={
            listening
              ? t("ai.chat.listening")
              : t("ai.chat.placeholder")
          }
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