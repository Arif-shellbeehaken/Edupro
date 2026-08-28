import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/staff/data/staff_repository.dart';

final staffRepositoryProvider = Provider(
  (ref) => StaffRepository(ref.watch(apiClientProvider)),
);

final staffControllerProvider =
    AsyncNotifierProvider.autoDispose<StaffController, List<Map<String, dynamic>>>(
  StaffController.new,
);

class StaffController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() {
    return ref.read(staffRepositoryProvider).list();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(staffRepositoryProvider).list());
  }
}
