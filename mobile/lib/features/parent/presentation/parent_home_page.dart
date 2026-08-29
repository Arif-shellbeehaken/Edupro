import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/parent/presentation/parent_login_page.dart';

final parentChildrenProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) {
  return ref.watch(parentRepositoryProvider).children();
});

class ParentHomePage extends ConsumerWidget {
  const ParentHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(parentChildrenProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('অভিভাবক পোর্টাল'),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/parent-login');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.invalidate(parentChildrenProvider),
        empty: const Center(child: Text('কোনো সন্তান লিংক নেই')),
        data: (list) => ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: list.length,
          itemBuilder: (context, i) {
            final c = list[i];
            final invoices = (c['invoices'] as List?) ?? [];
            final att = (c['attendances'] as List?) ?? [];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      c['name']?.toString() ?? '—',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      [c['studentId'], c['className']]
                          .whereType<Object>()
                          .join(' · '),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 8),
                    Text('উপস্থিতি (${att.length})',
                        style: Theme.of(context).textTheme.labelLarge),
                    ...att.take(5).map(
                          (a) => Text(
                            '${a['date']} · ${a['status']}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                    const SizedBox(height: 8),
                    Text('ফি (${invoices.length})',
                        style: Theme.of(context).textTheme.labelLarge),
                    ...invoices.take(5).map(
                          (inv) => Text(
                            '${inv['invoiceNumber']} · ৳${inv['totalAmount']} · ${inv['status']}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
