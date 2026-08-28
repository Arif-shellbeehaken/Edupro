import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/notices/data/notices_repository.dart';

final noticesControllerProvider =
    AsyncNotifierProvider.autoDispose<NoticesController, List<NoticeDto>>(
  NoticesController.new,
);

class NoticesController extends AutoDisposeAsyncNotifier<List<NoticeDto>> {
  @override
  Future<List<NoticeDto>> build() {
    return ref.read(noticesRepositoryProvider).list();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(noticesRepositoryProvider).list(),
    );
  }
}
