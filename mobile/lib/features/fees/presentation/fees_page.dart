import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/fees/presentation/fees_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class FeesPage extends ConsumerWidget {
  const FeesPage({super.key});

  Future<void> _pay(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> inv,
  ) async {
    final id = inv['id']?.toString();
    if (id == null) return;
    final total = (inv['totalAmount'] as num?) ?? 0;
    final paid = (inv['paidAmount'] as num?) ?? 0;
    final due = total - paid;
    if (due <= 0) {
      showAppSuccess('ইতিমধ্যে পরিশোধিত');
      return;
    }
    final amountCtrl = TextEditingController(text: due.toString());
    String method = 'CASH';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('পেমেন্ট · ${inv['invoiceNumber'] ?? ''}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('বকেয়া ৳$due'),
            const SizedBox(height: 8),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'পরিমাণ (৳)'),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: method,
              items: const [
                DropdownMenuItem(value: 'CASH', child: Text('নগদ')),
                DropdownMenuItem(value: 'BKASH', child: Text('bKash')),
                DropdownMenuItem(value: 'NAGAD', child: Text('Nagad')),
                DropdownMenuItem(value: 'BANK', child: Text('ব্যাংক')),
              ],
              onChanged: (v) => method = v ?? 'CASH',
              decoration: const InputDecoration(labelText: 'মাধ্যম'),
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
            child: const Text('রেকর্ড'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final amount = num.tryParse(amountCtrl.text.trim());
    if (amount == null || amount <= 0) {
      showAppError(const ValidationFailure('সঠিক পরিমাণ দিন'));
      return;
    }
    try {
      await ref.read(feesControllerProvider.notifier).pay(
            invoiceId: id,
            amount: amount,
            method: method,
          );
      showAppSuccess('পেমেন্ট রেকর্ড হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(feesControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'ফি / চালান',
      asyncValue: async,
      onRefresh: () => ref.read(feesControllerProvider.notifier).refresh(),
      emptyMessage: 'কোনো চালান নেই',
      itemBuilder: (context, m) {
        final status = m['status']?.toString() ?? '';
        final unpaid = status != 'PAID';
        return Card(
          child: ListTile(
            title: Text(m['invoiceNumber']?.toString() ?? '—'),
            subtitle: Text(
              [
                m['studentName'],
                status,
                if (m['totalAmount'] != null) '৳${m['totalAmount']}',
                if (m['paidAmount'] != null) 'paid ৳${m['paidAmount']}',
              ].whereType<Object>().join(' · '),
            ),
            trailing: unpaid
                ? TextButton(
                    onPressed: () => _pay(context, ref, m),
                    child: const Text('পে'),
                  )
                : const Icon(Icons.check_circle, color: Colors.green),
            onTap: unpaid ? () => _pay(context, ref, m) : null,
          ),
        );
      },
    );
  }
}
