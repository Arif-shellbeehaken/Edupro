import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/home/presentation/dashboard_provider.dart';

class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  static const _tabs = [
    ('/home', 'হোম', Icons.home_outlined, Icons.home),
    ('/modules', 'মডিউল', Icons.apps_outlined, Icons.apps),
    ('/students', 'শিক্ষার্থী', Icons.people_outline, Icons.people),
    ('/notices', 'নোটিশ', Icons.campaign_outlined, Icons.campaign),
    ('/profile', 'প্রোফাইল', Icons.person_outline, Icons.person),
  ];

  int _index(String location) {
    for (var i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].$1)) return i;
    }
    return 1; // modules for deep feature routes
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final idx = _index(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx.clamp(0, _tabs.length - 1),
        onDestinationSelected: (i) => context.go(_tabs[i].$1),
        destinations: [
          for (var i = 0; i < _tabs.length; i++)
            NavigationDestination(
              icon: Icon(_tabs[i].$3),
              selectedIcon: Icon(_tabs[i].$4),
              label: _tabs[i].$2,
            ),
        ],
      ),
    );
  }
}

class HomeDashboardPage extends ConsumerWidget {
  const HomeDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final stats = ref.watch(dashboardControllerProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edupro'),
        actions: [
          IconButton(
            tooltip: 'সব মডিউল',
            onPressed: () => context.go('/modules'),
            icon: const Icon(Icons.apps),
          ),
          IconButton(
            tooltip: 'লগআউট',
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(dashboardControllerProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'আসসালামু আলাইকুম',
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
            Text(
              user?.name ?? 'User',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${user?.role ?? ''} · ${user?.email ?? ''}',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            AsyncValueWidget<Map<String, dynamic>>(
              value: stats,
              onRetry: () =>
                  ref.read(dashboardControllerProvider.notifier).refresh(),
              data: (s) => Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _StatChip(label: 'শিক্ষার্থী', value: '${s['students'] ?? 0}'),
                  _StatChip(label: 'স্টাফ', value: '${s['staff'] ?? 0}'),
                  _StatChip(
                      label: 'বকেয়া চালান',
                      value: '${s['invoicesOpen'] ?? 0}'),
                  _StatChip(label: 'নোটিশ', value: '${s['notices'] ?? 0}'),
                  _StatChip(label: 'হোমওয়ার্ক', value: '${s['homework'] ?? 0}'),
                  _StatChip(label: 'পরীক্ষা', value: '${s['exams'] ?? 0}'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            FilledButton.tonalIcon(
              onPressed: () => context.go('/modules'),
              icon: const Icon(Icons.apps),
              label: const Text('সব মডিউল দেখুন'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: (MediaQuery.sizeOf(context).width - 42) / 2,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
