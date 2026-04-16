import 'package:flutter_test/flutter_test.dart';

import 'package:field_inspector_app/app/app.dart';
import 'package:field_inspector_app/core/localization/language_controller.dart';

void main() {
  testWidgets('Login screen shows access title', (WidgetTester tester) async {
    await tester.pumpWidget(
      LanguageScope(
        notifier: LanguageController(),
        child: const FieldInspectorApp(),
      ),
    );

    expect(find.text('Мобильный обходчик'), findsOneWidget);
    expect(find.text('Войти'), findsOneWidget);
  });
}
