import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/features/notices/data/notices_repository.dart';
import 'package:edupro_mobile/features/notices/presentation/notices_provider.dart';

class NoticesPage extends ConsumerWidget {
  const NoticesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(noticesControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('নোটিশ')),
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
