import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/fees/presentation/fees_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class FeesPage extends ConsumerWidget {
  const FeesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(feesControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'ফি / চালান',
      asyncValue: async,
      onRefresh: () => ref.read(feesControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['invoiceNumber']?.toString() ?? '—'),
              subtitle: Text(
                [
                  m['studentName'],
                  m['status'],
                  if (m['totalAmount'] != null) '৳${m['totalAmount']}',
                ].whereType<Object>().join(' · '),
              ),
            ),
          );
      },
    );
  }
}
