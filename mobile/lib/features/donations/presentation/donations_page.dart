import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/donations/presentation/donations_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class DonationsPage extends ConsumerWidget {
  const DonationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(donationsControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'দান / যাকাত',
      asyncValue: async,
      onRefresh: () => ref.read(donationsControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['donorName']?.toString() ?? '—'),
              subtitle: Text(
                [
                  if (m['amount'] != null) '৳${m['amount']}',
                  m['category'],
                  m['donatedAt'],
                ].whereType<Object>().join(' · '),
              ),
            ),
          );
      },
    );
  }
}
