import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'worker_identity.dart';

/// Row from `profiles` for the current worker (when available).
class WorkerProfile {
  const WorkerProfile({
    required this.id,
    required this.fullName,
    required this.username,
    required this.employeeCode,
    required this.role,
  });

  final String id;
  final String fullName;
  final String username;
  final String employeeCode;
  final String role;

  /// Prefer full name; fall back to username for compact display.
  String get displayName {
    if (fullName.trim().isNotEmpty) return fullName.trim();
    if (username.trim().isNotEmpty) return username.trim();
    return id;
  }

  /// Prefer employee code for field context; fall back to username.
  String get displayCodeOrUsername {
    if (employeeCode.trim().isNotEmpty) return employeeCode.trim();
    if (username.trim().isNotEmpty) return username.trim();
    return '';
  }
}

/// Loads `profiles` for [WorkerIdentity.resolveWorkerUserId].
class WorkerProfileService {
  WorkerProfileService._();

  static bool _clientReady() {
    try {
      return Supabase.instance.isInitialized;
    } catch (_) {
      return false;
    }
  }

  static SupabaseClient get _client => Supabase.instance.client;

  static Future<WorkerProfile?> fetchCurrentProfile() async {
    final id = WorkerIdentity.resolveWorkerUserId();
    if (id == null || id.isEmpty) return null;
    if (!_clientReady()) return null;
    try {
      final res = await _client
          .from('profiles')
          .select('id, full_name, username, employee_code, role')
          .eq('id', id)
          .maybeSingle();
      if (res == null) return null;
      final m = Map<String, dynamic>.from(res);
      String s(dynamic v) => v?.toString() ?? '';
      return WorkerProfile(
        id: s(m['id']).isEmpty ? id : s(m['id']),
        fullName: s(m['full_name']),
        username: s(m['username']),
        employeeCode: s(m['employee_code']),
        role: s(m['role']),
      );
    } catch (e, st) {
      debugPrint('[WorkerProfile] fetch failed $e\n$st');
      return null;
    }
  }
}
