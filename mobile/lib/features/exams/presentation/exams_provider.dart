import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/exams/data/exams_repository.dart';

final examsRepositoryProvider = Provider(
  (ref) => ExamsRepository(ref.watch(apiClientProvider)),
);

final examsControllerProvider =
    AsyncNotifierProvider.autoDispose<ExamsController, List<Map<String, dynamic>>>(
  ExamsController.new,
);

class ExamsController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() =>
      ref.read(examsRepositoryProvider).list();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(examsRepositoryProvider).list());
  }

  Future<void> create({
    required String name,
    String examType = 'MIDTERM',
  }) async {
    await ref.read(examsRepositoryProvider).create(
          name: name,
          examType: examType,
        );
    await refresh();
  }
}
