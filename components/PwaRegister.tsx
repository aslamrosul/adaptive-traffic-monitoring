"use client";

import { useEffect } from "react";

// Registrasi service worker hanya di production; gagal diam-diam.
export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[pwa] registrasi service worker gagal");
        }
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
