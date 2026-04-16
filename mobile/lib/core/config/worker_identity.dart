import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_env.dart';

/// Resolves the worker user id for assignment queries (centralized).
///
/// Order: authenticated user id → [AppEnv.devWorkerUserId] when non-empty.
class WorkerIdentity {
  WorkerIdentity._();

  /// Returns `null` when neither auth nor dev override is available.
  static String? resolveWorkerUserId() {
    try {
      final uid = Supabase.instance.client.auth.currentUser?.id;
      if (uid != null && uid.isNotEmpty) return uid;
    } catch (_) {}
    final dev = AppEnv.devWorkerUserId.trim();
    if (dev.isNotEmpty) return dev;
    return null;
  }

  /// True when [resolveWorkerUserId] uses [AppEnv.devWorkerUserId] because there
  /// is no authenticated Supabase user session.
  static bool isDevWorkerUserIdActive() {
    try {
      final uid = Supabase.instance.client.auth.currentUser?.id;
      if (uid != null && uid.isNotEmpty) return false;
    } catch (_) {}
    return AppEnv.devWorkerUserId.trim().isNotEmpty;
  }
}
