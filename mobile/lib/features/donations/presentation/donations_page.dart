import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/donations/presentation/donations_provider.dart';

class DonationsPage extends ConsumerWidget {
  const DonationsPage({super.key});

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final name = TextEditingController();
    final amount = TextEditingController();
    String category = 'ZAKAT';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('নতুন দান'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: name, decoration: const InputDecoration(labelText: 'দাতার নাম *')),
              TextField(controller: amount, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'পরিমাণ ৳ *')),
              DropdownButtonFormField<String>(
                value: category,
                items: const [
                  DropdownMenuItem(value: 'ZAKAT', child: Text('যাকাত')),
                  DropdownMenuItem(value: 'SADAQAH', child: Text('সদকা')),
                  DropdownMenuItem(value: 'GENERAL', child: Text('সাধারণ')),
                  DropdownMenuItem(value: 'SPONSORSHIP', child: Text('স্পন্সর')),
                ],
                onChanged: (v) => setSt(() => category = v ?? 'GENERAL'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('বাতিল')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('সেভ')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    final amt = num.tryParse(amount.text.trim());
    if (name.text.trim().isEmpty || amt == null || amt <= 0) {
      showAppError(const ValidationFailure('নাম ও পরিমাণ দিন'));
      return;
    }
    try {
      await ref.read(donationsControllerProvider.notifier).create(donorName: name.text.trim(), amount: amt, category: category);
      showAppSuccess('দান রেকর্ড হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(donationsControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('দান / যাকাত')),
      floatingActionButton: FloatingActionButton(onPressed: () => _create(context, ref), child: const Icon(Icons.add)),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(donationsControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো দান নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(donationsControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['donorName']?.toString() ?? '—'),
                  subtitle: Text([if (m['amount'] != null) '৳${m['amount']}', m['category'], m['donatedAt']].whereType<Object>().join(' · ')),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
