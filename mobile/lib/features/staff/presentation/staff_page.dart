import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/staff/presentation/staff_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class StaffPage extends ConsumerWidget {
  const StaffPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(staffControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'স্টাফ / HR',
      asyncValue: async,
      onRefresh: () => ref.read(staffControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['name']?.toString() ?? '—'),
              subtitle: Text(
                [m['staffId'], m['designation'], m['department']]
                    .whereType<Object>()
                    .join(' · '),
              ),
            ),
          );
      },
    );
  }
}
