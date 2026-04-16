import 'package:flutter/foundation.dart';

import '../../../core/localization/demo_task_public_state.dart';

/// In-memory demo snapshot after a full route is finished.
class CompletedTaskDemoSnapshot {
  const CompletedTaskDemoSnapshot({
    required this.state,
    required this.itemHasIssue,
    required this.totalPhotosSubmitted,
    required this.totalAudioClipsSubmitted,
  });

  final DemoTaskPublicState state;
  final List<bool> itemHasIssue;
  final int totalPhotosSubmitted;
  final int totalAudioClipsSubmitted;

  int get totalObjects => itemHasIssue.length;

  int get issueObjectCount => itemHasIssue.where((x) => x).length;

  int get completedOkCount => totalObjects - issueObjectCount;
}

/// Minimal shared demo state: route started + completed round results.
class DemoTaskCompletionStore extends ChangeNotifier {
  DemoTaskCompletionStore._();
  static final DemoTaskCompletionStore instance = DemoTaskCompletionStore._();

  final Map<String, CompletedTaskDemoSnapshot> _completed = {};
  final Set<String> _routeStarted = {};

  CompletedTaskDemoSnapshot? completedSnapshot(String storeKey) =>
      _completed[storeKey];

  DemoTaskPublicState effectiveState({
    required String storeKey,
    required DemoTaskPublicState baseline,
  }) {
    final done = _completed[storeKey];
    if (done != null) return done.state;
    if (_routeStarted.contains(storeKey)) return DemoTaskPublicState.inProgress;
    return baseline;
  }

  void markRouteStarted(String storeKey) {
    if (_completed.containsKey(storeKey)) return;
    if (_routeStarted.contains(storeKey)) return;
    _routeStarted.add(storeKey);
    notifyListeners();
  }

  void recordRouteFinished({
    required String storeKey,
    required List<bool> itemHasIssue,
    required int totalPhotosSubmitted,
    required int totalAudioClipsSubmitted,
  }) {
    final issueCount = itemHasIssue.where((x) => x).length;
    _completed[storeKey] = CompletedTaskDemoSnapshot(
      state: issueCount > 0
          ? DemoTaskPublicState.completedWithIssues
          : DemoTaskPublicState.completed,
      itemHasIssue: List<bool>.from(itemHasIssue),
      totalPhotosSubmitted: totalPhotosSubmitted,
      totalAudioClipsSubmitted: totalAudioClipsSubmitted,
    );
    _routeStarted.remove(storeKey);
    notifyListeners();
  }
}
