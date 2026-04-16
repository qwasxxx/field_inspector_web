import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/localization/language_controller.dart';
import '../../../core/localization/language_menu_button.dart';
import '../../tasks/data/assigned_inspection_task_service.dart';
import '../../tasks/data/demo_task_completion_store.dart';
import '../../tasks/data/inspector_task_session.dart';
import 'inspection_object_screen.dart';
import 'inspection_task_summary_screen.dart';

enum _RouteSlotState {
  pending,
  completed,
  completedWithIssue,
}

class InspectionRouteScreen extends StatefulWidget {
  const InspectionRouteScreen({
    super.key,
    required this.session,
  });

  final InspectorTaskSession session;

  @override
  State<InspectionRouteScreen> createState() => _InspectionRouteScreenState();
}

class _InspectionRouteScreenState extends State<InspectionRouteScreen> {
  late List<_RouteSlotState> _slotStates;
  int _photosRunningTotal = 0;
  int _audioRunningTotal = 0;

  @override
  void initState() {
    super.initState();
    final key = widget.session.storeKey;
    DemoTaskCompletionStore.instance.markRouteStarted(key);
    unawaited(
      AssignedInspectionTaskService.markAssignmentStarted(
        assignmentId: widget.session.remoteAssignmentId,
        remoteTaskId: widget.session.remoteTaskId,
      ),
    );
    _slotStates = List<_RouteSlotState>.filled(
      widget.session.routeItemCount,
      _RouteSlotState.pending,
    );
  }

  int? _firstPendingIndex() {
    for (var i = 0; i < _slotStates.length; i++) {
      if (_slotStates[i] == _RouteSlotState.pending) return i;
    }
    return null;
  }

  int get _finishedCount =>
      _slotStates.where((s) => s != _RouteSlotState.pending).length;

  bool get _allProcessed =>
      _slotStates.isNotEmpty &&
      _slotStates.every(
        (s) =>
            s == _RouteSlotState.completed ||
            s == _RouteSlotState.completedWithIssue,
      );

  Future<void> _maybeNavigateToSummary() async {
    if (!_allProcessed) return;
    final flags = _slotStates
        .map((st) => st == _RouteSlotState.completedWithIssue)
        .toList();
    final anyIssue = flags.any((x) => x);
    DemoTaskCompletionStore.instance.recordRouteFinished(
      storeKey: widget.session.storeKey,
      itemHasIssue: flags,
      totalPhotosSubmitted: _photosRunningTotal,
      totalAudioClipsSubmitted: _audioRunningTotal,
    );
    await AssignedInspectionTaskService.completeAssignmentAndTask(
      assignmentId: widget.session.remoteAssignmentId,
      remoteTaskId: widget.session.remoteTaskId,
      anyRouteIssue: anyIssue,
      knownStartedAt: widget.session.assignmentStartedAt,
    );
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (context) => InspectionTaskSummaryScreen(
          session: widget.session,
          itemHasIssue: flags,
        ),
      ),
    );
  }

  Future<void> _openObjectAt(int index) async {
    if (index < 0 || index >= _slotStates.length) return;

    final result = await Navigator.of(context).push<InspectionObjectResult?>(
      MaterialPageRoute<InspectionObjectResult?>(
        builder: (context) => InspectionObjectScreen(
          session: widget.session,
          routeItemIndex: index,
        ),
      ),
    );

    if (!mounted || result == null) return;
    setState(() {
      _photosRunningTotal += result.photoCount;
      _audioRunningTotal += result.audioCount;
      _slotStates[index] = result.hadDefect
          ? _RouteSlotState.completedWithIssue
          : _RouteSlotState.completed;
    });
    unawaited(
      AssignedInspectionTaskService.touchAssignmentProgress(
        widget.session.remoteAssignmentId,
      ),
    );
    if (!mounted) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(_maybeNavigateToSummary());
    });
  }

  Future<void> _openCurrentObject() async {
    final i = _firstPendingIndex();
    if (i == null) return;
    await _openObjectAt(i);
  }

  String _badgeText(AppStrings s, int index) {
    switch (_slotStates[index]) {
      case _RouteSlotState.completed:
        return s.statusCompleted;
      case _RouteSlotState.completedWithIssue:
        return s.routeStatusHasIssue;
      case _RouteSlotState.pending:
        final first = _firstPendingIndex();
        if (first == index) return s.badgeCurrent;
        return s.badgePending;
    }
  }

  Color _badgeColor(ColorScheme colorScheme, int index) {
    switch (_slotStates[index]) {
      case _RouteSlotState.completed:
        return colorScheme.primary;
      case _RouteSlotState.completedWithIssue:
        return colorScheme.error;
      case _RouteSlotState.pending:
        final first = _firstPendingIndex();
        if (first == index) return colorScheme.primary;
        return colorScheme.onSurfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final s = context.strings;
    final items = widget.session.items;
    final total = items.length;
    final progressValue = total == 0 ? 0.0 : _finishedCount / total;
    final pending = _firstPendingIndex();
    final allDone = pending == null && total > 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.inspectionExecutionAppTitle),
        actions: const [
          LanguageMenuButton(),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.labelTask,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.session.title,
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          s.labelObject,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.session.siteAreaLine,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          s.labelShift,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.session.shiftOrDueLine,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colorScheme.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  s.labelProgress,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progressValue,
                    minHeight: 8,
                    backgroundColor: colorScheme.surfaceContainerHighest,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  s.progressObjectsChecked(_finishedCount, total),
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  s.sectionInspectionObjects,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                ...items.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  final order = index + 1;
                  final badgeText = _badgeText(s, index);

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Card(
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => _openObjectAt(index),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '$order. ${item.equipmentName}',
                                      style:
                                          theme.textTheme.titleSmall?.copyWith(
                                        color: colorScheme.onSurface,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    badgeText,
                                    style:
                                        theme.textTheme.labelMedium?.copyWith(
                                      color: _badgeColor(colorScheme, index),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.equipmentLocation,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: FilledButton(
              onPressed: allDone ? null : _openCurrentObject,
              child: Text(s.openCurrentObjectButton),
            ),
          ),
        ],
      ),
    );
  }
}
