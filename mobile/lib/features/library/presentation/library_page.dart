import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/library/presentation/library_provider.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';

class LibraryPage extends ConsumerWidget {
  const LibraryPage({super.key});

  Future<void> _issue(BuildContext context, WidgetRef ref) async {
    final books =
        await ref.read(libraryRepositoryProvider).listBooks();
    final students =
        ref.read(studentsControllerProvider).valueOrNull ?? [];
    if (books.isEmpty) {
      showAppError(const NotFoundFailure('কোনো বই নেই'));
      return;
    }
    String? bookId = books.first['id']?.toString();
    String? studentId =
        students.isNotEmpty && students.first.id.isNotEmpty
            ? students.first.id
            : null;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          title: const Text('বই ইস্যু'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: bookId,
                items: [
                  for (final b in books)
                    DropdownMenuItem(
                      value: b['id']?.toString(),
                      child: Text(
                        '${b['title']} (${b['availableCopies']})',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: (v) => setSt(() => bookId = v),
                decoration: const InputDecoration(labelText: 'বই'),
              ),
              if (students.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: studentId,
                  items: [
                    for (final s in students)
                      if (s.id.isNotEmpty)
                        DropdownMenuItem(
                          value: s.id,
                          child: Text(s.nameBn ?? s.name),
                        ),
                  ],
                  onChanged: (v) => setSt(() => studentId = v),
                  decoration: const InputDecoration(labelText: 'শিক্ষার্থী'),
                ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('বাতিল'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('ইস্যু'),
            ),
          ],
        ),
      ),
    );
    if (ok != true || bookId == null) return;
    try {
      await ref.read(libraryControllerProvider.notifier).issue(
            bookId: bookId!,
            studentId: studentId,
          );
      showAppSuccess('বই ইস্যু হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  Future<void> _return(
    BuildContext context,
    WidgetRef ref,
    String issueId,
  ) async {
    try {
      final fine =
          await ref.read(libraryControllerProvider.notifier).returnBook(issueId);
      showAppSuccess(
        fine > 0 ? 'রিটার্ন · জরিমানা ৳$fine' : 'রিটার্ন সম্পন্ন',
      );
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(libraryControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('লাইব্রেরি')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _issue(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('ইস্যু'),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(libraryControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('সক্রিয় ইস্যু নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () =>
              ref.read(libraryControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              final id = m['id']?.toString();
              return Card(
                child: ListTile(
                  title: Text(m['bookTitle']?.toString() ?? '—'),
                  subtitle: Text(
                    [m['studentName'], m['dueDate']]
                        .whereType<Object>()
                        .join(' · '),
                  ),
                  trailing: id != null
                      ? TextButton(
                          onPressed: () => _return(context, ref, id),
                          child: const Text('রিটার্ন'),
                        )
                      : null,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
