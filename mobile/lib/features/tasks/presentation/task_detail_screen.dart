import 'package:flutter/material.dart';

import '../../../core/localization/demo_task_public_state.dart';
import '../../../core/localization/language_controller.dart';
import '../../../core/localization/language_menu_button.dart';
import '../../inspection/presentation/inspection_route_screen.dart';
import '../data/demo_task_completion_store.dart';
import '../data/inspector_task_session.dart';
import 'completed_task_report_screen.dart';

class TaskDetailScreen extends StatelessWidget {
  const TaskDetailScreen({
    super.key,
    required this.session,
  });

  final InspectorTaskSession session;

  void _onStartInspection(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => InspectionRouteScreen(session: session),
      ),
    );
  }

  void _onOpenResult(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (context) => CompletedTaskReportScreen(session: session),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final s = context.strings;
    final store = DemoTaskCompletionStore.instance;
    final baseline = session.baselineState();

    return ListenableBuilder(
      listenable: store,
      builder: (context, _) {
        final done = store.completedSnapshot(session.storeKey);
        final effective = store.effectiveState(
          storeKey: session.storeKey,
          baseline: baseline,
        );
        final statusLabel = done != null
            ? s.taskStateLabel(done.state)
            : s.taskStateLabel(effective);
        final statusColorResolved = (done?.state ==
                    DemoTaskPublicState.completedWithIssues ||
                effective == DemoTaskPublicState.completedWithIssues)
            ? colorScheme.error
            : colorScheme.primary;

        return Scaffold(
          appBar: AppBar(
            title: Text(s.taskDetailAppTitle),
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
                              session.title,
                              style: theme.textTheme.titleLarge?.copyWith(
                                color: colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              s.labelObject,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              session.siteAreaLine,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              s.labelStatus,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              statusLabel,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: statusColorResolved,
                                fontWeight: FontWeight.w600,
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
                              session.shiftOrDueLine,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: colorScheme.onSurface,
                              ),
                            ),
                            if (session.isRemote &&
                                session.assignmentDurationMinutes != null) ...[
                              const SizedBox(height: 12),
                              Text(
                                s.labelTaskDuration,
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                s.taskDurationMinutesValue(
                                  session.assignmentDurationMinutes!,
                                ),
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    if (session.instructions != null &&
                        session.instructions!.trim().isNotEmpty) ...[
                      const SizedBox(height: 20),
                      Text(
                        s.sectionTaskInstructions,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            session.instructions!.trim(),
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: colorScheme.onSurface,
                            ),
                          ),
                        ),
                      ),
                    ],
                    if (done != null) ...[
                      const SizedBox(height: 20),
                      Text(
                        s.taskDetailSectionOutcome,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _OutcomeRow(
                                label: s.labelSummaryTotalObjects,
                                value: '${done.totalObjects}',
                                theme: theme,
                                colorScheme: colorScheme,
                              ),
                              const SizedBox(height: 8),
                              _OutcomeRow(
                                label: s.labelSummaryCompletedOk,
                                value: '${done.completedOkCount}',
                                theme: theme,
                                colorScheme: colorScheme,
                              ),
                              const SizedBox(height: 8),
                              _OutcomeRow(
                                label: s.labelSummaryWithIssues,
                                value: '${done.issueObjectCount}',
                                theme: theme,
                                colorScheme: colorScheme,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    Text(
                      s.sectionInspectionRoute,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    for (var i = 0; i < session.items.length; i++)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        session.items[i].equipmentName,
                                        style: theme.textTheme.titleSmall
                                            ?.copyWith(
                                          color: colorScheme.onSurface,
                                        ),
                                      ),
                                    ),
                                    if (done != null &&
                                        i < done.itemHasIssue.length)
                                      Text(
                                        done.itemHasIssue[i]
                                            ? s.routeStatusHasIssue
                                            : s.statusCompleted,
                                        style: theme.textTheme.labelMedium
                                            ?.copyWith(
                                          color: done.itemHasIssue[i]
                                              ? colorScheme.error
                                              : colorScheme.primary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  session.items[i].equipmentLocation,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: done != null
                    ? FilledButton(
                        onPressed: () => _onOpenResult(context),
                        child: Text(s.taskOpenResultButton),
                      )
                    : FilledButton(
                        onPressed: () => _onStartInspection(context),
                        child: Text(s.startRoundButton),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _OutcomeRow extends StatelessWidget {
  const _OutcomeRow({
    required this.label,
    required this.value,
    required this.theme,
    required this.colorScheme,
  });

  final String label;
  final String value;
  final ThemeData theme;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Text(
          value,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
