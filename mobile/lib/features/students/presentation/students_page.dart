import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/students/data/students_repository.dart';

final studentsProvider = FutureProvider.autoDispose((ref) {
  final api = ref.watch(apiClientProvider);
  return StudentsRepository(api).list();
});

class StudentsPage extends ConsumerWidget {
  const StudentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(studentsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('শিক্ষার্থী')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              e.toString().contains('Auth') ? 'লগইন প্রয়োজন' : 'লোড ব্যর্থ',
              textAlign: TextAlign.center,
            ),
          ),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('কোনো শিক্ষার্থী নেই'));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(studentsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final s = list[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text((s.nameBn ?? s.name).characters.first),
                    ),
                    title: Text(s.nameBn ?? s.name),
                    subtitle: Text(
                      [
                        s.studentId,
                        if (s.rollNumber != null) 'রোল ${s.rollNumber}',
                        s.status,
                      ].whereType<String>().join(' · '),
                    ),
                    trailing: s.guardianPhone != null
                        ? const Icon(Icons.phone_outlined, size: 18)
                        : null,
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
