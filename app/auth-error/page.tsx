"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Authentication Error
        </h1>
        <p className="text-slate-600 mb-6">
          {error || "An error occurred during authentication"}
        </p>
        <Link
          href="/login"
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-bold hover:brightness-110 transition-all"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
