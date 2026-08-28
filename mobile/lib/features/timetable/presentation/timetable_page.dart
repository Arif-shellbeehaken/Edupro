import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/timetable/presentation/timetable_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class TimetablePage extends ConsumerWidget {
  const TimetablePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(timetableControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'রুটিন',
      asyncValue: async,
      onRefresh: () => ref.read(timetableControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['subject']?.toString() ?? '—'),
              subtitle: Text(
                [
                  if (m['dayOfWeek'] != null) 'Day ${m['dayOfWeek']}',
                  '${m['startTime'] ?? ''}–${m['endTime'] ?? ''}',
                  m['room'],
                ].whereType<Object>().join(' · '),
              ),
            ),
          );
      },
    );
  }
}
