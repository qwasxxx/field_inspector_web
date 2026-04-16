import 'app_language.dart';
import 'demo_task_public_state.dart';

class AppStrings {
  const AppStrings({
    required this.language,
    required this.loginTitle,
    required this.loginSubtitle,
    required this.loginDescription,
    required this.loginContinueToTasks,
    required this.tasksAppTitle,
    required this.tasksSectionAssignedRounds,
    required this.statusInProgress,
    required this.statusPending,
    required this.statusCompleted,
    required this.taskDetailAppTitle,
    required this.labelObject,
    required this.labelStatus,
    required this.labelShift,
    required this.sectionInspectionRoute,
    required this.startRoundButton,
    required this.inspectionExecutionAppTitle,
    required this.labelTask,
    required this.labelProgress,
    required this.sectionInspectionObjects,
    required this.openCurrentObjectButton,
    required this.snackbarObjectInspectionNext,
    required this.badgeCurrent,
    required this.badgePending,
    required this.languageMenuLabel,
    required this.langNameRu,
    required this.langNameTr,
    required this.langNameEn,
    required this.mockShift0,
    required this.mockShift1,
    required this.mockShift2,
    required this.mockTask0Title,
    required this.mockTask0Area,
    required this.mockTask1Title,
    required this.mockTask1Area,
    required this.mockTask2Title,
    required this.mockTask2Area,
    required this.r0i0n,
    required this.r0i0s,
    required this.r0i1n,
    required this.r0i1s,
    required this.r0i2n,
    required this.r0i2s,
    required this.r0i3n,
    required this.r0i3s,
    required this.r1i0n,
    required this.r1i0s,
    required this.r1i1n,
    required this.r1i1s,
    required this.r1i2n,
    required this.r1i2s,
    required this.r1i3n,
    required this.r1i3s,
    required this.r1i4n,
    required this.r1i4s,
    required this.r2i0n,
    required this.r2i0s,
    required this.r2i1n,
    required this.r2i1s,
    required this.r2i2n,
    required this.r2i2s,
    required this.r2i3n,
    required this.r2i3s,
    required this.inspectionObjectAppTitle,
    required this.labelZone,
    required this.sectionChecklist,
    required this.checklistItemVisualOk,
    required this.checklistItemNoLeaks,
    required this.checklistItemNoNoise,
    required this.checklistItemAccessClear,
    required this.sectionNote,
    required this.noteHint,
    required this.saveLocallyButton,
    required this.completeObjectButton,
    required this.snackbarLocalSaveSuccess,
    required this.sectionMeasurements,
    required this.labelMeasurementTemperature,
    required this.labelMeasurementPressure,
    required this.labelMeasurementVibration,
    required this.hintMeasurementValue,
    required this.unitCelsius,
    required this.unitPressureBar,
    required this.unitVibrationMmS,
    required this.sectionDefect,
    required this.defectToggleLabel,
    required this.labelDefectDescription,
    required this.hintDefectDescription,
    required this.labelDefectPriority,
    required this.priorityLow,
    required this.priorityMedium,
    required this.priorityHigh,
    required this.routeStatusHasIssue,
    required this.sectionPhotoEvidence,
    required this.addPhotoButton,
    required this.photoItemSubtitleLocal,
    required this.removePhotoButton,
    required this.snackbarPhotoLimitReached,
    required this.photoPreviewClose,
    required this.photoPreviewDemoCaption,
    required this.voiceNoteSectionTitle,
    required this.voiceStartRecording,
    required this.voiceStopRecording,
    required this.voiceDeleteRecording,
    required this.voiceStateRecording,
    required this.voiceStateRecorded,
    required this.snackbarPhotoPickerCancelled,
    required this.snackbarPhotoPickerFailed,
    required this.snackbarMicrophoneDenied,
    required this.snackbarVoiceNoteAdded,
    required this.snackbarUploadFailed,
    required this.snackbarUploadSuccess,
    required this.errorSupabaseNotConfigured,
    required this.errorAuthAnonymousFailed,
    required this.errorMissingTaskId,
    required this.errorMissingEquipmentId,
    required this.errorReportInsertFailed,
    required this.errorReportReturningEmpty,
    required this.errorReportForeignKey,
    required this.errorReportRlsBlocked,
    required this.errorMediaInsertFailed,
    required this.errorMediaMetadataAfterReportOk,
    required this.errorPhotoUploadFailed,
    required this.errorAudioUploadFailed,
    required this.errorDatabaseSaveFailed,
    required this.errorRecordingNotFound,
    required this.errorSaveFailed,
    required this.errorUnknownSave,
    required this.errorPermissionDenied,
    required this.completeObjectInProgress,
    required this.appMaterialTitle,
    required this.inspectionTaskSummaryTitle,
    required this.sectionSummaryResults,
    required this.labelSummaryTotalObjects,
    required this.labelSummaryCompletedOk,
    required this.labelSummaryWithIssues,
    required this.summaryBackToTasksButton,
    required this.statusCompletedWithIssues,
    required this.taskListProgressNotStarted,
    required this.taskListProgressActive,
    required this.taskListProgressCompletedFull,
    required this.taskListProgressCompletedFullWithIssues,
    required this.taskOpenResultButton,
    required this.completedReportAppTitle,
    required this.sectionCompletedReportInspectionSummary,
    required this.labelReportPhotoCount,
    required this.labelReportAudioCount,
    required this.labelReportObjectsWithDefects,
    required this.taskDetailSectionOutcome,
    required this.labelFinalTaskState,
    required this.completedReportNotAvailable,
    required this.labelDueAt,
    required this.tasksUntitledTask,
    required this.tasksScheduleNotSpecified,
    required this.tasksLoading,
    required this.tasksLoadFailed,
    required this.tasksShowingDemoFallback,
    required this.tasksNoWorkerIdentity,
    required this.tasksSupabaseNotReady,
    required this.tasksNoAssignments,
    required this.tasksSectionDemoTasks,
    required this.tasksDemoSectionDebugHint,
    required this.workerDevWorkerIdBadge,
    required this.workerProfileNotInDatabase,
    required this.sectionTaskInstructions,
    required this.tasksRetry,
    required this.workerSectionTitle,
    required this.workerProfileNameLabel,
    required this.workerProfileCodeLabel,
    required this.taskRequestScreenTitle,
    required this.taskRequestActionTooltip,
    required this.labelRequestTitle,
    required this.hintRequestTitle,
    required this.labelRequestSiteName,
    required this.hintRequestSiteName,
    required this.labelRequestAreaName,
    required this.hintRequestAreaName,
    required this.labelRequestDescription,
    required this.hintRequestDescription,
    required this.labelRequestPriority,
    required this.taskRequestSubmitButton,
    required this.taskRequestSuccess,
    required this.taskRequestErrorNoWorker,
    required this.taskRequestErrorNotReady,
    required this.taskRequestErrorInsert,
    required this.labelTaskDuration,
  });

  final AppLanguage language;
  final String loginTitle;
  final String loginSubtitle;
  final String loginDescription;
  final String loginContinueToTasks;
  final String tasksAppTitle;
  final String tasksSectionAssignedRounds;
  final String statusInProgress;
  final String statusPending;
  final String statusCompleted;
  final String taskDetailAppTitle;
  final String labelObject;
  final String labelStatus;
  final String labelShift;
  final String sectionInspectionRoute;
  final String startRoundButton;
  final String inspectionExecutionAppTitle;
  final String labelTask;
  final String labelProgress;
  final String sectionInspectionObjects;
  final String openCurrentObjectButton;
  final String snackbarObjectInspectionNext;
  final String badgeCurrent;
  final String badgePending;
  final String languageMenuLabel;
  final String langNameRu;
  final String langNameTr;
  final String langNameEn;
  final String mockShift0;
  final String mockShift1;
  final String mockShift2;
  final String mockTask0Title;
  final String mockTask0Area;
  final String mockTask1Title;
  final String mockTask1Area;
  final String mockTask2Title;
  final String mockTask2Area;
  final String r0i0n;
  final String r0i0s;
  final String r0i1n;
  final String r0i1s;
  final String r0i2n;
  final String r0i2s;
  final String r0i3n;
  final String r0i3s;
  final String r1i0n;
  final String r1i0s;
  final String r1i1n;
  final String r1i1s;
  final String r1i2n;
  final String r1i2s;
  final String r1i3n;
  final String r1i3s;
  final String r1i4n;
  final String r1i4s;
  final String r2i0n;
  final String r2i0s;
  final String r2i1n;
  final String r2i1s;
  final String r2i2n;
  final String r2i2s;
  final String r2i3n;
  final String r2i3s;
  final String inspectionObjectAppTitle;
  final String labelZone;
  final String sectionChecklist;
  final String checklistItemVisualOk;
  final String checklistItemNoLeaks;
  final String checklistItemNoNoise;
  final String checklistItemAccessClear;
  final String sectionNote;
  final String noteHint;
  final String saveLocallyButton;
  final String completeObjectButton;
  final String snackbarLocalSaveSuccess;
  final String sectionMeasurements;
  final String labelMeasurementTemperature;
  final String labelMeasurementPressure;
  final String labelMeasurementVibration;
  final String hintMeasurementValue;
  final String unitCelsius;
  final String unitPressureBar;
  final String unitVibrationMmS;
  final String sectionDefect;
  final String defectToggleLabel;
  final String labelDefectDescription;
  final String hintDefectDescription;
  final String labelDefectPriority;
  final String priorityLow;
  final String priorityMedium;
  final String priorityHigh;
  final String routeStatusHasIssue;
  final String sectionPhotoEvidence;
  final String addPhotoButton;
  final String photoItemSubtitleLocal;
  final String removePhotoButton;
  final String snackbarPhotoLimitReached;
  final String photoPreviewClose;
  final String photoPreviewDemoCaption;
  final String voiceNoteSectionTitle;
  final String voiceStartRecording;
  final String voiceStopRecording;
  final String voiceDeleteRecording;
  final String voiceStateRecording;
  final String voiceStateRecorded;
  final String snackbarPhotoPickerCancelled;
  final String snackbarPhotoPickerFailed;
  final String snackbarMicrophoneDenied;
  final String snackbarVoiceNoteAdded;
  final String snackbarUploadFailed;
  final String snackbarUploadSuccess;
  final String errorSupabaseNotConfigured;
  final String errorAuthAnonymousFailed;
  final String errorMissingTaskId;
  final String errorMissingEquipmentId;
  final String errorReportInsertFailed;
  final String errorReportReturningEmpty;
  final String errorReportForeignKey;
  final String errorReportRlsBlocked;
  final String errorMediaInsertFailed;
  final String errorMediaMetadataAfterReportOk;
  final String errorPhotoUploadFailed;
  final String errorAudioUploadFailed;
  final String errorDatabaseSaveFailed;
  final String errorRecordingNotFound;
  final String errorSaveFailed;
  final String errorUnknownSave;
  final String errorPermissionDenied;
  final String completeObjectInProgress;
  final String appMaterialTitle;
  final String inspectionTaskSummaryTitle;
  final String sectionSummaryResults;
  final String labelSummaryTotalObjects;
  final String labelSummaryCompletedOk;
  final String labelSummaryWithIssues;
  final String summaryBackToTasksButton;
  final String statusCompletedWithIssues;
  final String taskListProgressNotStarted;
  final String taskListProgressActive;
  final String taskListProgressCompletedFull;
  final String taskListProgressCompletedFullWithIssues;
  final String taskOpenResultButton;
  final String completedReportAppTitle;
  final String sectionCompletedReportInspectionSummary;
  final String labelReportPhotoCount;
  final String labelReportAudioCount;
  final String labelReportObjectsWithDefects;
  final String taskDetailSectionOutcome;
  final String labelFinalTaskState;
  final String completedReportNotAvailable;
  final String labelDueAt;
  final String tasksUntitledTask;
  final String tasksScheduleNotSpecified;
  final String tasksLoading;
  final String tasksLoadFailed;
  final String tasksShowingDemoFallback;
  final String tasksNoWorkerIdentity;
  final String tasksSupabaseNotReady;
  final String tasksNoAssignments;
  final String tasksSectionDemoTasks;
  final String tasksDemoSectionDebugHint;
  final String workerDevWorkerIdBadge;
  final String workerProfileNotInDatabase;
  final String sectionTaskInstructions;
  final String tasksRetry;
  final String workerSectionTitle;
  final String workerProfileNameLabel;
  final String workerProfileCodeLabel;
  final String taskRequestScreenTitle;
  final String taskRequestActionTooltip;
  final String labelRequestTitle;
  final String hintRequestTitle;
  final String labelRequestSiteName;
  final String hintRequestSiteName;
  final String labelRequestAreaName;
  final String hintRequestAreaName;
  final String labelRequestDescription;
  final String hintRequestDescription;
  final String labelRequestPriority;
  final String taskRequestSubmitButton;
  final String taskRequestSuccess;
  final String taskRequestErrorNoWorker;
  final String taskRequestErrorNotReady;
  final String taskRequestErrorInsert;
  final String labelTaskDuration;

  String taskDurationMinutesValue(int minutes) {
    switch (language) {
      case AppLanguage.ru:
        return '$minutes мин';
      case AppLanguage.tr:
        return '$minutes dk';
      case AppLanguage.en:
        return '$minutes min';
    }
  }

  String inspectionTaskRemoteStatusCaption(String? raw) {
    return taskStateLabel(demoTaskStateFromRemoteInspectionStatus(raw));
  }

  String taskStateLabel(DemoTaskPublicState state) {
    switch (state) {
      case DemoTaskPublicState.pending:
        return statusPending;
      case DemoTaskPublicState.inProgress:
        return statusInProgress;
      case DemoTaskPublicState.completed:
        return statusCompleted;
      case DemoTaskPublicState.completedWithIssues:
        return statusCompletedWithIssues;
    }
  }

  String taskListProgressLine({
    required DemoTaskPublicState state,
    required int routeTotal,
  }) {
    switch (state) {
      case DemoTaskPublicState.pending:
        return '$taskListProgressNotStarted · $routeTotal';
      case DemoTaskPublicState.inProgress:
        return '$taskListProgressActive · $routeTotal';
      case DemoTaskPublicState.completed:
        return taskListProgressCompletedFull;
      case DemoTaskPublicState.completedWithIssues:
        return taskListProgressCompletedFullWithIssues;
    }
  }

  String progressObjectsChecked(int completed, int total) {
    switch (language) {
      case AppLanguage.ru:
        return '$completed из $total объектов проверено';
      case AppLanguage.tr:
        return '$total nesneden $completed tanesi kontrol edildi';
      case AppLanguage.en:
        return '$completed of $total objects checked';
    }
  }

  String mockPhotoTitle(int ordinal) {
    switch (language) {
      case AppLanguage.ru:
        return 'Фото $ordinal';
      case AppLanguage.tr:
        return 'Fotoğraf $ordinal';
      case AppLanguage.en:
        return 'Photo $ordinal';
    }
  }
}

AppStrings stringsFor(AppLanguage lang) {
  switch (lang) {
    case AppLanguage.ru:
      return _ru;
    case AppLanguage.tr:
      return _tr;
    case AppLanguage.en:
      return _en;
  }
}

const AppStrings _ru = AppStrings(
  language: AppLanguage.ru,
  loginTitle: 'Мобильный обходчик',
  loginSubtitle: 'Контроль оборудования и обходы',
  loginDescription:
      'Режим разработки: полноценный вход исполнителя ещё не подключён. Список назначенных задач появится после настройки учётной записи и Supabase.',
  loginContinueToTasks: 'Перейти к задачам',
  tasksAppTitle: 'Задачи',
  tasksSectionAssignedRounds: 'Назначенные обходы',
  statusInProgress: 'В процессе',
  statusPending: 'Ожидает',
  statusCompleted: 'Выполнено',
  taskDetailAppTitle: 'Детали задачи',
  labelObject: 'Объект',
  labelStatus: 'Статус',
  labelShift: 'Смена',
  sectionInspectionRoute: 'Маршрут обхода',
  startRoundButton: 'Начать обход',
  inspectionExecutionAppTitle: 'Выполнение обхода',
  labelTask: 'Задача',
  labelProgress: 'Прогресс',
  sectionInspectionObjects: 'Объекты обхода',
  openCurrentObjectButton: 'Открыть текущий объект',
  snackbarObjectInspectionNext:
      'Экран осмотра объекта будет добавлен следующим шагом',
  badgeCurrent: 'Текущий',
  badgePending: 'Ожидает',
  languageMenuLabel: 'Язык',
  langNameRu: 'Русский',
  langNameTr: 'Türkçe',
  langNameEn: 'English',
  mockShift0: 'Смена А, 16.04.2026',
  mockShift1: 'Смена Б, 16.04.2026',
  mockShift2: 'Смена А, 15.04.2026',
  mockTask0Title: 'Обход котельной №1',
  mockTask0Area: 'Котельная, зона А',
  mockTask1Title: 'Плановый осмотр трансформаторной',
  mockTask1Area: 'ТП-12',
  mockTask2Title: 'Обход насосной станции',
  mockTask2Area: 'Насосная — корпус 2',
  r0i0n: 'Насос Н-12',
  r0i0s: 'Котельная, линия подачи',
  r0i1n: 'Клапан К-3',
  r0i1s: 'Зона А, узел регулировки',
  r0i2n: 'Датчик температуры T-7',
  r0i2s: 'Коллектор горячей воды',
  r0i3n: 'Щит управления ШУ-2',
  r0i3s: 'Помещение автоматики',
  r1i0n: 'Силовой трансформатор Т-1',
  r1i0s: 'ТП-12, камера 1',
  r1i1n: 'Разъединитель Р-5',
  r1i1s: 'Ячейка ввода',
  r1i2n: 'Датчик температуры T-7',
  r1i2s: 'Секция шин',
  r1i3n: 'Щит управления ШУ-2',
  r1i3s: 'Пульт оператора',
  r1i4n: 'Клапан К-3',
  r1i4s: 'Пожарный сегмент',
  r2i0n: 'Насос Н-12',
  r2i0s: 'Насосная, агрегат 1',
  r2i1n: 'Клапан К-3',
  r2i1s: 'Обвязка напорная',
  r2i2n: 'Датчик температуры T-7',
  r2i2s: 'Резервуар, датчик погружной',
  r2i3n: 'Щит управления ШУ-2',
  r2i3s: 'Корпус 2, щитовая',
  inspectionObjectAppTitle: 'Осмотр объекта',
  labelZone: 'Зона',
  sectionChecklist: 'Чек-лист',
  checklistItemVisualOk: 'Внешнее состояние в норме',
  checklistItemNoLeaks: 'Нет признаков протечек',
  checklistItemNoNoise: 'Нет постороннего шума',
  checklistItemAccessClear: 'Зона доступа свободна',
  sectionNote: 'Комментарий',
  noteHint: 'Добавьте комментарий',
  saveLocallyButton: 'Сохранить локально',
  completeObjectButton: 'Завершить объект',
  snackbarLocalSaveSuccess: 'Данные сохранены локально',
  sectionMeasurements: 'Показания',
  labelMeasurementTemperature: 'Температура',
  labelMeasurementPressure: 'Давление',
  labelMeasurementVibration: 'Вибрация',
  hintMeasurementValue: 'Введите значение',
  unitCelsius: '°C',
  unitPressureBar: 'бар',
  unitVibrationMmS: 'мм/с',
  sectionDefect: 'Дефект',
  defectToggleLabel: 'Обнаружен дефект',
  labelDefectDescription: 'Описание',
  hintDefectDescription: 'Опишите проблему',
  labelDefectPriority: 'Приоритет',
  priorityLow: 'Низкий',
  priorityMedium: 'Средний',
  priorityHigh: 'Высокий',
  routeStatusHasIssue: 'Есть проблема',
  sectionPhotoEvidence: 'Фотофиксация',
  addPhotoButton: 'Добавить фото',
  photoItemSubtitleLocal: 'Локальное вложение',
  removePhotoButton: 'Удалить',
  snackbarPhotoLimitReached: 'Можно добавить не более 3 фото',
  photoPreviewClose: 'Закрыть',
  photoPreviewDemoCaption: 'Демо-предпросмотр',
  voiceNoteSectionTitle: 'Голосовая заметка',
  voiceStartRecording: 'Начать запись',
  voiceStopRecording: 'Остановить',
  voiceDeleteRecording: 'Удалить запись',
  voiceStateRecording: 'Идёт запись…',
  voiceStateRecorded: 'Запись готова',
  snackbarPhotoPickerCancelled: 'Выбор фото отменён',
  snackbarPhotoPickerFailed: 'Не удалось выбрать фото',
  snackbarMicrophoneDenied: 'Нет доступа к микрофону',
  snackbarVoiceNoteAdded: 'Голосовая заметка добавлена',
  snackbarUploadFailed: 'Не удалось сохранить отчёт',
  snackbarUploadSuccess: 'Отчёт успешно сохранён',
  errorSupabaseNotConfigured: 'Сервер данных не настроен (Supabase)',
  errorAuthAnonymousFailed:
      'Не удалось войти анонимно (проверьте Anonymous в Supabase Auth)',
  errorMissingTaskId: 'Не указан идентификатор задачи',
  errorMissingEquipmentId: 'Не указан идентификатор оборудования',
  errorReportInsertFailed:
      'Не удалось записать отчёт (inspection_reports). См. лог Postgrest.',
  errorReportReturningEmpty:
      'Сервер не вернул строку отчёта. Добавьте политику SELECT для inspection_reports (часто из‑за RLS).',
  errorReportForeignKey:
      'Задача или оборудование не найдены в базе (проверьте id или данные)',
  errorReportRlsBlocked:
      'Запись запрещена политикой безопасности (RLS в Supabase)',
  errorMediaInsertFailed:
      'Не удалось записать медиа (inspection_media). См. лог Postgrest.',
  errorMediaMetadataAfterReportOk:
      'Отчёт сохранён, но не удалось записать медиа в базу. Проверьте inspection_media.',
  errorPhotoUploadFailed: 'Не удалось загрузить фото',
  errorAudioUploadFailed: 'Не удалось загрузить аудио',
  errorDatabaseSaveFailed: 'Ошибка записи в базу данных',
  errorRecordingNotFound: 'Файл записи не найден',
  errorSaveFailed: 'Сохранение не выполнено',
  errorUnknownSave: 'Неизвестная ошибка',
  errorPermissionDenied: 'Недостаточно разрешений',
  completeObjectInProgress: 'Отправка…',
  appMaterialTitle: 'Обход оборудования',
  inspectionTaskSummaryTitle: 'Обход завершён',
  sectionSummaryResults: 'Итоги маршрута',
  labelSummaryTotalObjects: 'Всего объектов',
  labelSummaryCompletedOk: 'Завершено без замечаний',
  labelSummaryWithIssues: 'С замечаниями',
  summaryBackToTasksButton: 'Вернуться к задачам',
  statusCompletedWithIssues: 'Завершено с замечаниями',
  taskListProgressNotStarted: 'Не начато',
  taskListProgressActive: 'В процессе',
  taskListProgressCompletedFull: 'Завершено: 100% (все объекты проверены)',
  taskListProgressCompletedFullWithIssues:
      'Завершено: 100% (есть замечания по маршруту)',
  taskOpenResultButton: 'Открыть результат',
  completedReportAppTitle: 'Результат обхода',
  sectionCompletedReportInspectionSummary: 'Сводка осмотра',
  labelReportPhotoCount: 'Фото',
  labelReportAudioCount: 'Аудио',
  labelReportObjectsWithDefects: 'Объектов с дефектом',
  taskDetailSectionOutcome: 'Итог обхода',
  labelFinalTaskState: 'Итоговый статус',
  completedReportNotAvailable: 'Результат обхода недоступен',
  labelDueAt: 'Срок',
  tasksUntitledTask: 'Задача без названия',
  tasksScheduleNotSpecified: 'Не указано',
  tasksLoading: 'Загрузка задач…',
  tasksLoadFailed: 'Не удалось загрузить задачи',
  tasksShowingDemoFallback: 'Показаны демо-задачи (нет назначений или ошибка сети)',
  tasksNoWorkerIdentity: 'Нет учётной записи исполнителя. Войдите или задайте DEV_WORKER_USER_ID',
  tasksSupabaseNotReady: 'Подключение к серверу недоступно',
  tasksNoAssignments: 'Нет назначенных задач',
  tasksSectionDemoTasks: 'Демо-задачи',
  tasksDemoSectionDebugHint:
      'Только в сборке отладки: пример данных, не реальные назначения.',
  workerDevWorkerIdBadge: 'Режим DEV_WORKER_USER_ID',
  workerProfileNotInDatabase: 'Профиль в базе не найден',
  sectionTaskInstructions: 'Инструкции',
  tasksRetry: 'Повторить',
  workerSectionTitle: 'Исполнитель',
  workerProfileNameLabel: 'ФИО',
  workerProfileCodeLabel: 'Табельный номер',
  taskRequestScreenTitle: 'Запрос на задачу',
  taskRequestActionTooltip: 'Запросить задачу',
  labelRequestTitle: 'Название',
  hintRequestTitle: 'Кратко опишите работу',
  labelRequestSiteName: 'Объект / площадка',
  hintRequestSiteName: 'Например, цех, станция',
  labelRequestAreaName: 'Зона / участок',
  hintRequestAreaName: 'Например, линия, корпус',
  labelRequestDescription: 'Описание',
  hintRequestDescription: 'Что нужно проверить или выполнить',
  labelRequestPriority: 'Приоритет',
  taskRequestSubmitButton: 'Отправить на согласование',
  taskRequestSuccess: 'Запрос отправлен руководителю',
  taskRequestErrorNoWorker: 'Нет учётной записи исполнителя',
  taskRequestErrorNotReady: 'Сервер недоступен',
  taskRequestErrorInsert: 'Не удалось отправить запрос',
  labelTaskDuration: 'Длительность выполнения',
);

const AppStrings _tr = AppStrings(
  language: AppLanguage.tr,
  loginTitle: 'Mobil saha denetçisi',
  loginSubtitle: 'Ekipman kontrolü ve turlar',
  loginDescription:
      'Geliştirme modu: tam işçi oturumu henüz yok. Atanan görevler, hesap ve Supabase yapılandırılınca listelenir.',
  loginContinueToTasks: 'Görevlere devam et',
  tasksAppTitle: 'Görevler',
  tasksSectionAssignedRounds: 'Atanmış görevler',
  statusInProgress: 'Devam ediyor',
  statusPending: 'Bekliyor',
  statusCompleted: 'Tamamlandı',
  taskDetailAppTitle: 'Görev ayrıntıları',
  labelObject: 'Tesis / konum',
  labelStatus: 'Durum',
  labelShift: 'Vardiya',
  sectionInspectionRoute: 'Kontrol güzergâhı',
  startRoundButton: 'Tura başla',
  inspectionExecutionAppTitle: 'Tur yürütme',
  labelTask: 'Görev',
  labelProgress: 'İlerleme',
  sectionInspectionObjects: 'Tur nesneleri',
  openCurrentObjectButton: 'Geçerli nesneyi aç',
  snackbarObjectInspectionNext:
      'Nesne inceleme ekranı bir sonraki adımda eklenecek',
  badgeCurrent: 'Geçerli',
  badgePending: 'Bekliyor',
  languageMenuLabel: 'Dil',
  langNameRu: 'Русский',
  langNameTr: 'Türkçe',
  langNameEn: 'English',
  mockShift0: 'Vardiya A, 16.04.2026',
  mockShift1: 'Vardiya B, 16.04.2026',
  mockShift2: 'Vardiya A, 15.04.2026',
  mockTask0Title: 'Kazan dairesi turu №1',
  mockTask0Area: 'Kazan dairesi, A bölgesi',
  mockTask1Title: 'Planlı trafo incelemesi',
  mockTask1Area: 'TP-12',
  mockTask2Title: 'Pompa istasyonu turu',
  mockTask2Area: 'Pompa istasyonu — bina 2',
  r0i0n: 'Pompa N-12',
  r0i0s: 'Kazan dairesi, besleme hattı',
  r0i1n: 'Vana K-3',
  r0i1s: 'A bölgesi, regülasyon ünitesi',
  r0i2n: 'Sıcaklık sensörü T-7',
  r0i2s: 'Sıcak su kollektörü',
  r0i3n: 'Kontrol panosu ŞU-2',
  r0i3s: 'Otomasyon odası',
  r1i0n: 'Güç transformatörü T-1',
  r1i0s: 'TP-12, hücre 1',
  r1i1n: 'Ayırıcı R-5',
  r1i1s: 'Giriş hücresi',
  r1i2n: 'Sıcaklık sensörü T-7',
  r1i2s: 'Bara bölümü',
  r1i3n: 'Kontrol panosu ŞU-2',
  r1i3s: 'Operatör konsolu',
  r1i4n: 'Vana K-3',
  r1i4s: 'Yangın segmenti',
  r2i0n: 'Pompa N-12',
  r2i0s: 'Pompa istasyonu, ünite 1',
  r2i1n: 'Vana K-3',
  r2i1s: 'Basınçlı hat bağlantısı',
  r2i2n: 'Sıcaklık sensörü T-7',
  r2i2s: 'Tank, daldırma sensörü',
  r2i3n: 'Kontrol panosu ŞU-2',
  r2i3s: 'Bina 2, pano odası',
  inspectionObjectAppTitle: 'Ekipman kontrolü',
  labelZone: 'Bölge',
  sectionChecklist: 'Kontrol listesi',
  checklistItemVisualOk: 'Görsel durum normal',
  checklistItemNoLeaks: 'Sızıntı tespit edilmedi',
  checklistItemNoNoise: 'Olağandışı gürültü yok',
  checklistItemAccessClear: 'Erişim alanı açık',
  sectionNote: 'Not',
  noteHint: 'Not ekleyin',
  saveLocallyButton: 'Yerel kaydet',
  completeObjectButton: 'Ekipmanı tamamla',
  snackbarLocalSaveSuccess: 'Veriler yerel olarak kaydedildi',
  sectionMeasurements: 'Ölçümler',
  labelMeasurementTemperature: 'Sıcaklık',
  labelMeasurementPressure: 'Basınç',
  labelMeasurementVibration: 'Titreşim',
  hintMeasurementValue: 'Değer girin',
  unitCelsius: '°C',
  unitPressureBar: 'bar',
  unitVibrationMmS: 'mm/s',
  sectionDefect: 'Arıza',
  defectToggleLabel: 'Arıza tespit edildi',
  labelDefectDescription: 'Açıklama',
  hintDefectDescription: 'Sorunu açıklayın',
  labelDefectPriority: 'Öncelik',
  priorityLow: 'Düşük',
  priorityMedium: 'Orta',
  priorityHigh: 'Yüksek',
  routeStatusHasIssue: 'Sorun var',
  sectionPhotoEvidence: 'Fotoğraf kaydı',
  addPhotoButton: 'Fotoğraf ekle',
  photoItemSubtitleLocal: 'Yerel ek',
  removePhotoButton: 'Sil',
  snackbarPhotoLimitReached: 'En fazla 3 fotoğraf eklenebilir',
  photoPreviewClose: 'Kapat',
  photoPreviewDemoCaption: 'Demo önizleme',
  voiceNoteSectionTitle: 'Ses notu',
  voiceStartRecording: 'Kayda başla',
  voiceStopRecording: 'Durdur',
  voiceDeleteRecording: 'Kaydı sil',
  voiceStateRecording: 'Kayıt yapılıyor…',
  voiceStateRecorded: 'Kayıt hazır',
  snackbarPhotoPickerCancelled: 'Fotoğraf seçimi iptal edildi',
  snackbarPhotoPickerFailed: 'Fotoğraf seçilemedi',
  snackbarMicrophoneDenied: 'Mikrofon izni yok',
  snackbarVoiceNoteAdded: 'Ses notu eklendi',
  snackbarUploadFailed: 'Rapor kaydedilemedi',
  snackbarUploadSuccess: 'Rapor başarıyla kaydedildi',
  errorSupabaseNotConfigured: 'Supabase yapılandırılmadı',
  errorAuthAnonymousFailed:
      'Anonim oturum açılamadı (Supabase Auth → Anonymous)',
  errorMissingTaskId: 'Görev kimliği eksik',
  errorMissingEquipmentId: 'Ekipman kimliği eksik',
  errorReportInsertFailed:
      'Rapor satırı yazılamadı (inspection_reports). Log’a bakın.',
  errorReportReturningEmpty:
      'Sunucu rapor satırı döndürmedi. inspection_reports için SELECT RLS politikası ekleyin.',
  errorReportForeignKey:
      'Görev veya ekipman sunucuda yok (id / FK kontrol edin)',
  errorReportRlsBlocked:
      'Güvenlik politikası yazmayı engelliyor (Supabase RLS)',
  errorMediaInsertFailed:
      'Medya satırı yazılamadı (inspection_media). Log’a bakın.',
  errorMediaMetadataAfterReportOk:
      'Rapor kaydedildi ancak medya bilgisi veritabanına yazılamadı.',
  errorPhotoUploadFailed: 'Fotoğraf yüklenemedi',
  errorAudioUploadFailed: 'Ses yüklenemedi',
  errorDatabaseSaveFailed: 'Veritabanına kayıt başarısız',
  errorRecordingNotFound: 'Kayıt dosyası bulunamadı',
  errorSaveFailed: 'Kayıt başarısız',
  errorUnknownSave: 'Bilinmeyen hata',
  errorPermissionDenied: 'İzin reddedildi',
  completeObjectInProgress: 'Gönderiliyor…',
  appMaterialTitle: 'Saha denetimi',
  inspectionTaskSummaryTitle: 'Tur tamamlandı',
  sectionSummaryResults: 'Güzergâh özeti',
  labelSummaryTotalObjects: 'Toplam nesne',
  labelSummaryCompletedOk: 'Sorunsuz tamamlandı',
  labelSummaryWithIssues: 'Sorunlu',
  summaryBackToTasksButton: 'Görevlere dön',
  statusCompletedWithIssues: 'Sorunlarla tamamlandı',
  taskListProgressNotStarted: 'Başlanmadı',
  taskListProgressActive: 'Devam ediyor',
  taskListProgressCompletedFull: 'Tamamlandı: %100 (tüm nesneler kontrol edildi)',
  taskListProgressCompletedFullWithIssues:
      'Tamamlandı: %100 (güzergâhta sorun var)',
  taskOpenResultButton: 'Sonucu aç',
  completedReportAppTitle: 'Tur sonucu',
  sectionCompletedReportInspectionSummary: 'Kontrol özeti',
  labelReportPhotoCount: 'Fotoğraf',
  labelReportAudioCount: 'Ses',
  labelReportObjectsWithDefects: 'Arızalı nesne',
  taskDetailSectionOutcome: 'Tur özeti',
  labelFinalTaskState: 'Son durum',
  completedReportNotAvailable: 'Tur sonucu yok',
  labelDueAt: 'Son tarih',
  tasksUntitledTask: 'Adsız görev',
  tasksScheduleNotSpecified: 'Belirtilmedi',
  tasksLoading: 'Görevler yükleniyor…',
  tasksLoadFailed: 'Görevler yüklenemedi',
  tasksShowingDemoFallback: 'Demo görevler gösteriliyor (atama yok veya ağ hatası)',
  tasksNoWorkerIdentity: 'İşçi oturumu yok. Giriş yapın veya DEV_WORKER_USER_ID ayarlayın',
  tasksSupabaseNotReady: 'Sunucu bağlantısı hazır değil',
  tasksNoAssignments: 'Atanan görev yok',
  tasksSectionDemoTasks: 'Demo görevler',
  tasksDemoSectionDebugHint:
      'Yalnızca hata ayıklama derlemesi: örnek veri, gerçek atama değil.',
  workerDevWorkerIdBadge: 'DEV_WORKER_USER_ID modu',
  workerProfileNotInDatabase: 'Veritabanında profil yok',
  sectionTaskInstructions: 'Talimatlar',
  tasksRetry: 'Yenile',
  workerSectionTitle: 'İşçi',
  workerProfileNameLabel: 'Ad soyad',
  workerProfileCodeLabel: 'Sicil no',
  taskRequestScreenTitle: 'Görev talebi',
  taskRequestActionTooltip: 'Görev talep et',
  labelRequestTitle: 'Başlık',
  hintRequestTitle: 'İşi kısaca yazın',
  labelRequestSiteName: 'Tesis / saha',
  hintRequestSiteName: 'Örn. atölye, istasyon',
  labelRequestAreaName: 'Bölge',
  hintRequestAreaName: 'Örn. hat, bina',
  labelRequestDescription: 'Açıklama',
  hintRequestDescription: 'Ne kontrol veya iş yapılacak',
  labelRequestPriority: 'Öncelik',
  taskRequestSubmitButton: 'Onaya gönder',
  taskRequestSuccess: 'Talep yöneticiye gönderildi',
  taskRequestErrorNoWorker: 'İşçi oturumu yok',
  taskRequestErrorNotReady: 'Sunucu hazır değil',
  taskRequestErrorInsert: 'Talep gönderilemedi',
  labelTaskDuration: 'Gerçekleşme süresi',
);

const AppStrings _en = AppStrings(
  language: AppLanguage.en,
  loginTitle: 'Mobile field inspector',
  loginSubtitle: 'Equipment control and rounds',
  loginDescription:
      'Development mode: full worker sign-in is not wired yet. Assigned tasks appear after the worker account and Supabase are configured.',
  loginContinueToTasks: 'Continue to tasks',
  tasksAppTitle: 'Tasks',
  tasksSectionAssignedRounds: 'Assigned tasks',
  statusInProgress: 'In progress',
  statusPending: 'Pending',
  statusCompleted: 'Completed',
  taskDetailAppTitle: 'Task details',
  labelObject: 'Site / location',
  labelStatus: 'Status',
  labelShift: 'Shift',
  sectionInspectionRoute: 'Inspection route',
  startRoundButton: 'Start round',
  inspectionExecutionAppTitle: 'Round in progress',
  labelTask: 'Task',
  labelProgress: 'Progress',
  sectionInspectionObjects: 'Round objects',
  openCurrentObjectButton: 'Open current object',
  snackbarObjectInspectionNext:
      'Object inspection screen will be added in the next step',
  badgeCurrent: 'Current',
  badgePending: 'Pending',
  languageMenuLabel: 'Language',
  langNameRu: 'Русский',
  langNameTr: 'Türkçe',
  langNameEn: 'English',
  mockShift0: 'Shift A, 16 Apr 2026',
  mockShift1: 'Shift B, 16 Apr 2026',
  mockShift2: 'Shift A, 15 Apr 2026',
  mockTask0Title: 'Boiler house round No. 1',
  mockTask0Area: 'Boiler house, zone A',
  mockTask1Title: 'Scheduled transformer inspection',
  mockTask1Area: 'SS-12',
  mockTask2Title: 'Pumping station round',
  mockTask2Area: 'Pump station — building 2',
  r0i0n: 'Pump N-12',
  r0i0s: 'Boiler house, feed line',
  r0i1n: 'Valve K-3',
  r0i1s: 'Zone A, regulating node',
  r0i2n: 'Temperature sensor T-7',
  r0i2s: 'Hot water manifold',
  r0i3n: 'Control panel CP-2',
  r0i3s: 'Automation room',
  r1i0n: 'Power transformer T-1',
  r1i0s: 'SS-12, bay 1',
  r1i1n: 'Disconnector R-5',
  r1i1s: 'Incoming bay',
  r1i2n: 'Temperature sensor T-7',
  r1i2s: 'Bus section',
  r1i3n: 'Control panel CP-2',
  r1i3s: 'Operator desk',
  r1i4n: 'Valve K-3',
  r1i4s: 'Fire segment',
  r2i0n: 'Pump N-12',
  r2i0s: 'Pump station, unit 1',
  r2i1n: 'Valve K-3',
  r2i1s: 'Pressure piping',
  r2i2n: 'Temperature sensor T-7',
  r2i2s: 'Tank, immersion sensor',
  r2i3n: 'Control panel CP-2',
  r2i3s: 'Building 2, switchgear room',
  inspectionObjectAppTitle: 'Object inspection',
  labelZone: 'Zone',
  sectionChecklist: 'Checklist',
  checklistItemVisualOk: 'Visual condition is normal',
  checklistItemNoLeaks: 'No leaks detected',
  checklistItemNoNoise: 'No unusual noise',
  checklistItemAccessClear: 'Access area is clear',
  sectionNote: 'Note',
  noteHint: 'Add a note',
  saveLocallyButton: 'Save locally',
  completeObjectButton: 'Complete object',
  snackbarLocalSaveSuccess: 'Data saved locally',
  sectionMeasurements: 'Measurements',
  labelMeasurementTemperature: 'Temperature',
  labelMeasurementPressure: 'Pressure',
  labelMeasurementVibration: 'Vibration',
  hintMeasurementValue: 'Enter value',
  unitCelsius: '°C',
  unitPressureBar: 'bar',
  unitVibrationMmS: 'mm/s',
  sectionDefect: 'Defect',
  defectToggleLabel: 'Defect found',
  labelDefectDescription: 'Description',
  hintDefectDescription: 'Describe the issue',
  labelDefectPriority: 'Priority',
  priorityLow: 'Low',
  priorityMedium: 'Medium',
  priorityHigh: 'High',
  routeStatusHasIssue: 'Has issue',
  sectionPhotoEvidence: 'Photo evidence',
  addPhotoButton: 'Add photo',
  photoItemSubtitleLocal: 'Local attachment',
  removePhotoButton: 'Remove',
  snackbarPhotoLimitReached: 'You can add up to 3 photos',
  photoPreviewClose: 'Close',
  photoPreviewDemoCaption: 'Demo preview',
  voiceNoteSectionTitle: 'Voice note',
  voiceStartRecording: 'Start recording',
  voiceStopRecording: 'Stop',
  voiceDeleteRecording: 'Delete recording',
  voiceStateRecording: 'Recording…',
  voiceStateRecorded: 'Recording ready',
  snackbarPhotoPickerCancelled: 'Photo selection cancelled',
  snackbarPhotoPickerFailed: 'Could not pick photo',
  snackbarMicrophoneDenied: 'Microphone permission denied',
  snackbarVoiceNoteAdded: 'Voice note added',
  snackbarUploadFailed: 'Could not save report',
  snackbarUploadSuccess: 'Report saved successfully',
  errorSupabaseNotConfigured: 'Supabase is not configured',
  errorAuthAnonymousFailed:
      'Anonymous sign-in failed (enable Anonymous in Supabase Auth)',
  errorMissingTaskId: 'Task id is missing',
  errorMissingEquipmentId: 'Equipment id is missing',
  errorReportInsertFailed:
      'Report row insert failed (inspection_reports). Check logs.',
  errorReportReturningEmpty:
      'Server returned no report row. Add a SELECT policy on inspection_reports (RLS).',
  errorReportForeignKey:
      'Task or equipment id is missing on the server (check FK / seed data)',
  errorReportRlsBlocked:
      'Write blocked by security policy (check Supabase RLS)',
  errorMediaInsertFailed:
      'Media row insert failed (inspection_media). Check logs.',
  errorMediaMetadataAfterReportOk:
      'Report saved, but media metadata could not be saved.',
  errorPhotoUploadFailed: 'Photo upload failed',
  errorAudioUploadFailed: 'Audio upload failed',
  errorDatabaseSaveFailed: 'Database save failed',
  errorRecordingNotFound: 'Recording file not found',
  errorSaveFailed: 'Save failed',
  errorUnknownSave: 'Unknown error',
  errorPermissionDenied: 'Permission denied',
  completeObjectInProgress: 'Submitting…',
  appMaterialTitle: 'Field inspection',
  inspectionTaskSummaryTitle: 'Round completed',
  sectionSummaryResults: 'Route results',
  labelSummaryTotalObjects: 'Total objects',
  labelSummaryCompletedOk: 'Completed (OK)',
  labelSummaryWithIssues: 'With issues',
  summaryBackToTasksButton: 'Back to tasks',
  statusCompletedWithIssues: 'Completed with issues',
  taskListProgressNotStarted: 'Not started',
  taskListProgressActive: 'In progress',
  taskListProgressCompletedFull: 'Completed: 100% (all objects checked)',
  taskListProgressCompletedFullWithIssues:
      'Completed: 100% (issues on the route)',
  taskOpenResultButton: 'Open result',
  completedReportAppTitle: 'Round result',
  sectionCompletedReportInspectionSummary: 'Inspection summary',
  labelReportPhotoCount: 'Photos',
  labelReportAudioCount: 'Audio',
  labelReportObjectsWithDefects: 'Objects with defect',
  taskDetailSectionOutcome: 'Round outcome',
  labelFinalTaskState: 'Final status',
  completedReportNotAvailable: 'Round result is not available',
  labelDueAt: 'Due',
  tasksUntitledTask: 'Untitled task',
  tasksScheduleNotSpecified: 'Not specified',
  tasksLoading: 'Loading tasks…',
  tasksLoadFailed: 'Could not load tasks',
  tasksShowingDemoFallback: 'Showing demo tasks (no assignments or load error)',
  tasksNoWorkerIdentity: 'No worker session. Sign in or set DEV_WORKER_USER_ID',
  tasksSupabaseNotReady: 'Server connection not ready',
  tasksNoAssignments: 'No assigned tasks',
  tasksSectionDemoTasks: 'Demo tasks',
  tasksDemoSectionDebugHint:
      'Debug build only: sample data, not real assignments.',
  workerDevWorkerIdBadge: 'DEV_WORKER_USER_ID mode',
  workerProfileNotInDatabase: 'No profile row in database',
  sectionTaskInstructions: 'Instructions',
  tasksRetry: 'Retry',
  workerSectionTitle: 'Worker',
  workerProfileNameLabel: 'Name',
  workerProfileCodeLabel: 'Employee ID',
  taskRequestScreenTitle: 'Task request',
  taskRequestActionTooltip: 'Request a task',
  labelRequestTitle: 'Title',
  hintRequestTitle: 'Short summary of the work',
  labelRequestSiteName: 'Site',
  hintRequestSiteName: 'e.g. shop, station',
  labelRequestAreaName: 'Area',
  hintRequestAreaName: 'e.g. line, building',
  labelRequestDescription: 'Description',
  hintRequestDescription: 'What to inspect or do',
  labelRequestPriority: 'Priority',
  taskRequestSubmitButton: 'Submit for approval',
  taskRequestSuccess: 'Request sent to supervisor',
  taskRequestErrorNoWorker: 'No worker session',
  taskRequestErrorNotReady: 'Server not ready',
  taskRequestErrorInsert: 'Could not submit request',
  labelTaskDuration: 'Time to complete',
);
