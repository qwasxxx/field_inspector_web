import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_env.dart';
import 'inspection_save_failure.dart';

/// Expects Postgres tables (adjust names/columns in Supabase to match):
/// - `inspection_reports`: task_id, equipment_id, checklist (jsonb),
///   measurements (jsonb), comment_text, defect_found, defect_description,
///   defect_priority, photo_count, audio_count
/// - `inspection_media`: task_id, equipment_id, media_type (`photo`|`audio`),
///   file_path, file_name, mime_type (nullable), size_bytes (nullable)
/// Storage bucket: [AppEnv.inspectionMediaBucket]
class InspectionSupabaseService {
  InspectionSupabaseService._();

  static final InspectionSupabaseService instance = InspectionSupabaseService._();

  static bool isSupabaseClientReady() {
    try {
      return Supabase.instance.isInitialized;
    } on AssertionError {
      return false;
    } catch (_) {
      return false;
    }
  }

  SupabaseClient get _client => Supabase.instance.client;

  static void _logPostgrestDetail(String stepLabel, Object e) {
    if (e is PostgrestException) {
      debugPrint(
        '[InspectionRemote] $stepLabel Postgrest message=${e.message} '
        'code=${e.code} details=${e.details} hint=${e.hint}',
      );
    }
  }

  /// For UI debug only; session is enforced again inside [saveInspectionCompletion].
  static bool authSessionPresent() {
    try {
      return Supabase.instance.client.auth.currentSession != null;
    } catch (_) {
      return false;
    }
  }

  /// Only these keys are sent — matches `inspection_reports` columns (see scope doc).
  static Map<String, dynamic> buildInspectionReportInsertPayload({
    required String taskId,
    required String equipmentId,
    required List<Map<String, dynamic>> checklist,
    required Map<String, dynamic> measurementsRaw,
    required String commentText,
    required bool defectFound,
    required String defectDescription,
    required String defectPriorityWhenDefect,
    required int photoCount,
    required int audioCount,
  }) {
    final measurements = <String, dynamic>{};
    for (final key in const ['temperature', 'pressure', 'vibration']) {
      final v = measurementsRaw[key];
      if (v == null) {
        measurements[key] = '';
      } else if (v is num) {
        measurements[key] = v.toString();
      } else {
        measurements[key] = v.toString().trim();
      }
    }

    final desc = defectFound ? defectDescription.trim() : '';
    var priority = defectFound ? defectPriorityWhenDefect.trim().toLowerCase() : 'low';
    if (!const {'low', 'medium', 'high'}.contains(priority)) {
      priority = 'low';
    }

    return <String, dynamic>{
      'task_id': taskId,
      'equipment_id': equipmentId,
      'checklist': checklist,
      'measurements': measurements,
      'comment_text': commentText.trim(),
      'defect_found': defectFound,
      'defect_description': desc,
      'defect_priority': priority,
      'photo_count': photoCount,
      'audio_count': audioCount,
    };
  }

  static InspectionSaveException _mapReportInsertException(
    Object e,
    Map<String, dynamic> insertPayload,
  ) {
    if (e is PostgrestException) {
      debugPrint(
        '[InspectionRemote] C_insertInspectionReportsRow payloadThatFailed=$insertPayload',
      );
    }
    if (_looksLikePermissionDenied(e)) {
      return InspectionSaveException(
        InspectionSaveFailure.permissionDenied,
        stepDescription: 'insertInspectionReport',
        cause: e,
      );
    }
    if (_looksLikeNoRowReturnedError(e)) {
      return InspectionSaveException(
        InspectionSaveFailure.reportReturningEmpty,
        stepDescription: 'insertInspectionReport',
        cause: e,
      );
    }
    if (_looksLikeRowLevelSecurityBlock(e)) {
      return InspectionSaveException(
        InspectionSaveFailure.reportRowLevelSecurityBlocked,
        stepDescription: 'insertInspectionReport',
        cause: e,
      );
    }
    if (_looksLikeForeignKeyViolation(e)) {
      return InspectionSaveException(
        InspectionSaveFailure.reportForeignKeyViolation,
        stepDescription: 'insertInspectionReport',
        cause: e,
      );
    }
    return InspectionSaveException(
      InspectionSaveFailure.reportInsertFailed,
      stepDescription: 'insertInspectionReport',
      cause: e,
    );
  }

  static String _imageExtensionForLocalPath(String localPath) {
    final lower = localPath.toLowerCase();
    if (lower.endsWith('.png')) return 'png';
    if (lower.endsWith('.webp')) return 'webp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'heic';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg';
    return 'jpg';
  }

  static String _imageContentTypeForLocalPath(String localPath) {
    final lower = localPath.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
    return 'image/jpeg';
  }

  Future<void> _uploadFile({
    required String objectPath,
    required File file,
    required String contentType,
  }) async {
    await _client.storage.from(AppEnv.inspectionMediaBucket).upload(
          objectPath,
          file,
          fileOptions: FileOptions(contentType: contentType, upsert: true),
        );
  }

  Future<void> _insertInspectionMediaRow({
    required String taskId,
    required String equipmentId,
    required String mediaType,
    required String filePath,
    required String fileName,
    required String? mimeType,
    required int? sizeBytes,
  }) async {
    if (filePath.isEmpty || fileName.isEmpty) {
      debugPrint(
        '[InspectionRemote] FAIL insertInspectionMediaRow empty filePath or fileName',
      );
      throw InspectionSaveException(
        InspectionSaveFailure.mediaMetadataFailedAfterReportSaved,
        stepDescription: 'emptyPathOrName',
      );
    }

    final payload = <String, dynamic>{
      'task_id': taskId,
      'equipment_id': equipmentId,
      'media_type': mediaType,
      'file_path': filePath,
      'file_name': fileName,
      'mime_type': mimeType,
      'size_bytes': sizeBytes,
    };

    debugPrint(
      '[InspectionRemote] insertInspectionMediaRow step=E_mediaMetadata '
      'task_id=$taskId equipment_id=$equipmentId media_type=$mediaType '
      'file_path=$filePath file_name=$fileName mime_type=$mimeType size_bytes=$sizeBytes',
    );

    try {
      await _client.from('inspection_media').insert(payload);
      debugPrint(
        '[InspectionRemote] insertInspectionMediaRow ok media_type=$mediaType',
      );
    } on PostgrestException catch (e, st) {
      debugPrint(
        '[InspectionRemote] FAIL insertInspectionMediaRow PostgrestException '
        'code=${e.code} message=${e.message} details=${e.details} hint=${e.hint}\n$st',
      );
      debugPrint(
        '[InspectionRemote] FAIL insertInspectionMediaRow payloadThatFailed=$payload',
      );
      _logPostgrestDetail('insertInspectionMediaRow', e);
      throw InspectionSaveException(
        InspectionSaveFailure.mediaMetadataFailedAfterReportSaved,
        stepDescription: mediaType,
        cause: e,
      );
    } catch (e, st) {
      debugPrint(
        '[InspectionRemote] FAIL insertInspectionMediaRow error=$e\n$st',
      );
      debugPrint(
        '[InspectionRemote] FAIL insertInspectionMediaRow payloadThatFailed=$payload',
      );
      throw InspectionSaveException(
        InspectionSaveFailure.mediaMetadataFailedAfterReportSaved,
        stepDescription: mediaType,
        cause: e,
      );
    }
  }

  static bool _looksLikePermissionDenied(Object e) {
    if (e is PlatformException) {
      final c = e.code.toLowerCase();
      return c.contains('permission') || c == 'permission_denied';
    }
    final msg = e.toString().toLowerCase();
    return msg.contains('permission_denied') || msg.contains('permission denied');
  }

  static String _postgrestCombinedLower(PostgrestException e) {
    final d = e.details;
    final ds = d == null ? '' : d.toString();
    final h = e.hint ?? '';
    return '${e.message} $h $ds'.toLowerCase();
  }

  static bool _looksLikeForeignKeyViolation(Object e) {
    if (e is PostgrestException) {
      final code = e.code ?? '';
      if (code == '23503') return true;
      final combined = _postgrestCombinedLower(e);
      if (combined.contains('foreign key')) return true;
      if (combined.contains('violates foreign key')) return true;
      if (combined.contains('is not present in table')) return true;
    }
    return false;
  }

  static bool _looksLikeRowLevelSecurityBlock(Object e) {
    if (e is PostgrestException) {
      final code = e.code ?? '';
      if (code == '42501' || code == '401' || code == '403') return true;
      final combined = _postgrestCombinedLower(e);
      if (combined.contains('row-level security')) return true;
      if (combined.contains('violates row-level security')) return true;
      if (combined.contains('permission denied')) return true;
      if (combined.contains('policy')) return true;
      if (combined.contains(' jwt')) return true;
      if (combined.contains('rls')) return true;
    }
    final s = e.toString().toLowerCase();
    return s.contains('row-level security') || s.contains('permission denied');
  }

  /// PostgREST `.single()` when 0 rows (e.g. INSERT ok but RETURNING hidden by RLS SELECT).
  static bool _looksLikeNoRowReturnedError(Object e) {
    if (e is PostgrestException) {
      final code = e.code ?? '';
      if (code == '406') return true;
      final combined = _postgrestCombinedLower(e);
      if (combined.contains('no) rows returned')) return true;
      if (combined.contains('0 rows')) return true;
      if (combined.contains('json object requested')) return true;
    }
    final s = e.toString().toLowerCase();
    return s.contains('406') && s.contains('rows');
  }

  /// Anonymous JWT is required when RLS policies target `authenticated`.
  static Future<void> requireWritableAuthSession() async {
    final existing = Supabase.instance.client.auth.currentSession;
    if (existing != null) {
      debugPrint(
        '[InspectionRemote] A_ensureAuthSession ok existingUserId=${existing.user.id}',
      );
      return;
    }
    debugPrint('[InspectionRemote] A_ensureAuthSession signInAnonymously');
    try {
      await Supabase.instance.client.auth.signInAnonymously();
    } catch (e, st) {
      debugPrint('[InspectionRemote] FAIL A_ensureAuthSession error=$e\n$st');
      throw InspectionSaveException(
        InspectionSaveFailure.supabaseAnonymousSignInFailed,
        stepDescription: 'signInAnonymously',
        cause: e,
      );
    }
    final after = Supabase.instance.client.auth.currentSession;
    if (after == null) {
      debugPrint(
        '[InspectionRemote] FAIL A_ensureAuthSession sessionStillNullAfterSignIn',
      );
      throw InspectionSaveException(
        InspectionSaveFailure.supabaseAnonymousSignInFailed,
        stepDescription: 'sessionStillNullAfterSignIn',
      );
    }
    debugPrint(
      '[InspectionRemote] A_ensureAuthSession ok userId=${after.user.id}',
    );
  }

  Future<Map<String, dynamic>> saveInspectionCompletion({
    required String taskId,
    required String equipmentId,
    required List<Map<String, dynamic>> checklist,
    required Map<String, dynamic> measurements,
    required String comment,
    required bool defectFound,
    required String defectDescription,
    required String defectPriority,
    required List<XFile> photos,
    required String? audioFilePath,
  }) async {
    if (!isSupabaseClientReady()) {
      debugPrint('[InspectionRemote] FAIL init supabaseNotReady');
      throw InspectionSaveException(InspectionSaveFailure.supabaseNotConfigured);
    }

    await requireWritableAuthSession();

    final effectiveTaskId =
        AppEnv.inspectionReportTaskIdOverride.trim().isNotEmpty
            ? AppEnv.inspectionReportTaskIdOverride.trim()
            : taskId.trim();
    final effectiveEquipmentId =
        AppEnv.inspectionReportEquipmentIdOverride.trim().isNotEmpty
            ? AppEnv.inspectionReportEquipmentIdOverride.trim()
            : equipmentId.trim();

    if (effectiveTaskId.isEmpty) {
      debugPrint('[InspectionRemote] FAIL validateIds missing task_id');
      throw InspectionSaveException(InspectionSaveFailure.missingTaskId);
    }
    if (effectiveEquipmentId.isEmpty) {
      debugPrint('[InspectionRemote] FAIL validateIds missing equipment_id');
      throw InspectionSaveException(InspectionSaveFailure.missingEquipmentId);
    }

    debugPrint(
      '[InspectionRemote] resolveIds taskId=$effectiveTaskId '
      'equipmentId=$effectiveEquipmentId '
      'overrideTask=${AppEnv.inspectionReportTaskIdOverride.isNotEmpty} '
      'overrideEquip=${AppEnv.inspectionReportEquipmentIdOverride.isNotEmpty}',
    );

    debugPrint(
      '[InspectionRemote] collectLocalPhotoPaths count=${photos.length}',
    );

    for (var i = 0; i < photos.length; i++) {
      final path = photos[i].path;
      final file = File(path);
      final exists = await file.exists();
      if (!exists) {
        debugPrint(
          '[InspectionRemote] FAIL collectLocalPhotoPaths index=$i path=$path',
        );
        throw InspectionSaveException(
          InspectionSaveFailure.localPhotoMissing,
          stepDescription: 'photo index $i',
        );
      }
    }

    final trimmedAudio = audioFilePath?.trim();
    final hasAudio = trimmedAudio != null && trimmedAudio.isNotEmpty;
    debugPrint('[InspectionRemote] prepareAudioLocalFile hasAudio=$hasAudio');

    if (hasAudio) {
      final audioFile = File(trimmedAudio);
      if (!await audioFile.exists()) {
        debugPrint(
          '[InspectionRemote] FAIL prepareAudioLocalFile missing path=$trimmedAudio',
        );
        throw InspectionSaveException(InspectionSaveFailure.recordingNotFound);
      }
    }

    final photoCount = photos.length;
    final audioCount = hasAudio ? 1 : 0;

    final insertPayload = buildInspectionReportInsertPayload(
      taskId: effectiveTaskId,
      equipmentId: effectiveEquipmentId,
      checklist: checklist,
      measurementsRaw: measurements,
      commentText: comment,
      defectFound: defectFound,
      defectDescription: defectDescription,
      defectPriorityWhenDefect: defectPriority,
      photoCount: photoCount,
      audioCount: audioCount,
    );

    final sessionOk =
        Supabase.instance.client.auth.currentSession != null;
    debugPrint(
      '[InspectionRemote] B_prepareReportPayload preInsertDebug '
      'taskId=$effectiveTaskId equipmentId=$effectiveEquipmentId '
      'checklist=$checklist measurements=${insertPayload['measurements']} '
      'defectFound=$defectFound defectDescription=${insertPayload['defect_description']} '
      'defectPriority=${insertPayload['defect_priority']} '
      'photoCount=$photoCount audioPath=${trimmedAudio ?? "null"} '
      'sessionPresent=$sessionOk',
    );
    debugPrint('[InspectionRemote] B_prepareReportPayload finalInsertPayload=$insertPayload');

    debugPrint('[InspectionRemote] C_insertInspectionReportsRow begin');

    late final Map<String, dynamic> reportRow;
    try {
      final raw = await _client
          .from('inspection_reports')
          .insert(insertPayload)
          .select('id');
      if (raw.isEmpty) {
        debugPrint(
          '[InspectionRemote] FAIL C_insertInspectionReportsRow emptySelect '
          '— add SELECT policy on inspection_reports for the same role as INSERT.',
        );
        throw InspectionSaveException(
          InspectionSaveFailure.reportReturningEmpty,
          stepDescription: 'insertInspectionReport select returned 0 rows',
        );
      }
      reportRow = Map<String, dynamic>.from(raw.first as Map);
      debugPrint(
        '[InspectionRemote] C_insertInspectionReportsRow ok id=${reportRow['id']}',
      );
    } on InspectionSaveException {
      rethrow;
    } on PostgrestException catch (e, st) {
      debugPrint(
        '[InspectionRemote] FAIL C_insertInspectionReportsRow PostgrestException '
        'code=${e.code} message=${e.message} details=${e.details} hint=${e.hint}\n$st',
      );
      debugPrint(
        '[InspectionRemote] FAIL C_insertInspectionReportsRow payloadThatFailed=$insertPayload',
      );
      _logPostgrestDetail('C_insertInspectionReportsRow', e);
      throw _mapReportInsertException(e, insertPayload);
    } catch (e, st) {
      debugPrint('[InspectionRemote] FAIL C_insertInspectionReportsRow error=$e\n$st');
      debugPrint(
        '[InspectionRemote] FAIL C_insertInspectionReportsRow payloadThatFailed=$insertPayload',
      );
      throw _mapReportInsertException(e, insertPayload);
    }

    final ts = DateTime.now().millisecondsSinceEpoch;

    for (var i = 0; i < photos.length; i++) {
      final localPath = photos[i].path;
      final file = File(localPath);
      final ext = _imageExtensionForLocalPath(localPath);
      final contentType = _imageContentTypeForLocalPath(localPath);
      final filePath =
          'photos/$effectiveTaskId/$effectiveEquipmentId/${ts}_$i.$ext';
      final fileName = '${ts}_$i.$ext';

      debugPrint(
        '[InspectionRemote] D_uploadPhotoToStorage begin i=$i path=$filePath',
      );

      try {
        await _uploadFile(
          objectPath: filePath,
          file: file,
          contentType: contentType,
        );
        debugPrint('[InspectionRemote] D_uploadPhotoToStorage ok i=$i');
      } catch (e, st) {
        debugPrint(
          '[InspectionRemote] FAIL D_uploadPhotoToStorage i=$i error=$e\n$st',
        );
        if (_looksLikePermissionDenied(e)) {
          throw InspectionSaveException(
            InspectionSaveFailure.permissionDenied,
            stepDescription: 'uploadPhoto $i',
            cause: e,
          );
        }
        throw InspectionSaveException(
          InspectionSaveFailure.photoUploadFailed,
          stepDescription: 'photo index $i',
          cause: e,
        );
      }

      if (filePath.isEmpty) {
        throw InspectionSaveException(
          InspectionSaveFailure.photoUploadFailed,
          stepDescription: 'empty storage path after upload',
        );
      }

      int? sizeBytes;
      try {
        sizeBytes = await file.length();
      } catch (_) {
        sizeBytes = null;
      }

      await _insertInspectionMediaRow(
        taskId: effectiveTaskId,
        equipmentId: effectiveEquipmentId,
        mediaType: 'photo',
        filePath: filePath,
        fileName: fileName,
        mimeType: contentType,
        sizeBytes: sizeBytes,
      );
    }

    if (audioCount == 1 && trimmedAudio != null) {
      final file = File(trimmedAudio);
      const audioMime = 'audio/mp4';
      final filePath =
          'audio/$effectiveTaskId/$effectiveEquipmentId/$ts.m4a';
      final fileName = '$ts.m4a';

      debugPrint(
        '[InspectionRemote] F_uploadAudioToStorage begin path=$filePath',
      );

      try {
        await _uploadFile(
          objectPath: filePath,
          file: file,
          contentType: audioMime,
        );
        debugPrint('[InspectionRemote] F_uploadAudioToStorage ok');
      } catch (e, st) {
        debugPrint(
          '[InspectionRemote] FAIL F_uploadAudioToStorage error=$e\n$st',
        );
        if (_looksLikePermissionDenied(e)) {
          throw InspectionSaveException(
            InspectionSaveFailure.permissionDenied,
            stepDescription: 'uploadAudio',
            cause: e,
          );
        }
        throw InspectionSaveException(
          InspectionSaveFailure.audioUploadFailed,
          stepDescription: filePath,
          cause: e,
        );
      }

      if (filePath.isEmpty) {
        throw InspectionSaveException(
          InspectionSaveFailure.audioUploadFailed,
          stepDescription: 'empty storage path after upload',
        );
      }

      int? sizeBytes;
      try {
        sizeBytes = await file.length();
      } catch (_) {
        sizeBytes = null;
      }

      await _insertInspectionMediaRow(
        taskId: effectiveTaskId,
        equipmentId: effectiveEquipmentId,
        mediaType: 'audio',
        filePath: filePath,
        fileName: fileName,
        mimeType: audioMime,
        sizeBytes: sizeBytes,
      );
    }

    return reportRow;
  }
}
