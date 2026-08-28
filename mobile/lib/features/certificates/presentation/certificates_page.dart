import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/certificates/presentation/certificates_provider.dart';
import 'package:edupro_mobile/shared/widgets/module_list_page.dart';

class CertificatesPage extends ConsumerWidget {
  const CertificatesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(certificatesControllerProvider);
    return ModuleListPage<Map<String, dynamic>>(
      title: 'সার্টিফিকেট',
      asyncValue: async,
      onRefresh: () => ref.read(certificatesControllerProvider.notifier).refresh(),
      itemBuilder: (context, m) {
          return Card(
            child: ListTile(
              title: Text(m['studentName']?.toString() ?? '—'),
              subtitle: Text(
                [m['type'], m['certificateNo'], m['issuedAt']]
                    .whereType<Object>()
                    .join(' · '),
              ),
            ),
          );
      },
    );
  }
}
