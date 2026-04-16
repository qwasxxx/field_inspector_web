/// Demo-only task list / detail status (internal English ids).
enum DemoTaskPublicState {
  pending,
  inProgress,
  completed,
  completedWithIssues,
}

/// Maps `inspection_tasks.status` from Supabase to mobile list state.
DemoTaskPublicState demoTaskStateFromRemoteInspectionStatus(String? raw) {
  final k = (raw ?? '').toLowerCase().trim().replaceAll(' ', '_');
  switch (k) {
    case 'in_progress':
      return DemoTaskPublicState.inProgress;
    case 'completed':
      return DemoTaskPublicState.completed;
    case 'completed_with_issues':
      return DemoTaskPublicState.completedWithIssues;
    case 'assigned':
    case 'pending':
    case 'draft':
    default:
      return DemoTaskPublicState.pending;
  }
}

/// Maps `inspection_task_assignments.execution_status`.
DemoTaskPublicState demoStateFromAssignmentExecution(String? raw) {
  final k = (raw ?? '').toLowerCase().trim().replaceAll(' ', '_');
  switch (k) {
    case 'in_progress':
      return DemoTaskPublicState.inProgress;
    case 'completed':
      return DemoTaskPublicState.completed;
    case 'completed_with_issues':
      return DemoTaskPublicState.completedWithIssues;
    case 'not_started':
    case 'pending':
    default:
      return DemoTaskPublicState.pending;
  }
}
