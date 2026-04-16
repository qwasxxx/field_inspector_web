import 'package:flutter/material.dart';

import '../../../core/localization/app_strings.dart';
import '../../../core/localization/language_controller.dart';
import '../../../core/localization/language_menu_button.dart';
import '../data/inspection_task_request_service.dart';

class TaskRequestCreateScreen extends StatefulWidget {
  const TaskRequestCreateScreen({super.key});

  @override
  State<TaskRequestCreateScreen> createState() =>
      _TaskRequestCreateScreenState();
}

class _TaskRequestCreateScreenState extends State<TaskRequestCreateScreen> {
  final _title = TextEditingController();
  final _site = TextEditingController();
  final _area = TextEditingController();
  final _description = TextEditingController();
  int _priorityIndex = 0;
  bool _submitting = false;

  @override
  void dispose() {
    _title.dispose();
    _site.dispose();
    _area.dispose();
    _description.dispose();
    super.dispose();
  }

  String _priorityKey() {
    const keys = ['low', 'medium', 'high'];
    return keys[_priorityIndex.clamp(0, 2)];
  }

  String _errorMessage(AppStrings s, String code) {
    switch (code) {
      case 'no_worker':
        return s.taskRequestErrorNoWorker;
      case 'not_ready':
        return s.taskRequestErrorNotReady;
      case 'insert_failed':
        return s.taskRequestErrorInsert;
      default:
        return s.taskRequestErrorInsert;
    }
  }

  Future<void> _submit(BuildContext context) async {
    final s = context.strings;
    final messenger = ScaffoldMessenger.of(context);
    if (_title.text.trim().isEmpty) {
      messenger.showSnackBar(
        SnackBar(content: Text(s.hintRequestTitle)),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      await InspectionTaskRequestService.submitRequest(
        title: _title.text,
        siteName: _site.text,
        areaName: _area.text,
        description: _description.text,
        priority: _priorityKey(),
      );
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text(s.taskRequestSuccess)),
      );
      Navigator.of(context).pop();
    } on InspectionTaskRequestException catch (e) {
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text(_errorMessage(s, e.message))),
      );
    } catch (_) {
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text(s.taskRequestErrorInsert)),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final s = context.strings;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.taskRequestScreenTitle),
        actions: const [
          LanguageMenuButton(),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          TextField(
            controller: _title,
            decoration: InputDecoration(
              labelText: s.labelRequestTitle,
              hintText: s.hintRequestTitle,
              border: const OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _site,
            decoration: InputDecoration(
              labelText: s.labelRequestSiteName,
              hintText: s.hintRequestSiteName,
              border: const OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _area,
            decoration: InputDecoration(
              labelText: s.labelRequestAreaName,
              hintText: s.hintRequestAreaName,
              border: const OutlineInputBorder(),
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            minLines: 3,
            maxLines: 6,
            decoration: InputDecoration(
              labelText: s.labelRequestDescription,
              hintText: s.hintRequestDescription,
              alignLabelWithHint: true,
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            s.labelRequestPriority,
            style: theme.textTheme.labelLarge?.copyWith(
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: Text(s.priorityLow),
                selected: _priorityIndex == 0,
                onSelected: (_) => setState(() => _priorityIndex = 0),
              ),
              ChoiceChip(
                label: Text(s.priorityMedium),
                selected: _priorityIndex == 1,
                onSelected: (_) => setState(() => _priorityIndex = 1),
              ),
              ChoiceChip(
                label: Text(s.priorityHigh),
                selected: _priorityIndex == 2,
                onSelected: (_) => setState(() => _priorityIndex = 2),
              ),
            ],
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _submitting ? null : () => _submit(context),
            child: _submitting
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(s.taskRequestSubmitButton),
          ),
        ],
      ),
    );
  }
}
