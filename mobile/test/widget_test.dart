import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/app.dart';

void main() {
  testWidgets('App builds', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: EduproApp()));
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
