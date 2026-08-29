import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/exams/presentation/exams_provider.dart';

class ExamsPage extends ConsumerWidget {
  const ExamsPage({super.key});

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final name = TextEditingController();
    String type = 'MIDTERM';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('নতুন পরীক্ষা'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'নাম *'),
              ),
              DropdownButtonFormField<String>(
                value: type,
                items: const [
                  DropdownMenuItem(value: 'MIDTERM', child: Text('মিডটার্ম')),
                  DropdownMenuItem(value: 'FINAL', child: Text('ফাইনাল')),
                  DropdownMenuItem(value: 'CLASS_TEST', child: Text('ক্লাস টেস্ট')),
                  DropdownMenuItem(value: 'OTHER', child: Text('অন্যান্য')),
                ],
                onChanged: (v) => setSt(() => type = v ?? 'MIDTERM'),
                decoration: const InputDecoration(labelText: 'ধরন'),
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
              child: const Text('তৈরি'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || name.text.trim().isEmpty) return;
    try {
      await ref.read(examsControllerProvider.notifier).create(
            name: name.text.trim(),
            examType: type,
          );
      showAppSuccess('পরীক্ষা তৈরি হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(examsControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('পরীক্ষা')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _create(context, ref),
        child: const Icon(Icons.add),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(examsControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো পরীক্ষা নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(examsControllerProvider.notifier).refresh(),
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
                    [m['examType'], m['startDate'], m['endDate']]
                        .whereType<Object>()
                        .join(' · '),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
