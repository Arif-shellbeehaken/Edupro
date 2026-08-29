import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/library/data/library_repository.dart';

final libraryRepositoryProvider = Provider(
  (ref) => LibraryRepository(ref.watch(apiClientProvider)),
);

final libraryControllerProvider = AsyncNotifierProvider.autoDispose<
    LibraryController, List<Map<String, dynamic>>>(LibraryController.new);

class LibraryController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() =>
      ref.read(libraryRepositoryProvider).listIssues();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(libraryRepositoryProvider).listIssues(),
    );
  }

  Future<void> issue({
    required String bookId,
    String? studentId,
  }) async {
    await ref.read(libraryRepositoryProvider).issue(
          bookId: bookId,
          studentId: studentId,
        );
    await refresh();
  }

  Future<int> returnBook(String issueId) async {
    final fine =
        await ref.read(libraryRepositoryProvider).returnBook(issueId);
    await refresh();
    return fine;
  }
}
