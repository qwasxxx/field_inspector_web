import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/worker_identity.dart';

enum TaskListLoadError {
  noWorkerIdentity,
  supabaseNotReady,
  fetchFailed,
}

/// Raw rows for one task (before localization in UI).
class AssignedInspectionTaskBundle {
  const AssignedInspectionTaskBundle({
    required this.assignmentRow,
    required this.taskRow,
    required this.itemRows,
  });

  final Map<String, dynamic> assignmentRow;
  final Map<String, dynamic> taskRow;
  final List<Map<String, dynamic>> itemRows;
}

class TaskListLoadResult {
  const TaskListLoadResult({
    required this.bundles,
    this.error,
  });

  final List<AssignedInspectionTaskBundle> bundles;
  final TaskListLoadError? error;

  bool get hasRemote => bundles.isNotEmpty;
}

/// Fetches worker assignments from Supabase (admin panel contract).
class AssignedInspectionTaskService {
  AssignedInspectionTaskService._();

  static bool _clientReady() {
    try {
      return Supabase.instance.isInitialized;
    } catch (_) {
      return false;
    }
  }

  static SupabaseClient get _client => Supabase.instance.client;

  static Future<TaskListLoadResult> loadAssignedBundles() async {
    final workerId = WorkerIdentity.resolveWorkerUserId();
    if (workerId == null || workerId.isEmpty) {
      debugPrint('[AssignedTasks] no worker id (auth + dev override empty)');
      return const TaskListLoadResult(
        bundles: [],
        error: TaskListLoadError.noWorkerIdentity,
      );
    }
    if (!_clientReady()) {
      return const TaskListLoadResult(
        bundles: [],
        error: TaskListLoadError.supabaseNotReady,
      );
    }

    try {
      final assignRes = await _client
          .from('inspection_task_assignments')
          .select()
          .eq('worker_user_id', workerId)
          .eq('is_active', true);

      final assignList = assignRes as List<dynamic>;
      if (assignList.isEmpty) {
        return const TaskListLoadResult(bundles: []);
      }

      final taskIds = <String>{};
      for (final row in assignList) {
        if (row is Map<String, dynamic>) {
          final id = row['task_id']?.toString();
          if (id != null && id.isNotEmpty) taskIds.add(id);
        }
      }
      if (taskIds.isEmpty) {
        return const TaskListLoadResult(bundles: []);
      }

      final tasksRes = await _client
          .from('inspection_tasks')
          .select()
          .inFilter('id', taskIds.toList());

      final tasksList = tasksRes as List<dynamic>;
      final taskById = <String, Map<String, dynamic>>{};
      for (final t in tasksList) {
        if (t is Map<String, dynamic>) {
          final id = t['id']?.toString();
          if (id != null && id.isNotEmpty) taskById[id] = t;
        }
      }

      final itemsRes = await _client
          .from('inspection_task_items')
          .select()
          .inFilter('task_id', taskIds.toList())
          .order('sort_order', ascending: true);

      final itemsList = itemsRes as List<dynamic>;
      final itemsByTask = <String, List<Map<String, dynamic>>>{};
      for (final raw in itemsList) {
        if (raw is Map<String, dynamic>) {
          final tid = raw['task_id']?.toString();
          if (tid == null || tid.isEmpty) continue;
          itemsByTask.putIfAbsent(tid, () => []).add(raw);
        }
      }

      final bundles = <AssignedInspectionTaskBundle>[];
      for (final row in assignList) {
        if (row is! Map<String, dynamic>) continue;
        final tid = row['task_id']?.toString();
        if (tid == null || tid.isEmpty) continue;
        final taskRow = taskById[tid];
        if (taskRow == null) continue;
        bundles.add(
          AssignedInspectionTaskBundle(
            assignmentRow: row,
            taskRow: taskRow,
            itemRows: itemsByTask[tid] ?? const [],
          ),
        );
      }

      bundles.sort((a, b) {
        final ta = '${a.taskRow['title']}'.toLowerCase();
        final tb = '${b.taskRow['title']}'.toLowerCase();
        return ta.compareTo(tb);
      });

      return TaskListLoadResult(bundles: bundles);
    } catch (e, st) {
      debugPrint('[AssignedTasks] fetch failed $e\n$st');
      return TaskListLoadResult(
        bundles: const [],
        error: TaskListLoadError.fetchFailed,
      );
    }
  }

  /// First time (or any) route open: assignment tracking + task status.
  static Future<void> markAssignmentStarted({
    required String? assignmentId,
    required String? remoteTaskId,
  }) async {
    if (!_clientReady()) return;
    final now = DateTime.now().toUtc().toIso8601String();
    try {
      if (assignmentId != null && assignmentId.isNotEmpty) {
        final existing = await _client
            .from('inspection_task_assignments')
            .select('started_at')
            .eq('id', assignmentId)
            .maybeSingle();
        final hadStart =
            existing != null && existing['started_at'] != null;
        await _client.from('inspection_task_assignments').update({
          'execution_status': 'in_progress',
          'last_progress_at': now,
          if (!hadStart) 'started_at': now,
        }).eq('id', assignmentId);
      }
      if (remoteTaskId != null && remoteTaskId.isNotEmpty) {
        await _client
            .from('inspection_tasks')
            .update({'status': 'in_progress'})
            .eq('id', remoteTaskId);
      }
    } catch (e, st) {
      debugPrint('[AssignedTasks] markAssignmentStarted failed $e\n$st');
    }
  }

  static Future<void> touchAssignmentProgress(String? assignmentId) async {
    if (assignmentId == null || assignmentId.isEmpty) return;
    if (!_clientReady()) return;
    final now = DateTime.now().toUtc().toIso8601String();
    try {
      await _client.from('inspection_task_assignments').update({
        'last_progress_at': now,
      }).eq('id', assignmentId);
    } catch (e, st) {
      debugPrint('[AssignedTasks] touchAssignmentProgress failed $e\n$st');
    }
  }

  static Future<void> completeAssignmentAndTask({
    required String? assignmentId,
    required String? remoteTaskId,
    required bool anyRouteIssue,
    DateTime? knownStartedAt,
  }) async {
    if (!_clientReady()) return;
    final now = DateTime.now().toUtc();
    final nowStr = now.toIso8601String();
    final exec = anyRouteIssue ? 'completed_with_issues' : 'completed';
    final taskStatus =
        anyRouteIssue ? 'completed_with_issues' : 'completed';

    try {
      if (assignmentId != null && assignmentId.isNotEmpty) {
        var start = knownStartedAt;
        if (start == null) {
          final row = await _client
              .from('inspection_task_assignments')
              .select('started_at')
              .eq('id', assignmentId)
              .maybeSingle();
          final s = row?['started_at'];
          if (s != null) {
            start = DateTime.tryParse(s.toString())?.toUtc();
          }
        }
        var durationMinutes = 0;
        if (start != null) {
          durationMinutes = now.difference(start).inMinutes;
          if (durationMinutes < 0) durationMinutes = 0;
        }
        await _client.from('inspection_task_assignments').update({
          'execution_status': exec,
          'completed_at': nowStr,
          'duration_minutes': durationMinutes,
          'last_progress_at': nowStr,
        }).eq('id', assignmentId);
      }
      if (remoteTaskId != null && remoteTaskId.isNotEmpty) {
        await _client
            .from('inspection_tasks')
            .update({'status': taskStatus})
            .eq('id', remoteTaskId);
      }
    } catch (e, st) {
      debugPrint('[AssignedTasks] completeAssignmentAndTask failed $e\n$st');
    }
  }
}
