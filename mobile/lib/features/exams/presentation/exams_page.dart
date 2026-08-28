import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/exams/presentation/exams_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class ExamsPage extends ConsumerWidget {
  const ExamsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(examsControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'পরীক্ষা',
      asyncValue: async,
      onRefresh: () => ref.read(examsControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
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
    );
  }
}
