/// Typed failure for inspection remote save (English identifiers only).
enum InspectionSaveFailure {
  supabaseNotConfigured,
  supabaseAnonymousSignInFailed,
  missingTaskId,
  missingEquipmentId,
  preparePayloadFailed,
  localPhotoMissing,
  photoUploadFailed,
  audioUploadFailed,
  reportInsertFailed,
  reportReturningEmpty,
  reportForeignKeyViolation,
  reportRowLevelSecurityBlocked,
  mediaInsertFailed,
  /// Report row already persisted; only `inspection_media` insert failed.
  mediaMetadataFailedAfterReportSaved,
  databaseSaveFailed,
  recordingNotFound,
  permissionDenied,
  unknown,
}

class InspectionSaveException implements Exception {
  InspectionSaveException(
    this.failure, {
    this.stepDescription,
    this.cause,
  });

  final InspectionSaveFailure failure;
  final String? stepDescription;
  final Object? cause;

  @override
  String toString() =>
      'InspectionSaveException($failure'
      '${stepDescription != null ? ': $stepDescription' : ''}, cause: $cause)';
}
