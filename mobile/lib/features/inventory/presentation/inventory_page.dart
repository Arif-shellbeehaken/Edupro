import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/inventory/presentation/inventory_provider.dart';

class InventoryPage extends ConsumerWidget {
  const InventoryPage({super.key});

  Future<void> _stock(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
  ) async {
    final id = item['id']?.toString();
    if (id == null) return;
    final qtyCtrl = TextEditingController(text: '1');
    String type = 'IN';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: Text(item['name']?.toString() ?? 'স্টক'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: type,
                items: const [
                  DropdownMenuItem(value: 'IN', child: Text('IN · যোগ')),
                  DropdownMenuItem(value: 'OUT', child: Text('OUT · খরচ')),
                  DropdownMenuItem(value: 'ADJUST', child: Text('ADJUST · সেট')),
                ],
                onChanged: (v) => setSt(() => type = v ?? 'IN'),
              ),
              TextField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'পরিমাণ'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('বাতিল'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('সেভ'),
            ),
          ],
        ),
      ),
    );
    if (ok != true) return;
    final q = int.tryParse(qtyCtrl.text.trim());
    if (q == null || q <= 0) {
      showAppError(const ValidationFailure('সঠিক পরিমাণ দিন'));
      return;
    }
    try {
      await ref.read(inventoryControllerProvider.notifier).stock(
            itemId: id,
            type: type,
            quantity: q,
          );
      showAppSuccess('স্টক আপডেট');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(inventoryControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('ইনভেন্টরি')),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () =>
            ref.read(inventoryControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো আইটেম নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () =>
              ref.read(inventoryControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['name']?.toString() ?? '—'),
                  subtitle: Text(
                    '${m['quantity'] ?? 0} ${m['unit'] ?? ''}'
                    '${m['reorderLevel'] != null ? ' · min ${m['reorderLevel']}' : ''}',
                  ),
                  trailing: TextButton(
                    onPressed: () => _stock(context, ref, m),
                    child: const Text('স্টক'),
                  ),
                  onTap: () => _stock(context, ref, m),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
