import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/fees/data/fees_repository.dart';

final feesRepositoryProvider = Provider(
  (ref) => FeesRepository(ref.watch(apiClientProvider)),
);

final feesControllerProvider =
    AsyncNotifierProvider.autoDispose<FeesController, List<Map<String, dynamic>>>(
  FeesController.new,
);

class FeesController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() {
    return ref.read(feesRepositoryProvider).list();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(feesRepositoryProvider).list());
  }

  Future<void> pay({
    required String invoiceId,
    required num amount,
    String method = 'CASH',
  }) async {
    await ref.read(feesRepositoryProvider).pay(
          invoiceId: invoiceId,
          amount: amount,
          method: method,
        );
    await refresh();
  }
}
