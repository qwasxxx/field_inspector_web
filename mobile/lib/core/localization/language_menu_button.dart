import 'package:flutter/material.dart';

import 'app_language.dart';
import 'language_controller.dart';

class LanguageMenuButton extends StatelessWidget {
  const LanguageMenuButton({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.languageController;
    final s = context.strings;

    return PopupMenuButton<AppLanguage>(
      onSelected: controller.setLanguage,
      itemBuilder: (context) => [
        PopupMenuItem(
          value: AppLanguage.ru,
          child: Text(s.langNameRu),
        ),
        PopupMenuItem(
          value: AppLanguage.tr,
          child: Text(s.langNameTr),
        ),
        PopupMenuItem(
          value: AppLanguage.en,
          child: Text(s.langNameEn),
        ),
      ],
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Text(
          s.languageMenuLabel,
          style: TextStyle(
            color: Theme.of(context).colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
