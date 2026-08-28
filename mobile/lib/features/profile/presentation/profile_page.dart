import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/core/config/env.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text('প্রোফাইল')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            leading: CircleAvatar(
              child: Text((user?.name.isNotEmpty == true)
                  ? user!.name.characters.first
                  : '?'),
            ),
            title: Text(user?.name ?? '—'),
            subtitle: Text(user?.email ?? ''),
          ),
          const Divider(),
          ListTile(
            title: const Text('রোল'),
            subtitle: Text(user?.role ?? '—'),
          ),
          ListTile(
            title: const Text('Tenant'),
            subtitle: Text(user?.tenantId ?? '—'),
          ),
          ListTile(
            title: const Text('API'),
            subtitle: Text(Env.apiBaseUrl),
          ),
          const SizedBox(height: 16),
          FilledButton.tonal(
            onPressed: () async {
              await ref.read(authStateProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            child: const Text('লগআউট'),
          ),
        ],
      ),
    );
  }
}
