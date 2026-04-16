"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { isDemoSessionActive } from "@/lib/auth";

function subscribeNothing() {
  return () => {};
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  const authed = mounted && isDemoSessionActive();

  useEffect(() => {
    if (mounted && !authed) {
      router.replace("/login");
    }
  }, [mounted, authed, router]);

  if (!mounted || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Загрузка…
      </div>
    );
  }

  return <>{children}</>;
}
