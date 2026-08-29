import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/hostel/presentation/hostel_provider.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';

class HostelPage extends ConsumerWidget {
  const HostelPage({super.key});

  Future<void> _allocate(BuildContext context, WidgetRef ref) async {
    final rooms = await ref.read(hostelRepositoryProvider).listRooms();
    final students = ref.read(studentsControllerProvider).valueOrNull ?? [];
    if (rooms.isEmpty) {
      showAppError(const NotFoundFailure('রুম নেই'));
      return;
    }
    String? roomId = rooms.first['id']?.toString();
    String? studentId = students.where((s) => s.id.isNotEmpty).isEmpty ? null : students.where((s) => s.id.isNotEmpty).first.id;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('রুম অ্যালোকেট'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: roomId,
                items: [for (final r in rooms) DropdownMenuItem(value: r['id']?.toString(), child: Text('${r['blockName'] ?? ''} ${r['roomNumber']} (${r['occupied']}/${r['capacity']})'))],
                onChanged: (v) => setSt(() => roomId = v),
                decoration: const InputDecoration(labelText: 'রুম'),
              ),
              if (students.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: studentId,
                  items: [for (final s in students) if (s.id.isNotEmpty) DropdownMenuItem(value: s.id, child: Text(s.nameBn ?? s.name))],
                  onChanged: (v) => setSt(() => studentId = v),
                  decoration: const InputDecoration(labelText: 'শিক্ষার্থী'),
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
    if (ok != true || roomId == null || studentId == null) return;
    try {
      await ref.read(hostelControllerProvider.notifier).allocate(roomId: roomId!, studentId: studentId!);
      showAppSuccess('অ্যালোকেশন হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hostelControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('হোস্টেল')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _allocate(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('অ্যালোকেট'),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(hostelControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('অ্যালোকেশন নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(hostelControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              final id = m['id']?.toString();
              return Card(
                child: ListTile(
                  title: Text(m['studentName']?.toString() ?? '—'),
                  subtitle: Text([m['building'], m['room']].whereType<Object>().join(' · ')),
                  trailing: id == null ? null : TextButton(
                    onPressed: () async {
                      try {
                        await ref.read(hostelControllerProvider.notifier).end(id);
                        showAppSuccess('অ্যালোকেশন শেষ');
                      } catch (e) {
                        showAppError(e is Failure ? e : UnknownFailure(e.toString()));
                      }
                    },
                    child: const Text('শেষ'),
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
