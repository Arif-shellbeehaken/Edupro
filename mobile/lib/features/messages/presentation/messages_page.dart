import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/messages/presentation/messages_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class MessagesPage extends ConsumerWidget {
  const MessagesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(messagesControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'SMS / মেসেজ',
      asyncValue: async,
      onRefresh: () => ref.read(messagesControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['subject']?.toString() ?? m['channel']?.toString() ?? '—'),
              subtitle: Text(
                [m['recipient'], m['status'], m['createdAt']]
                    .whereType<Object>()
                    .join(' · '),
              ),
            ),
          );
      },
    );
  }
}
