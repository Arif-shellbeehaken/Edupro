import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/hifz/presentation/hifz_provider.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';

class HifzPage extends ConsumerWidget {
  const HifzPage({super.key});

  Future<void> _addEntry(BuildContext context, WidgetRef ref) async {
    final students = ref.read(studentsControllerProvider).valueOrNull ?? [];
    if (students.isEmpty) {
      // load students
      ref.invalidate(studentsControllerProvider);
      showAppError(const ValidationFailure('আগে শিক্ষার্থী লোড করুন'));
      return;
    }
    String? studentId = students.first.id.isNotEmpty
        ? students.first.id
        : null;
    final fromJuz = TextEditingController(text: '1');
    final fromPage = TextEditingController(text: '1');
    final toJuz = TextEditingController(text: '1');
    final toPage = TextEditingController(text: '2');
    String stream = 'SABAK';
    String quality = 'GOOD';

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('হিফজ এন্ট্রি'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: studentId,
                  items: [
                    for (final s in students)
                      if (s.id.isNotEmpty)
                        DropdownMenuItem(
                          value: s.id,
                          child: Text(s.nameBn ?? s.name),
                        ),
                  ],
                  onChanged: (v) => setSt(() => studentId = v),
                  decoration: const InputDecoration(labelText: 'শিক্ষার্থী'),
                ),
                DropdownButtonFormField<String>(
                  value: stream,
                  items: const [
                    DropdownMenuItem(value: 'SABAK', child: Text('সবক')),
                    DropdownMenuItem(value: 'SABKI', child: Text('সবকি')),
                    DropdownMenuItem(value: 'MANZIL', child: Text('মানজিল')),
                  ],
                  onChanged: (v) => setSt(() => stream = v ?? 'SABAK'),
                  decoration: const InputDecoration(labelText: 'স্ট্রিম'),
                ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: fromJuz,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'From Juz'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: fromPage,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Page'),
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: toJuz,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'To Juz'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: toPage,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Page'),
                      ),
                    ),
                  ],
                ),
                DropdownButtonFormField<String>(
                  value: quality,
                  items: const [
                    DropdownMenuItem(value: 'EXCELLENT', child: Text('চমৎকার')),
                    DropdownMenuItem(value: 'GOOD', child: Text('ভালো')),
                    DropdownMenuItem(value: 'AVERAGE', child: Text('মোটামুটি')),
                    DropdownMenuItem(value: 'NEEDS_WORK', child: Text('উন্নতি')),
                    DropdownMenuItem(value: 'WEAK', child: Text('দুর্বল')),
                  ],
                  onChanged: (v) => setSt(() => quality = v ?? 'GOOD'),
                  decoration: const InputDecoration(labelText: 'কোয়ালিটি'),
                ),
              ],
            ),
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
    if (ok != true || studentId == null) return;
    try {
      await ref.read(hifzControllerProvider.notifier).addEntry(
            studentId: studentId!,
            fromJuz: int.tryParse(fromJuz.text) ?? 1,
            fromPage: int.tryParse(fromPage.text) ?? 1,
            toJuz: int.tryParse(toJuz.text) ?? 1,
            toPage: int.tryParse(toPage.text) ?? 1,
            stream: stream,
            quality: quality,
          );
      showAppSuccess('হিফজ এন্ট্রি সেভ');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hifzControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('হিফজ')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _addEntry(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('এন্ট্রি'),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(hifzControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('হিফজ রেকর্ড নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(hifzControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['studentName']?.toString() ?? '—'),
                  subtitle: Text(
                    [
                      if (m['currentJuz'] != null) 'Juz ${m['currentJuz']}',
                      m['currentSurah'],
                      if (m['memorizedPages'] != null)
                        '${m['memorizedPages']} পৃষ্ঠা',
                    ].whereType<Object>().join(' · '),
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
