/** Domain types — identifiers in English; UI copy is Russian in components/mock. */

export type UserRole = "supervisor" | "inspector" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type TaskStatus = "completed" | "in_progress" | "pending" | "issue";

export type SyncStatus = "synced" | "pending" | "error";

export interface InspectionTask {
  id: string;
  title: string;
  site: string;
  status: TaskStatus;
  assigneeId: string;
  dueDate: string; // ISO date
  completedAt: string | null;
  progressPercent: number;
  defectCount: number;
  syncStatus: SyncStatus;
}

export type EquipmentCategory =
  | "pump"
  | "compressor"
  | "transformer"
  | "conveyor"
  | "valve"
  | "motor";

export type EquipmentStatus = "operational" | "attention" | "stopped";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  location: string;
  lastInspectionDate: string | null;
  status: EquipmentStatus;
  serialNumber: string;
}

export interface ChecklistItemResult {
  id: string;
  label: string;
  passed: boolean;
  notes: string | null;
}

export interface Measurement {
  id: string;
  name: string;
  unit: string;
  value: number;
  normMin: number;
  normMax: number;
  withinNorm: boolean;
}

export type DefectSeverity = "low" | "medium" | "high" | "critical";

export type DefectStatus = "open" | "review" | "resolved";

export interface DefectReport {
  id: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  equipmentId: string;
  taskId: string;
  reportedAt: string;
  hasPhotos: boolean;
}

export interface PhotoAttachment {
  id: string;
  caption: string;
  takenAt: string;
}

export type ActivityType =
  | "task_completed"
  | "defect_reported"
  | "inspection_started"
  | "sync_error"
  | "note";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  relatedTaskId?: string;
}

/** Rich detail for a single inspection task (mock / future API). */
export interface InspectionTaskDetail extends InspectionTask {
  assignee: User;
  routeDescription: string;
  equipmentIds: string[];
  checklist: ChecklistItemResult[];
  measurements: Measurement[];
  photos: PhotoAttachment[];
  linkedDefectIds: string[];
  syncMessage: string;
}

export interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  issueTasks: number;
  openDefects: number;
}
