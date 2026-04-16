import 'package:flutter/material.dart';

import 'app_language.dart';
import 'app_strings.dart';

class LanguageController extends ChangeNotifier {
  AppLanguage _language = AppLanguage.ru;

  AppLanguage get language => _language;

  AppStrings get strings => stringsFor(_language);

  void setLanguage(AppLanguage value) {
    if (_language == value) return;
    _language = value;
    notifyListeners();
  }
}

class LanguageScope extends InheritedNotifier<LanguageController> {
  const LanguageScope({
    super.key,
    required LanguageController super.notifier,
    required super.child,
  });

  static LanguageController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<LanguageScope>();
    assert(scope != null, 'LanguageScope not found in context');
    return scope!.notifier!;
  }
}

extension AppLocalization on BuildContext {
  AppStrings get strings => LanguageScope.of(this).strings;

  LanguageController get languageController => LanguageScope.of(this);
}
