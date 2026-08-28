import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/router/app_router.dart';
import 'package:edupro_mobile/core/theme/app_theme.dart';
import 'package:edupro_mobile/core/theme/theme_mode_provider.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';

class EduproApp extends ConsumerWidget {
  const EduproApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Edupro',
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: rootScaffoldMessengerKey,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
