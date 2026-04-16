import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
