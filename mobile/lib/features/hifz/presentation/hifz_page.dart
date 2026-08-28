import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/hifz/presentation/hifz_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class HifzPage extends ConsumerWidget {
  const HifzPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hifzControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'হিফজ',
      asyncValue: async,
      onRefresh: () => ref.read(hifzControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['studentName']?.toString() ?? '—'),
              subtitle: Text(
                [
                  if (m['currentJuz'] != null) 'Juz ${m['currentJuz']}',
                  m['currentSurah'],
                  if (m['memorizedPages'] != null) '${m['memorizedPages']} পৃষ্ঠা',
                ].whereType<Object>().join(' · '),
              ),
            ),
          );
      },
    );
  }
}
