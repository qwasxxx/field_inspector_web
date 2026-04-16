import 'package:flutter/material.dart';

import '../../../core/localization/language_controller.dart';
import '../../../core/localization/language_menu_button.dart';
import '../../tasks/data/inspector_task_session.dart';
import '../../tasks/presentation/task_list_screen.dart';

class InspectionTaskSummaryScreen extends StatelessWidget {
  const InspectionTaskSummaryScreen({
    super.key,
    required this.session,
    required this.itemHasIssue,
  });

  final InspectorTaskSession session;
  /// One entry per route object: `true` if finished with issue, `false` if OK.
  final List<bool> itemHasIssue;

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
    final items = session.items;
    final total = items.length;
    final issueCount = itemHasIssue.where((x) => x).length;
    final completedOkCount = total - issueCount;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.inspectionTaskSummaryTitle),
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
                        _SummaryStatRow(
                          label: s.labelSummaryTotalObjects,
                          value: '$total',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _SummaryStatRow(
                          label: s.labelSummaryCompletedOk,
                          value: '$completedOkCount',
                          theme: theme,
                          colorScheme: colorScheme,
                        ),
                        const SizedBox(height: 8),
                        _SummaryStatRow(
                          label: s.labelSummaryWithIssues,
                          value: '$issueCount',
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
                                  i < itemHasIssue.length && itemHasIssue[i]
                                      ? s.routeStatusHasIssue
                                      : s.statusCompleted,
                                  style: theme.textTheme.labelMedium?.copyWith(
                                    color: i < itemHasIssue.length &&
                                            itemHasIssue[i]
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

class _SummaryStatRow extends StatelessWidget {
  const _SummaryStatRow({
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
