import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/auth/presentation/login_page.dart';
import 'package:edupro_mobile/features/attendance/presentation/attendance_page.dart';
import 'package:edupro_mobile/features/certificates/presentation/certificates_page.dart';
import 'package:edupro_mobile/features/donations/presentation/donations_page.dart';
import 'package:edupro_mobile/features/exams/presentation/exams_page.dart';
import 'package:edupro_mobile/features/fees/presentation/fees_page.dart';
import 'package:edupro_mobile/features/hifz/presentation/hifz_page.dart';
import 'package:edupro_mobile/features/home/presentation/home_shell.dart';
import 'package:edupro_mobile/features/home/presentation/modules_hub_page.dart';
import 'package:edupro_mobile/features/homework/presentation/homework_page.dart';
import 'package:edupro_mobile/features/hostel/presentation/hostel_page.dart';
import 'package:edupro_mobile/features/inventory/presentation/inventory_page.dart';
import 'package:edupro_mobile/features/library/presentation/library_page.dart';
import 'package:edupro_mobile/features/messages/presentation/messages_page.dart';
import 'package:edupro_mobile/features/notices/presentation/notices_page.dart';
import 'package:edupro_mobile/features/profile/presentation/profile_page.dart';
import 'package:edupro_mobile/features/staff/presentation/staff_page.dart';
import 'package:edupro_mobile/features/students/presentation/students_page.dart';
import 'package:edupro_mobile/features/timetable/presentation/timetable_page.dart';
import 'package:edupro_mobile/features/transport/presentation/transport_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

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
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: HomeDashboardPage()),
          ),
          GoRoute(
            path: '/modules',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: ModulesHubPage()),
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
          GoRoute(
            path: '/fees',
            pageBuilder: (_, __) => const NoTransitionPage(child: FeesPage()),
          ),
          GoRoute(
            path: '/exams',
            pageBuilder: (_, __) => const NoTransitionPage(child: ExamsPage()),
          ),
          GoRoute(
            path: '/homework',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: HomeworkPage()),
          ),
          GoRoute(
            path: '/hifz',
            pageBuilder: (_, __) => const NoTransitionPage(child: HifzPage()),
          ),
          GoRoute(
            path: '/timetable',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: TimetablePage()),
          ),
          GoRoute(
            path: '/library',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: LibraryPage()),
          ),
          GoRoute(
            path: '/hostel',
            pageBuilder: (_, __) => const NoTransitionPage(child: HostelPage()),
          ),
          GoRoute(
            path: '/transport',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: TransportPage()),
          ),
          GoRoute(
            path: '/staff',
            pageBuilder: (_, __) => const NoTransitionPage(child: StaffPage()),
          ),
          GoRoute(
            path: '/messages',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: MessagesPage()),
          ),
          GoRoute(
            path: '/certificates',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: CertificatesPage()),
          ),
          GoRoute(
            path: '/donations',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: DonationsPage()),
          ),
          GoRoute(
            path: '/inventory',
            pageBuilder: (_, __) =>
                const NoTransitionPage(child: InventoryPage()),
          ),
        ],
      ),
    ],
  );
});

class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(this._ref) {
    _ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
  final Ref _ref;
}
