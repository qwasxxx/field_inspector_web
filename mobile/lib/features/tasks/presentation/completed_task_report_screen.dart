import 'package:flutter/material.dart';

import '../../../core/localization/demo_task_public_state.dart';
import '../../../core/localization/language_controller.dart';
import '../../../core/localization/language_menu_button.dart';
import '../data/demo_task_completion_store.dart';
import '../data/inspector_task_session.dart';
import 'task_list_screen.dart';

class CompletedTaskReportScreen extends StatelessWidget {
  const CompletedTaskReportScreen({
    super.key,
    required this.session,
  });

  final InspectorTaskSession session;

  void _backToTasks(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (context) => const TaskListScreen(),
      ),
      (route) => route.isFirst,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final s = context.strings;
    final snap =
        DemoTaskCompletionStore.instance.completedSnapshot(session.storeKey);

    if (snap == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(s.completedReportAppTitle),
          actions: const [
            LanguageMenuButton(),
          ],
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              s.completedReportNotAvailable,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      );
    }

    final items = session.items;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.completedReportAppTitle),
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
                          session.title,
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
                          session.siteAreaLine,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          s.labelFinalTaskState,
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          s.taskStateLabel(snap.state),
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: snap.state ==
                                    DemoTaskPublicState.completedWithIssues
                                ? colorScheme.error
                                : colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _ReportStatRow(
                          label: s.labelSummaryTotalObjects,
                          value: '${snap.totalObjects}',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _ReportStatRow(
                          label: s.labelSummaryCompletedOk,
                          value: '${snap.completedOkCount}',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _ReportStatRow(
                          label: s.labelSummaryWithIssues,
                          value: '${snap.issueObjectCount}',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  s.sectionSummaryResults,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                for (var i = 0; i < items.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Card(
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
                                    '${i + 1}. ${items[i].equipmentName}',
                                    style:
                                        theme.textTheme.titleSmall?.copyWith(
                                      color: colorScheme.onSurface,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  i < snap.itemHasIssue.length &&
                                          snap.itemHasIssue[i]
                                      ? s.routeStatusHasIssue
                                      : s.statusCompleted,
                                  style: theme.textTheme.labelMedium?.copyWith(
                                    color: i < snap.itemHasIssue.length &&
                                            snap.itemHasIssue[i]
                                        ? colorScheme.error
                                        : colorScheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              items[i].equipmentLocation,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Text(
                  s.sectionCompletedReportInspectionSummary,
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
                        _ReportStatRow(
                          label: s.labelReportPhotoCount,
                          value: '${snap.totalPhotosSubmitted}',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _ReportStatRow(
                          label: s.labelReportAudioCount,
                          value: '${snap.totalAudioClipsSubmitted}',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _ReportStatRow(
                          label: s.labelReportObjectsWithDefects,
                          value: '${snap.issueObjectCount}',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            child: FilledButton(
              onPressed: () => _backToTasks(context),
              child: Text(s.summaryBackToTasksButton),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportStatRow extends StatelessWidget {
  const _ReportStatRow({
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
