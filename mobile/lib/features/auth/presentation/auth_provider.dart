import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/features/auth/domain/user_entity.dart';

/// Session user — `null` means logged out.
final authControllerProvider =
    AsyncNotifierProvider<AuthController, UserEntity?>(AuthController.new);

/// Convenience selector for widgets that only need the user object.
final currentUserProvider = Provider<UserEntity?>((ref) {
  return ref.watch(authControllerProvider).valueOrNull;
});

final isAuthLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authControllerProvider).isLoading;
});

class AuthController extends AsyncNotifier<UserEntity?> {
  @override
  Future<UserEntity?> build() {
    return ref.read(authRepositoryProvider).restoreSession();
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    final result = await AsyncValue.guard(() {
      return ref.read(authRepositoryProvider).login(
            email: email,
            password: password,
          );
    });
    if (result.hasError) {
      ErrorLogger.log(result.error!, result.stackTrace, 'AuthController.login');
      state = const AsyncValue.data(null);
      throw result.error!;
    }
    state = result;
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncValue.data(null);
  }
}
