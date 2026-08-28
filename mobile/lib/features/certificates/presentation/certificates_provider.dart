import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/certificates/data/certificates_repository.dart';

final certificatesRepositoryProvider = Provider(
  (ref) => CertificatesRepository(ref.watch(apiClientProvider)),
);

final certificatesControllerProvider =
    AsyncNotifierProvider.autoDispose<CertificatesController, List<Map<String, dynamic>>>(
  CertificatesController.new,
);

class CertificatesController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() {
    return ref.read(certificatesRepositoryProvider).list();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(certificatesRepositoryProvider).list());
  }
}
