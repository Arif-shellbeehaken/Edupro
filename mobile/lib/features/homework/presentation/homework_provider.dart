import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/homework/data/homework_repository.dart';

final homeworkRepositoryProvider = Provider(
  (ref) => HomeworkRepository(ref.watch(apiClientProvider)),
);

final homeworkControllerProvider =
    AsyncNotifierProvider.autoDispose<HomeworkController, List<Map<String, dynamic>>>(
  HomeworkController.new,
);

class HomeworkController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() {
    return ref.read(homeworkRepositoryProvider).list();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(homeworkRepositoryProvider).list());
  }
}
