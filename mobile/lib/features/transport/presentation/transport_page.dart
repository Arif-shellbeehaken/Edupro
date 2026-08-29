import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';
import 'package:edupro_mobile/features/transport/presentation/transport_provider.dart';

class TransportPage extends ConsumerWidget {
  const TransportPage({super.key});

  Future<void> _assign(BuildContext context, WidgetRef ref) async {
    final routes = await ref.read(transportRepositoryProvider).listRoutes();
    final students = ref.read(studentsControllerProvider).valueOrNull ?? [];
    if (routes.isEmpty) {
      showAppError(const NotFoundFailure('রুট নেই'));
      return;
    }
    String? routeId = routes.first['id']?.toString();
    String? studentId = students.where((s) => s.id.isNotEmpty).isEmpty ? null : students.where((s) => s.id.isNotEmpty).first.id;
    final pickup = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('রুটে অ্যাসাইন'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: routeId,
                items: [for (final r in routes) DropdownMenuItem(value: r['id']?.toString(), child: Text('${r['name']} ${r['vehicleNo'] ?? ''}'))],
                onChanged: (v) => setSt(() => routeId = v),
                decoration: const InputDecoration(labelText: 'রুট'),
              ),
              if (students.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: studentId,
                  items: [for (final s in students) if (s.id.isNotEmpty) DropdownMenuItem(value: s.id, child: Text(s.nameBn ?? s.name))],
                  onChanged: (v) => setSt(() => studentId = v),
                  decoration: const InputDecoration(labelText: 'শিক্ষার্থী'),
                ),
              TextField(controller: pickup, decoration: const InputDecoration(labelText: 'পিকআপ পয়েন্ট')),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('বাতিল')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('অ্যাসাইন')),
          ],
        ),
      ),
    );
    if (ok != true || routeId == null || studentId == null) return;
    try {
      await ref.read(transportControllerProvider.notifier).assign(
        routeId: routeId!,
        studentId: studentId!,
        pickupPoint: pickup.text.trim().isEmpty ? null : pickup.text.trim(),
      );
      showAppSuccess('অ্যাসাইন হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(transportControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('ট্রান্সপোর্ট')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _assign(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('অ্যাসাইন'),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(transportControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('অ্যাসাইনমেন্ট নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(transportControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(m['studentName']?.toString() ?? '—'),
                  subtitle: Text([m['routeName'], m['vehicleNo'], m['pickupPoint']].whereType<Object>().join(' · ')),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
