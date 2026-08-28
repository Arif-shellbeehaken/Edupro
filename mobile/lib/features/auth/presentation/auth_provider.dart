import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/storage/token_storage.dart';
import 'package:edupro_mobile/features/auth/data/auth_repository.dart';
import 'package:edupro_mobile/features/auth/domain/user_entity.dart';

final tokenStorageProvider = Provider((ref) => TokenStorage());

final apiClientProvider = Provider(
  (ref) => ApiClient(ref.watch(tokenStorageProvider)),
);

final authRepositoryProvider = Provider(
  (ref) => AuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStorageProvider),
  ),
);

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserEntity?>>(
  (ref) => AuthNotifier(ref.watch(authRepositoryProvider)),
);

class AuthNotifier extends StateNotifier<AsyncValue<UserEntity?>> {
  AuthNotifier(this._repo) : super(const AsyncValue.loading()) {
    _bootstrap();
  }

  final AuthRepository _repo;

  Future<void> _bootstrap() async {
    try {
      final user = await _repo.restoreSession();
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final user = await _repo.login(email: email, password: password);
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncValue.data(null);
  }
}
