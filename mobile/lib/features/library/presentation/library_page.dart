import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/library/presentation/library_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class LibraryPage extends ConsumerWidget {
  const LibraryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(libraryControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'লাইব্রেরি',
      asyncValue: async,
      onRefresh: () => ref.read(libraryControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['bookTitle']?.toString() ?? '—'),
              subtitle: Text(
                [m['studentName'], m['dueDate']]
                    .whereType<Object>()
                    .join(' · '),
              ),
            ),
          );
      },
    );
  }
}
