import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/worker_identity.dart';

class InspectionTaskRequestException implements Exception {
  InspectionTaskRequestException(this.message);
  final String message;
}

/// Inserts worker-originated task requests for admin review.
class InspectionTaskRequestService {
  InspectionTaskRequestService._();

  static bool _clientReady() {
    try {
      return Supabase.instance.isInitialized;
    } catch (_) {
      return false;
    }
  }

  static SupabaseClient get _client => Supabase.instance.client;

  static Future<void> submitRequest({
    required String title,
    required String siteName,
    required String areaName,
    required String description,
    required String priority,
  }) async {
    final workerId = WorkerIdentity.resolveWorkerUserId();
    if (workerId == null || workerId.isEmpty) {
      throw InspectionTaskRequestException('no_worker');
    }
    if (!_clientReady()) {
      throw InspectionTaskRequestException('not_ready');
    }
    var p = priority.trim().toLowerCase();
    if (!const {'low', 'medium', 'high'}.contains(p)) {
      p = 'low';
    }
    final now = DateTime.now().toUtc().toIso8601String();
    try {
      await _client.from('inspection_task_requests').insert({
        'requested_by': workerId,
        'title': title.trim(),
        'site_name': siteName.trim(),
        'area_name': areaName.trim(),
        'description': description.trim(),
        'priority': p,
        'status': 'pending',
        'requested_at': now,
      });
    } catch (e, st) {
      debugPrint('[TaskRequest] insert failed $e\n$st');
      throw InspectionTaskRequestException('insert_failed');
    }
  }
}
