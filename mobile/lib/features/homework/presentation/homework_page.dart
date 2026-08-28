import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/homework/presentation/homework_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class HomeworkPage extends ConsumerWidget {
  const HomeworkPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(homeworkControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'হোমওয়ার্ক',
      asyncValue: async,
      onRefresh: () => ref.read(homeworkControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
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
    );
  }
}
