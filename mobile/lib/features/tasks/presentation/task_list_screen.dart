import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../../core/config/worker_identity.dart';
import '../../../core/config/worker_profile_service.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/localization/demo_task_public_state.dart';
import '../../../core/localization/language_controller.dart';
import '../../../core/localization/language_menu_button.dart';
import '../data/assigned_inspection_task_service.dart';
import '../data/demo_task_completion_store.dart';
import '../data/inspector_task_session.dart';
import 'task_detail_screen.dart';
import 'task_request_create_screen.dart';

class _TaskListPageData {
  const _TaskListPageData({
    required this.load,
    this.profile,
  });

  final TaskListLoadResult load;
  final WorkerProfile? profile;
}

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  static const _mockCount = 3;

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  late Future<_TaskListPageData> _loadFuture;

  @override
  void initState() {
    super.initState();
    _loadFuture = _loadPage();
  }

  Future<_TaskListPageData> _loadPage() async {
    final load = await AssignedInspectionTaskService.loadAssignedBundles();
    final profile = await WorkerProfileService.fetchCurrentProfile();
    return _TaskListPageData(load: load, profile: profile);
  }

  void _reload() {
    setState(() {
      _loadFuture = _loadPage();
    });
  }

  List<InspectorTaskSession> _realSessions(TaskListLoadResult load, AppStrings s) {
    return load.bundles
        .map(
          (b) => InspectorTaskSession.fromRemoteTask(
            assignmentRow: b.assignmentRow,
            taskRow: b.taskRow,
            itemRows: b.itemRows,
            s: s,
          ),
        )
        .toList();
  }

  List<InspectorTaskSession> _demoSessions(AppStrings s) {
    return List<InspectorTaskSession>.generate(
      TaskListScreen._mockCount,
      (i) => InspectorTaskSession.mock(i, s),
    );
  }

  String? _errorLine(AppStrings s, TaskListLoadError? e) {
    if (e == null) return null;
    switch (e) {
      case TaskListLoadError.noWorkerIdentity:
        return s.tasksNoWorkerIdentity;
      case TaskListLoadError.supabaseNotReady:
        return s.tasksSupabaseNotReady;
      case TaskListLoadError.fetchFailed:
        return s.tasksLoadFailed;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final s = context.strings;
    final store = DemoTaskCompletionStore.instance;
    final lang = context.languageController;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.tasksAppTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.assignment_add),
            tooltip: s.taskRequestActionTooltip,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (context) => const TaskRequestCreateScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: s.tasksRetry,
            onPressed: _reload,
          ),
          const LanguageMenuButton(),
        ],
      ),
      body: FutureBuilder<_TaskListPageData>(
        future: _loadFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 16),
                  Text(
                    s.tasksLoading,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }

          final page = snapshot.data!;
          final load = page.load;
          final profile = page.profile;

          return ListenableBuilder(
            listenable: Listenable.merge([store, lang]),
            builder: (context, _) {
              final sNow = context.strings;
              final realSessions = _realSessions(load, sNow);
              final hasRealTasks = realSessions.isNotEmpty;
              final err = load.error;
              final remoteSucceeded = err == null;
              final showError = err != null;
              final showEmptyAssigned = remoteSucceeded && !hasRealTasks;
              final showDemoSection = kDebugMode && !hasRealTasks;

              final errLine = _errorLine(sNow, err);

              final children = <Widget>[
                _WorkerContextCard(
                  s: sNow,
                  theme: theme,
                  colorScheme: colorScheme,
                  profile: profile,
                ),
              ];

              if (showError && errLine != null) {
                children.addAll([
                  const SizedBox(height: 12),
                  Text(
                    errLine,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.error,
                    ),
                  ),
                  TextButton(
                    onPressed: _reload,
                    child: Text(sNow.tasksRetry),
                  ),
                ]);
              }

              if (hasRealTasks) {
                children.addAll([
                  const SizedBox(height: 8),
                  Text(
                    sNow.tasksSectionAssignedRounds,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...realSessions.map(
                    (session) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _TaskListCard(
                        session: session,
                        theme: theme,
                        colorScheme: colorScheme,
                        s: sNow,
                        store: store,
                      ),
                    ),
                  ),
                ]);
              }

              if (showEmptyAssigned) {
                children.addAll([
                  const SizedBox(height: 8),
                  Text(
                    sNow.tasksNoAssignments,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ]);
              }

              if (showDemoSection) {
                final demoSessions = _demoSessions(sNow);
                children.addAll([
                  const SizedBox(height: 20),
                  Text(
                    sNow.tasksSectionDemoTasks,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    sNow.tasksDemoSectionDebugHint,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...demoSessions.map(
                    (session) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _TaskListCard(
                        session: session,
                        theme: theme,
                        colorScheme: colorScheme,
                        s: sNow,
                        store: store,
                      ),
                    ),
                  ),
                ]);
              }

              return ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: children,
              );
            },
          );
        },
      ),
    );
  }
}

class _WorkerContextCard extends StatelessWidget {
  const _WorkerContextCard({
    required this.s,
    required this.theme,
    required this.colorScheme,
    required this.profile,
  });

  final AppStrings s;
  final ThemeData theme;
  final ColorScheme colorScheme;
  final WorkerProfile? profile;

  @override
  Widget build(BuildContext context) {
    final workerId = WorkerIdentity.resolveWorkerUserId();
    final devMode = WorkerIdentity.isDevWorkerUserIdActive();
    final p = profile;

    final body = <Widget>[
      Text(
        s.workerSectionTitle,
        style: theme.textTheme.titleSmall?.copyWith(
          color: colorScheme.onSurface,
        ),
      ),
    ];

    if (devMode) {
      body.addAll([
        const SizedBox(height: 8),
        Text(
          s.workerDevWorkerIdBadge,
          style: theme.textTheme.labelSmall?.copyWith(
            color: colorScheme.tertiary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ]);
    }

    if (workerId == null) {
      body.addAll([
        const SizedBox(height: 8),
        Text(
          s.tasksNoWorkerIdentity,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ]);
    } else if (p != null) {
      body.addAll([
        const SizedBox(height: 8),
        Text(
          s.workerProfileNameLabel,
          style: theme.textTheme.labelMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          p.displayName,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ]);
      if (p.displayCodeOrUsername.isNotEmpty) {
        body.addAll([
          const SizedBox(height: 8),
          Text(
            s.workerProfileCodeLabel,
            style: theme.textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            p.displayCodeOrUsername,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurface,
            ),
          ),
        ]);
      }
    } else {
      body.addAll([
        const SizedBox(height: 8),
        Text(
          s.workerProfileNotInDatabase,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        SelectableText(
          workerId,
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurface,
            fontFamily: 'monospace',
          ),
        ),
      ]);
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: body,
        ),
      ),
    );
  }
}

class _TaskListCard extends StatelessWidget {
  const _TaskListCard({
    required this.session,
    required this.theme,
    required this.colorScheme,
    required this.s,
    required this.store,
  });

  final InspectorTaskSession session;
  final ThemeData theme;
  final ColorScheme colorScheme;
  final AppStrings s;
  final DemoTaskCompletionStore store;

  @override
  Widget build(BuildContext context) {
    final routeTotal = session.routeItemCount;
    final baseline = session.baselineState();

    final effective = store.effectiveState(
      storeKey: session.storeKey,
      baseline: baseline,
    );
    final done = store.completedSnapshot(session.storeKey);
    final statusColor = effective == DemoTaskPublicState.completedWithIssues
        ? colorScheme.error
        : colorScheme.primary;

    final statusText = done != null
        ? s.taskStateLabel(done.state)
        : s.taskStateLabel(effective);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (context) => TaskDetailScreen(session: session),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                session.title,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                session.siteAreaLine,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                statusText,
                style: theme.textTheme.labelLarge?.copyWith(
                  color: statusColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                session.shiftOrDueLine,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                s.taskListProgressLine(
                  state: effective,
                  routeTotal: routeTotal,
                ),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
