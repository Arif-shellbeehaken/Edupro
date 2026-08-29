import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/hifz/data/hifz_repository.dart';

final hifzRepositoryProvider = Provider(
  (ref) => HifzRepository(ref.watch(apiClientProvider)),
);

final hifzControllerProvider =
    AsyncNotifierProvider.autoDispose<HifzController, List<Map<String, dynamic>>>(
  HifzController.new,
);

class HifzController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() =>
      ref.read(hifzRepositoryProvider).list();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(hifzRepositoryProvider).list());
  }

  Future<void> addEntry({
    required String studentId,
    required int fromJuz,
    required int fromPage,
    required int toJuz,
    required int toPage,
    String stream = 'SABAK',
    String quality = 'GOOD',
  }) async {
    await ref.read(hifzRepositoryProvider).addEntry(
          studentId: studentId,
          fromJuz: fromJuz,
          fromPage: fromPage,
          toJuz: toJuz,
          toPage: toPage,
          stream: stream,
          quality: quality,
        );
    await refresh();
  }
}
