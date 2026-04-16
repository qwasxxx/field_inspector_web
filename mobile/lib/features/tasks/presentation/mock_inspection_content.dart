import '../../../core/localization/app_strings.dart';
import '../../../core/localization/demo_task_public_state.dart';
import 'mock_route_item.dart';

/// Localized demo inspection tasks and routes. Stable [taskIndex] 0..2 for IDs.
class MockInspectionContent {
  MockInspectionContent._();

  static int routeItemCount(int taskIndex) {
    switch (taskIndex) {
      case 0:
        return 4;
      case 1:
        return 5;
      default:
        return 4;
    }
  }

  static String taskTitle(AppStrings s, int taskIndex) {
    switch (taskIndex) {
      case 0:
        return s.mockTask0Title;
      case 1:
        return s.mockTask1Title;
      default:
        return s.mockTask2Title;
    }
  }

  static String taskArea(AppStrings s, int taskIndex) {
    switch (taskIndex) {
      case 0:
        return s.mockTask0Area;
      case 1:
        return s.mockTask1Area;
      default:
        return s.mockTask2Area;
    }
  }

  /// Default list state before any demo store override (not started / in progress).
  static DemoTaskPublicState initialBaselineState(int taskIndex) {
    switch (taskIndex) {
      case 0:
        return DemoTaskPublicState.inProgress;
      case 1:
        return DemoTaskPublicState.pending;
      default:
        return DemoTaskPublicState.pending;
    }
  }

  static String shiftForTask(AppStrings s, int taskIndex) {
    switch (taskIndex) {
      case 0:
        return s.mockShift0;
      case 1:
        return s.mockShift1;
      default:
        return s.mockShift2;
    }
  }

  static List<MockRouteItem> routeItems(AppStrings s, int taskIndex) {
    switch (taskIndex) {
      case 0:
        return [
          MockRouteItem(name: s.r0i0n, subtitle: s.r0i0s),
          MockRouteItem(name: s.r0i1n, subtitle: s.r0i1s),
          MockRouteItem(name: s.r0i2n, subtitle: s.r0i2s),
          MockRouteItem(name: s.r0i3n, subtitle: s.r0i3s),
        ];
      case 1:
        return [
          MockRouteItem(name: s.r1i0n, subtitle: s.r1i0s),
          MockRouteItem(name: s.r1i1n, subtitle: s.r1i1s),
          MockRouteItem(name: s.r1i2n, subtitle: s.r1i2s),
          MockRouteItem(name: s.r1i3n, subtitle: s.r1i3s),
          MockRouteItem(name: s.r1i4n, subtitle: s.r1i4s),
        ];
      default:
        return [
          MockRouteItem(name: s.r2i0n, subtitle: s.r2i0s),
          MockRouteItem(name: s.r2i1n, subtitle: s.r2i1s),
          MockRouteItem(name: s.r2i2n, subtitle: s.r2i2s),
          MockRouteItem(name: s.r2i3n, subtitle: s.r2i3s),
        ];
    }
  }
}
