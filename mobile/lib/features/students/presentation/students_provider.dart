import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/students/data/students_repository.dart';

/// Filter: ACTIVE | INACTIVE | ALL
final studentStatusFilterProvider = StateProvider<String>((ref) => 'ACTIVE');

/// Search query (client-side filter on loaded list).
final studentSearchProvider = StateProvider<String>((ref) => '');

final studentsControllerProvider =
    AsyncNotifierProvider.autoDispose<StudentsController, List<StudentDto>>(
  StudentsController.new,
);

/// Derived: filtered by search text.
final filteredStudentsProvider = Provider.autoDispose<AsyncValue<List<StudentDto>>>((ref) {
  final async = ref.watch(studentsControllerProvider);
  final q = ref.watch(studentSearchProvider).trim().toLowerCase();
  return async.whenData((list) {
    if (q.isEmpty) return list;
    return list.where((s) {
      final hay = '${s.name} ${s.nameBn ?? ''} ${s.studentId} ${s.rollNumber ?? ''}'
          .toLowerCase();
      return hay.contains(q);
    }).toList();
  });
});

class StudentsController extends AutoDisposeAsyncNotifier<List<StudentDto>> {
  @override
  Future<List<StudentDto>> build() {
    final status = ref.watch(studentStatusFilterProvider);
    return ref.read(studentsRepositoryProvider).list(status: status);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final status = ref.read(studentStatusFilterProvider);
      return ref.read(studentsRepositoryProvider).list(status: status);
    });
  }
}
