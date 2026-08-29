import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/timetable/data/timetable_repository.dart';

final timetableRepositoryProvider = Provider((ref) => TimetableRepository(ref.watch(apiClientProvider)));
final timetableControllerProvider = AsyncNotifierProvider.autoDispose<TimetableController, List<Map<String, dynamic>>>(TimetableController.new);

class TimetableController extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() => ref.read(timetableRepositoryProvider).list();
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(timetableRepositoryProvider).list());
  }
  Future<void> upsert({required int dayOfWeek, required int periodNo, required String startTime, required String endTime, String? room}) async {
    await ref.read(timetableRepositoryProvider).upsert(dayOfWeek: dayOfWeek, periodNo: periodNo, startTime: startTime, endTime: endTime, room: room);
    await refresh();
  }
}
