"use client";

import { useEffect, useRef } from "react";

export function useActivityLogger(input: {
  type: string;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const hasLogged = useRef(false);

  useEffect(() => {
    if (hasLogged.current) return;

    hasLogged.current = true;

    async function logActivity() {
      try {
        await fetch("/api/profile/activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: input.type,
            action: input.action,
            description: input.description || "",
            metadata: input.metadata || {},
          }),
        });
      } catch (error) {
        console.error("Failed to log page activity:", error);
      }
    }

    logActivity();
  }, [
    input.type,
    input.action,
    input.description,
    JSON.stringify(input.metadata || {}),
  ]);
}
