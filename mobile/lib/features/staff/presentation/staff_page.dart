import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/staff/presentation/staff_provider.dart';

class StaffPage extends ConsumerWidget {
  const StaffPage({super.key});

  Future<void> _leave(BuildContext context, WidgetRef ref, Map<String, dynamic> staff) async {
    final id = staff['id']?.toString();
    if (id == null) return;
    final now = DateTime.now();
    final start = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    final end = start;
    try {
      await ref.read(staffRepositoryProvider).requestLeave(
        staffId: id,
        startDate: start,
        endDate: end,
        leaveType: 'CASUAL',
        reason: 'Mobile leave request',
      );
      showAppSuccess('ছুটির আবেদন জমা');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(staffControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('স্টাফ / HR')),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(staffControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('স্টাফ নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(staffControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['name']?.toString() ?? '—'),
                  subtitle: Text([m['staffId'], m['designation'], m['department']].whereType<Object>().join(' · ')),
                  trailing: TextButton(
                    onPressed: () => _leave(context, ref, m),
                    child: const Text('ছুটি'),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
