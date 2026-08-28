import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/notices/data/notices_repository.dart';

final noticesProvider = FutureProvider.autoDispose((ref) {
  final api = ref.watch(apiClientProvider);
  return NoticesRepository(api).list();
});

class NoticesPage extends ConsumerWidget {
  const NoticesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(noticesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('নোটিশ')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('লোড ব্যর্থ')),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('কোনো নোটিশ নেই'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(noticesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final n = list[i];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          n.title,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (n.audience != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            n.audience!,
                            style: Theme.of(context).textTheme.labelSmall,
                          ),
                        ],
                        if (n.body != null && n.body!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(n.body!),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
