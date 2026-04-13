"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#fff",
          color: "#191c1e",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        },
        success: {
          iconTheme: {
            primary: "#0040a1",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ba1a1a",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
