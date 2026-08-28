import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/home/data/dashboard_repository.dart';

final dashboardRepositoryProvider = Provider(
  (ref) => DashboardRepository(ref.watch(apiClientProvider)),
);

final dashboardControllerProvider =
    AsyncNotifierProvider.autoDispose<DashboardController, Map<String, dynamic>>(
  DashboardController.new,
);

class DashboardController
    extends AutoDisposeAsyncNotifier<Map<String, dynamic>> {
  @override
  Future<Map<String, dynamic>> build() {
    return ref.read(dashboardRepositoryProvider).stats();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(dashboardRepositoryProvider).stats(),
    );
  }
}
