import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/timetable/presentation/timetable_provider.dart';

class TimetablePage extends ConsumerWidget {
  const TimetablePage({super.key});

  Future<void> _add(BuildContext context, WidgetRef ref) async {
    final start = TextEditingController(text: '09:00');
    final end = TextEditingController(text: '09:45');
    final room = TextEditingController();
    int day = 0;
    int period = 1;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('স্লট যোগ'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<int>(
                value: day,
                items: const [
                  DropdownMenuItem(value: 0, child: Text('রবি')),
                  DropdownMenuItem(value: 1, child: Text('সোম')),
                  DropdownMenuItem(value: 2, child: Text('মঙ্গল')),
                  DropdownMenuItem(value: 3, child: Text('বুধ')),
                  DropdownMenuItem(value: 4, child: Text('বৃহ')),
                  DropdownMenuItem(value: 5, child: Text('শুক্র')),
                  DropdownMenuItem(value: 6, child: Text('শনি')),
                ],
                onChanged: (v) => setSt(() => day = v ?? 0),
                decoration: const InputDecoration(labelText: 'দিন'),
              ),
              TextField(controller: start, decoration: const InputDecoration(labelText: 'শুরু (HH:MM)')),
              TextField(controller: end, decoration: const InputDecoration(labelText: 'শেষ (HH:MM)')),
              TextField(controller: room, decoration: const InputDecoration(labelText: 'রুম')),
              TextField(
                decoration: const InputDecoration(labelText: 'পিরিয়ড নং'),
                keyboardType: TextInputType.number,
                onChanged: (v) => period = int.tryParse(v) ?? 1,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('বাতিল')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('সেভ')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(timetableControllerProvider.notifier).upsert(
        dayOfWeek: day,
        periodNo: period,
        startTime: start.text.trim(),
        endTime: end.text.trim(),
        room: room.text.trim().isEmpty ? null : room.text.trim(),
      );
      showAppSuccess('স্লট সেভ');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(timetableControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('রুটিন')),
      floatingActionButton: FloatingActionButton(onPressed: () => _add(context, ref), child: const Icon(Icons.add)),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(timetableControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো স্লট নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(timetableControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['subject']?.toString() ?? 'পিরিয়ড ${m['periodNo'] ?? ''}'),
                  subtitle: Text([if (m['dayOfWeek'] != null) 'Day ${m['dayOfWeek']}', '${m['startTime'] ?? ''}–${m['endTime'] ?? ''}', m['room']].whereType<Object>().join(' · ')),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
