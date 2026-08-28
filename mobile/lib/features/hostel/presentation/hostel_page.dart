import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/hostel/presentation/hostel_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class HostelPage extends ConsumerWidget {
  const HostelPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hostelControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'হোস্টেল',
      asyncValue: async,
      onRefresh: () => ref.read(hostelControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['studentName']?.toString() ?? '—'),
              subtitle: Text(
                [m['building'], m['room']]
                    .whereType<Object>()
                    .join(' · '),
              ),
            ),
          );
      },
    );
  }
}
