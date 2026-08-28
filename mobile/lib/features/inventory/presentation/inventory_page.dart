import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/inventory/presentation/inventory_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class InventoryPage extends ConsumerWidget {
  const InventoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(inventoryControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'ইনভেন্টরি',
      asyncValue: async,
      onRefresh: () => ref.read(inventoryControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['name']?.toString() ?? '—'),
              subtitle: Text(
                [
                  '${m['quantity'] ?? 0} ${m['unit'] ?? ''}',
                  if (m['reorderLevel'] != null) 'min ${m['reorderLevel']}',
                ].whereType<Object>().join(' · '),
              ),
            ),
          );
      },
    );
  }
}
