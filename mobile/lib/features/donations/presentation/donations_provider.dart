import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/donations/data/donations_repository.dart';

final donationsRepositoryProvider = Provider((ref) => DonationsRepository(ref.watch(apiClientProvider)));
final donationsControllerProvider = AsyncNotifierProvider.autoDispose<DonationsController, List<Map<String, dynamic>>>(DonationsController.new);

class DonationsController extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() => ref.read(donationsRepositoryProvider).list();
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => ref.read(donationsRepositoryProvider).list());
  }
  Future<void> create({required String donorName, required num amount, String category = 'GENERAL'}) async {
    await ref.read(donationsRepositoryProvider).create(donorName: donorName, amount: amount, category: category);
    await refresh();
  }
}
