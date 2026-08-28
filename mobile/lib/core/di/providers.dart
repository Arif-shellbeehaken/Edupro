import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/storage/token_storage.dart';
import 'package:edupro_mobile/features/attendance/data/attendance_repository.dart';
import 'package:edupro_mobile/features/auth/data/auth_repository.dart';
import 'package:edupro_mobile/features/notices/data/notices_repository.dart';
import 'package:edupro_mobile/features/students/data/students_repository.dart';

/// Infrastructure — single source of DI for the app.
final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(tokenStorageProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStorageProvider),
  );
});

final studentsRepositoryProvider = Provider<StudentsRepository>((ref) {
  return StudentsRepository(ref.watch(apiClientProvider));
});

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(ref.watch(apiClientProvider));
});

final noticesRepositoryProvider = Provider<NoticesRepository>((ref) {
  return NoticesRepository(ref.watch(apiClientProvider));
});
