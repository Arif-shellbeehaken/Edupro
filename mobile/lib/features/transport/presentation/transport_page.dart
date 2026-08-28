import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/transport/presentation/transport_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class TransportPage extends ConsumerWidget {
  const TransportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(transportControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'ট্রান্সপোর্ট',
      asyncValue: async,
      onRefresh: () => ref.read(transportControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['studentName']?.toString() ?? '—'),
              subtitle: Text(
                [m['routeName'], m['vehicleNo'], m['pickupPoint']]
                    .whereType<Object>()
                    .join(' · '),
              ),
            ),
          );
      },
    );
  }
}
