import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/features/attendance/data/attendance_repository.dart';
import 'package:edupro_mobile/features/attendance/presentation/attendance_provider.dart';

class AttendancePage extends ConsumerWidget {
  const AttendancePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(attendanceControllerProvider);
    final date = ref.watch(attendanceDateProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/attendance/mark'),
        icon: const Icon(Icons.edit_calendar),
        label: const Text('মার্ক'),
      ),
      appBar: AppBar(
        title: const Text('উপস্থিতি'),
        actions: [
          IconButton(
            tooltip: 'তারিখ',
            icon: const Icon(Icons.calendar_today_outlined),
            onPressed: () async {
              final now = DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: date != null
                    ? DateTime.tryParse(date) ?? now
                    : now,
                firstDate: DateTime(now.year - 2),
                lastDate: now,
              );
              if (picked != null) {
                final ymd =
                    '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                ref.read(attendanceDateProvider.notifier).state = ymd;
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          if (date != null)
            ListTile(
              dense: true,
              title: Text('তারিখ: $date'),
              trailing: TextButton(
                onPressed: () =>
                    ref.read(attendanceDateProvider.notifier).state = null,
                child: const Text('আজ'),
              ),
            ),
          Expanded(
            child: AsyncValueWidget<List<AttendanceDto>>(
              value: async,
              onRetry: () =>
                  ref.read(attendanceControllerProvider.notifier).refresh(),
              empty: const Center(child: Text('রেকর্ড নেই')),
              data: (list) => RefreshIndicator(
                onRefresh: () =>
                    ref.read(attendanceControllerProvider.notifier).refresh(),
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
              ),
            ),
          ),
        ],
      ),
    );
  }
}
