import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/homework/presentation/homework_provider.dart';

class HomeworkPage extends ConsumerWidget {
  const HomeworkPage({super.key});

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final title = TextEditingController();
    final subject = TextEditingController();
    final body = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('নতুন হোমওয়ার্ক'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: title,
                decoration: const InputDecoration(labelText: 'শিরোনাম *'),
              ),
              TextField(
                controller: subject,
                decoration: const InputDecoration(labelText: 'বিষয়'),
              ),
              TextField(
                controller: body,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'বিবরণ'),
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
            child: const Text('অ্যাসাইন'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    if (title.text.trim().isEmpty) {
      showAppError(const ValidationFailure('শিরোনাম দিন'));
      return;
    }
    try {
      await ref.read(homeworkControllerProvider.notifier).create(
            title: title.text.trim(),
            subjectName: subject.text.trim().isEmpty ? null : subject.text.trim(),
            description: body.text.trim().isEmpty ? null : body.text.trim(),
          );
      showAppSuccess('হোমওয়ার্ক অ্যাসাইন হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(homeworkControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('হোমওয়ার্ক')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _create(context, ref),
        child: const Icon(Icons.add),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(homeworkControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো হোমওয়ার্ক নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () =>
              ref.read(homeworkControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['title']?.toString() ?? '—'),
                  subtitle: Text(
                    [m['subject'], m['dueDate'], m['status']]
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
