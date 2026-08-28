import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/auth/presentation/login_page.dart';
import 'package:edupro_mobile/features/attendance/presentation/attendance_page.dart';
import 'package:edupro_mobile/features/home/presentation/home_shell.dart';
import 'package:edupro_mobile/features/notices/presentation/notices_page.dart';
import 'package:edupro_mobile/features/profile/presentation/profile_page.dart';
import 'package:edupro_mobile/features/students/presentation/students_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/home',
    refreshListenable: _AuthRefresh(ref),
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      final user = auth.valueOrNull;
      final loading = auth.isLoading;

      if (loading) return null;
      if (user == null && !loggingIn) return '/login';
      if (user != null && loggingIn) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (_, __) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: HomeDashboardPage()),
          ),
          GoRoute(
            path: '/students',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: StudentsPage()),
          ),
          GoRoute(
            path: '/attendance',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: AttendancePage()),
          ),
          GoRoute(
            path: '/notices',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: NoticesPage()),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: ProfilePage()),
          ),
        ],
      ),
    ],
  );
});

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authStateProvider, (_, __) => notifyListeners());
  }
  final Ref _ref;
}
