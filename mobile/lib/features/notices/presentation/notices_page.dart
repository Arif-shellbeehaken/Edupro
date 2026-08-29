import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/notices/data/notices_repository.dart';
import 'package:edupro_mobile/features/notices/presentation/notices_provider.dart';

class NoticesPage extends ConsumerWidget {
  const NoticesPage({super.key});

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('নতুন নোটিশ'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'শিরোনাম *'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: bodyCtrl,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'বিবরণ *'),
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
            child: const Text('প্রকাশ'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    if (titleCtrl.text.trim().isEmpty || bodyCtrl.text.trim().isEmpty) {
      showAppError(const ValidationFailure('শিরোনাম ও বিবরণ দিন'));
      return;
    }
    try {
      await ref.read(noticesRepositoryProvider).create(
            title: titleCtrl.text.trim(),
            body: bodyCtrl.text.trim(),
          );
      ref.invalidate(noticesControllerProvider);
      showAppSuccess('নোটিশ প্রকাশ হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(noticesControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('নোটিশ')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _create(context, ref),
        child: const Icon(Icons.add),
      ),
      body: AsyncValueWidget<List<NoticeDto>>(
        value: async,
        onRetry: () => ref.read(noticesControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো নোটিশ নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () =>
              ref.read(noticesControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final n = list[i];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        n.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      if (n.audience != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          n.audience!,
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                      ],
                      if (n.body != null && n.body!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(n.body!),
                      ],
                    ],
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
