import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/certificates/presentation/certificates_provider.dart';

class CertificatesPage extends ConsumerWidget {
  const CertificatesPage({super.key});

  Future<void> _issue(BuildContext context, WidgetRef ref) async {
    final name = TextEditingController();
    String type = 'CHARACTER';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('সার্টিফিকেট ইস্যু'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: name, decoration: const InputDecoration(labelText: 'শিক্ষার্থীর নাম *')),
              DropdownButtonFormField<String>(
                value: type,
                items: const [
                  DropdownMenuItem(value: 'CHARACTER', child: Text('চারিত্রিক')),
                  DropdownMenuItem(value: 'TRANSFER', child: Text('টিসি')),
                  DropdownMenuItem(value: 'TESTIMONIAL', child: Text('টেস্টিমোনিয়াল')),
                  DropdownMenuItem(value: 'HIFZ_COMPLETION', child: Text('হিফজ সমাপ্তি')),
                ],
                onChanged: (v) => setSt(() => type = v ?? 'CHARACTER'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('বাতিল')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('ইস্যু')),
          ],
        ),
      ),
    );
    if (ok != true || name.text.trim().isEmpty) return;
    try {
      await ref.read(certificatesControllerProvider.notifier).issue(studentName: name.text.trim(), certType: type);
      showAppSuccess('সার্টিফিকেট ইস্যু হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(certificatesControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('সার্টিফিকেট')),
      floatingActionButton: FloatingActionButton(onPressed: () => _issue(context, ref), child: const Icon(Icons.add)),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(certificatesControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো সার্টিফিকেট নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(certificatesControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['studentName']?.toString() ?? '—'),
                  subtitle: Text([m['type'], m['certificateNo'], m['issuedAt']].whereType<Object>().join(' · ')),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
