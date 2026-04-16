import 'package:flutter/material.dart';

import '../core/localization/language_controller.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/presentation/login_screen.dart';

class FieldInspectorApp extends StatelessWidget {
  const FieldInspectorApp({super.key});

  @override
  Widget build(BuildContext context) {
    final languageController = LanguageScope.of(context);
    return ListenableBuilder(
      listenable: languageController,
      builder: (context, _) {
        final s = context.strings;
        return MaterialApp(
          title: s.appMaterialTitle,
          debugShowCheckedModeBanner: false,
          theme: buildAppTheme(),
          home: const LoginScreen(),
        );
      },
    );
  }
}
