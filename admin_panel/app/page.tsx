"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isDemoSessionActive } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isDemoSessionActive()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
      Перенаправление…
    </div>
  );
}
