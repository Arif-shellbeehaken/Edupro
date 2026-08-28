import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/attendance/data/attendance_repository.dart';

final attendanceProvider = FutureProvider.autoDispose((ref) {
  final api = ref.watch(apiClientProvider);
  return AttendanceRepository(api).list();
});

class AttendancePage extends ConsumerWidget {
  const AttendancePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(attendanceProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('উপস্থিতি')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => const Center(child: Text('লোড ব্যর্থ')),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('আজকের রেকর্ড নেই'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(attendanceProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final a = list[i];
                return Card(
                  child: ListTile(
                    title: Text(a.studentName ?? '—'),
                    subtitle: Text(a.date ?? ''),
                    trailing: Chip(
                      label: Text(a.status ?? '—'),
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
