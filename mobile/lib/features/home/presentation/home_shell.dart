import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';

class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  static const _tabs = [
    ('/home', 'হোম', Icons.home_outlined, Icons.home),
    ('/students', 'শিক্ষার্থী', Icons.people_outline, Icons.people),
    ('/attendance', 'উপস্থিতি', Icons.fact_check_outlined, Icons.fact_check),
    ('/notices', 'নোটিশ', Icons.campaign_outlined, Icons.campaign),
    ('/profile', 'প্রোফাইল', Icons.person_outline, Icons.person),
  ];

  int _index(String location) {
    for (var i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].$1)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).uri.toString();
    final idx = _index(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edupro'),
        actions: [
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
      body: ListView(
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
          const SizedBox(height: 4),
          Text(
            '${user?.role ?? ''} · ${user?.email ?? ''}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _QuickCard(
                icon: Icons.people,
                label: 'শিক্ষার্থী',
                onTap: () => context.go('/students'),
              ),
              _QuickCard(
                icon: Icons.fact_check,
                label: 'উপস্থিতি',
                onTap: () => context.go('/attendance'),
              ),
              _QuickCard(
                icon: Icons.campaign,
                label: 'নোটিশ',
                onTap: () => context.go('/notices'),
              ),
              _QuickCard(
                icon: Icons.person,
                label: 'প্রোফাইল',
                onTap: () => context.go('/profile'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickCard extends StatelessWidget {
  const _QuickCard({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: (MediaQuery.sizeOf(context).width - 44) / 2,
      child: Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
            child: Column(
              children: [
                Icon(icon, color: theme.colorScheme.primary, size: 28),
                const SizedBox(height: 8),
                Text(label, style: theme.textTheme.titleSmall),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
