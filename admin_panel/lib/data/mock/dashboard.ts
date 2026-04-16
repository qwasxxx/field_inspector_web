import type { DashboardSummary } from "@/types";
import { mockDefects } from "./defects";
import { mockTasks } from "./tasks";

function buildSummary(): DashboardSummary {
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = mockTasks.filter((t) => t.status === "in_progress").length;
  const issueTasks = mockTasks.filter((t) => t.status === "issue").length;
  const openDefects = mockDefects.filter(
    (d) => d.status === "open" || d.status === "review",
  ).length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    issueTasks,
    openDefects,
  };
}

export const mockDashboardSummary: DashboardSummary = buildSummary();
