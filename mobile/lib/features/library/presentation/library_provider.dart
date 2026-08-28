import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/library/data/library_repository.dart';

final libraryRepositoryProvider = Provider(
  (ref) => LibraryRepository(ref.watch(apiClientProvider)),
);

final libraryControllerProvider =
    AsyncNotifierProvider.autoDispose<LibraryController, List<Map<String, dynamic>>>(
  LibraryController.new,
);

class LibraryController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() {
    return ref.read(libraryRepositoryProvider).list();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(libraryRepositoryProvider).list());
  }
}
