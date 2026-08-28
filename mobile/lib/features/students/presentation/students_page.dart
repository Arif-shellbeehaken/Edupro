import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/features/students/data/students_repository.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';

class StudentsPage extends ConsumerWidget {
  const StudentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(filteredStudentsProvider);
    final filter = ref.watch(studentStatusFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('শিক্ষার্থী')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'নাম / ID / রোল খুঁজুন',
                prefixIcon: Icon(Icons.search),
                isDense: true,
              ),
              onChanged: (v) =>
                  ref.read(studentSearchProvider.notifier).state = v,
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                for (final s in ['ACTIVE', 'INACTIVE'])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(s == 'ACTIVE' ? 'সক্রিয়' : 'নিষ্ক্রিয়'),
                      selected: filter == s,
                      onSelected: (_) {
                        ref.read(studentStatusFilterProvider.notifier).state =
                            s;
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: AsyncValueWidget<List<StudentDto>>(
              value: async,
              onRetry: () =>
                  ref.read(studentsControllerProvider.notifier).refresh(),
              empty: const Center(child: Text('কোনো শিক্ষার্থী নেই')),
              data: (list) => RefreshIndicator(
                onRefresh: () =>
                    ref.read(studentsControllerProvider.notifier).refresh(),
                child: ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, i) {
                    final s = list[i];
                    final label = s.nameBn ?? s.name;
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          child: Text(
                            label.isNotEmpty ? label.characters.first : '?',
                          ),
                        ),
                        title: Text(label),
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
              ),
            ),
          ),
        ],
      ),
    );
  }
}
