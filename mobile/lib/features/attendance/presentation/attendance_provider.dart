import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/attendance/data/attendance_repository.dart';

/// Selected date (YYYY-MM-DD). null = today (server default).
final attendanceDateProvider = StateProvider<String?>((ref) => null);

final attendanceControllerProvider =
    AsyncNotifierProvider.autoDispose<AttendanceController, List<AttendanceDto>>(
  AttendanceController.new,
);

class AttendanceController extends AutoDisposeAsyncNotifier<List<AttendanceDto>> {
  @override
  Future<List<AttendanceDto>> build() {
    final date = ref.watch(attendanceDateProvider);
    return ref.read(attendanceRepositoryProvider).list(date: date);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final date = ref.read(attendanceDateProvider);
      return ref.read(attendanceRepositoryProvider).list(date: date);
    });
  }

  void setDate(String? yyyyMmDd) {
    ref.read(attendanceDateProvider.notifier).state = yyyyMmDd;
  }
}
