import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/inventory/data/inventory_repository.dart';

final inventoryRepositoryProvider = Provider(
  (ref) => InventoryRepository(ref.watch(apiClientProvider)),
);

final inventoryControllerProvider = AsyncNotifierProvider.autoDispose<
    InventoryController, List<Map<String, dynamic>>>(InventoryController.new);

class InventoryController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() =>
      ref.read(inventoryRepositoryProvider).list();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(inventoryRepositoryProvider).list(),
    );
  }

  Future<void> stock({
    required String itemId,
    required String type,
    required int quantity,
  }) async {
    await ref.read(inventoryRepositoryProvider).stock(
          itemId: itemId,
          type: type,
          quantity: quantity,
        );
    await refresh();
  }
}
