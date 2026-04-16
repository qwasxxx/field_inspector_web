import '../../../core/localization/app_strings.dart';
import '../../../core/localization/demo_task_public_state.dart';
import '../../../core/util/mock_uuid.dart';
import '../presentation/mock_inspection_content.dart';

/// One equipment step on a task route (DB `inspection_task_items` or mock).
class InspectorRouteItemRow {
  const InspectorRouteItemRow({
    required this.id,
    required this.equipmentName,
    required this.equipmentLocation,
    required this.sortOrder,
  });

  final String id;
  final String equipmentName;
  final String equipmentLocation;
  final int sortOrder;
}

/// Everything the mobile flow needs for one task (mock or Supabase-backed).
class InspectorTaskSession {
  const InspectorTaskSession({
    required this.storeKey,
    required this.isRemote,
    this.mockTaskIndex,
    this.remoteTaskId,
    this.remoteAssignmentId,
    this.assignmentExecutionStatusRaw,
    this.assignmentStartedAt,
    this.assignmentDurationMinutes,
    this.assignmentCompletedAtRaw,
    required this.title,
    required this.siteAreaLine,
    required this.shiftOrDueLine,
    required this.items,
    this.remoteStatusRaw,
    this.instructions,
  });

  /// Stable key for in-memory completion store (`mock_0` or real task UUID).
  final String storeKey;
  final bool isRemote;
  final int? mockTaskIndex;
  final String? remoteTaskId;
  final String? remoteAssignmentId;
  final String? assignmentExecutionStatusRaw;
  final DateTime? assignmentStartedAt;
  final int? assignmentDurationMinutes;
  final String? assignmentCompletedAtRaw;
  final String title;
  final String siteAreaLine;
  final String shiftOrDueLine;
  final List<InspectorRouteItemRow> items;
  final String? remoteStatusRaw;
  final String? instructions;

  int get routeItemCount => items.length;

  DemoTaskPublicState baselineState() {
    if (!isRemote) {
      return MockInspectionContent.initialBaselineState(mockTaskIndex!);
    }
    final ex = assignmentExecutionStatusRaw;
    if (ex != null && ex.isNotEmpty) {
      return demoStateFromAssignmentExecution(ex);
    }
    return demoTaskStateFromRemoteInspectionStatus(remoteStatusRaw);
  }

  factory InspectorTaskSession.mock(int mockIndex, AppStrings s) {
    final n = MockInspectionContent.routeItemCount(mockIndex);
    final mockRows = MockInspectionContent.routeItems(s, mockIndex);
    return InspectorTaskSession(
      storeKey: 'mock_$mockIndex',
      isRemote: false,
      mockTaskIndex: mockIndex,
      remoteTaskId: null,
      remoteAssignmentId: null,
      assignmentExecutionStatusRaw: null,
      assignmentStartedAt: null,
      assignmentDurationMinutes: null,
      assignmentCompletedAtRaw: null,
      title: MockInspectionContent.taskTitle(s, mockIndex),
      siteAreaLine: MockInspectionContent.taskArea(s, mockIndex),
      shiftOrDueLine: MockInspectionContent.shiftForTask(s, mockIndex),
      items: List<InspectorRouteItemRow>.generate(
        n,
        (i) => InspectorRouteItemRow(
          id: mockUuidFromSeed('equip|$mockIndex|$i'),
          equipmentName: mockRows[i].name,
          equipmentLocation: mockRows[i].subtitle,
          sortOrder: i,
        ),
      ),
      remoteStatusRaw: null,
      instructions: null,
    );
  }

  factory InspectorTaskSession.fromRemoteTask({
    required Map<String, dynamic> assignmentRow,
    required Map<String, dynamic> taskRow,
    required List<Map<String, dynamic>> itemRows,
    required AppStrings s,
  }) {
    String str(dynamic v) => v?.toString() ?? '';

    final assignmentId = str(assignmentRow['id']);
    final exec = str(assignmentRow['execution_status']);
    DateTime? startedAt;
    final sa = assignmentRow['started_at'];
    if (sa != null && str(sa).isNotEmpty) {
      startedAt = DateTime.tryParse(str(sa))?.toUtc();
    }
    int? durationM;
    final dm = assignmentRow['duration_minutes'];
    if (dm is num) {
      durationM = dm.toInt();
    } else {
      durationM = int.tryParse(str(dm));
    }
    final completedRaw = str(assignmentRow['completed_at']);
    final completedAt =
        completedRaw.isNotEmpty ? completedRaw : null;

    final id = str(taskRow['id']);
    final site = str(taskRow['site_name']);
    final area = str(taskRow['area_name']);
    String siteArea;
    if (site.isEmpty) {
      siteArea = area;
    } else if (area.isEmpty) {
      siteArea = site;
    } else {
      siteArea = '$site · $area';
    }

    final shift = str(taskRow['shift_label']);
    String shiftOrDue = shift;
    if (shiftOrDue.isEmpty) {
      final due = taskRow['due_at'];
      if (due != null && str(due).isNotEmpty) {
        shiftOrDue = '${s.labelDueAt}: ${str(due)}';
      } else {
        shiftOrDue = s.tasksScheduleNotSpecified;
      }
    }

    final sorted = List<Map<String, dynamic>>.from(itemRows)
      ..sort((a, b) {
        final ao = a['sort_order'];
        final bo = b['sort_order'];
        final ai = ao is num ? ao.toInt() : int.tryParse('$ao') ?? 0;
        final bi = bo is num ? bo.toInt() : int.tryParse('$bo') ?? 0;
        return ai.compareTo(bi);
      });

    final items = sorted.map((r) {
      return InspectorRouteItemRow(
        id: str(r['id']),
        equipmentName: str(r['equipment_name']),
        equipmentLocation: str(r['equipment_location']),
        sortOrder: r['sort_order'] is num
            ? (r['sort_order'] as num).toInt()
            : int.tryParse('${r['sort_order']}') ?? 0,
      );
    }).toList();

    return InspectorTaskSession(
      storeKey: id,
      isRemote: true,
      mockTaskIndex: null,
      remoteTaskId: id,
      remoteAssignmentId: assignmentId.isEmpty ? null : assignmentId,
      assignmentExecutionStatusRaw: exec.isEmpty ? null : exec,
      assignmentStartedAt: startedAt,
      assignmentDurationMinutes: durationM,
      assignmentCompletedAtRaw: completedAt,
      title: str(taskRow['title']).isEmpty ? s.tasksUntitledTask : str(taskRow['title']),
      siteAreaLine: siteArea.isEmpty ? s.tasksScheduleNotSpecified : siteArea,
      shiftOrDueLine: shiftOrDue,
      items: items,
      remoteStatusRaw: str(taskRow['status']).isEmpty ? null : str(taskRow['status']),
      instructions: str(taskRow['instructions']).isEmpty ? null : str(taskRow['instructions']),
    );
  }
}
