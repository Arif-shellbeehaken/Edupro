import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/hostel/data/hostel_repository.dart';

final hostelRepositoryProvider = Provider((ref) => HostelRepository(ref.watch(apiClientProvider)));

final hostelControllerProvider = AsyncNotifierProvider.autoDispose<HostelController, List<Map<String, dynamic>>>(HostelController.new);

class HostelController extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() => ref.read(hostelRepositoryProvider).listAllocations();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(hostelRepositoryProvider).listAllocations());
  }

  Future<void> allocate({required String roomId, required String studentId}) async {
    await ref.read(hostelRepositoryProvider).allocate(roomId: roomId, studentId: studentId);
    await refresh();
  }

  Future<void> end(String id) async {
    await ref.read(hostelRepositoryProvider).end(id);
    await refresh();
  }
}
