import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/transport/data/transport_repository.dart';

final transportRepositoryProvider = Provider((ref) => TransportRepository(ref.watch(apiClientProvider)));

final transportControllerProvider = AsyncNotifierProvider.autoDispose<TransportController, List<Map<String, dynamic>>>(TransportController.new);

class TransportController extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() => ref.read(transportRepositoryProvider).listAssignments();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(transportRepositoryProvider).listAssignments());
  }

  Future<void> assign({required String routeId, required String studentId, String? pickupPoint}) async {
    await ref.read(transportRepositoryProvider).assign(routeId: routeId, studentId: studentId, pickupPoint: pickupPoint);
    await refresh();
  }
}
