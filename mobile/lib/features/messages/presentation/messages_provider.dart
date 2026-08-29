import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/features/messages/data/messages_repository.dart';

final messagesRepositoryProvider = Provider(
  (ref) => MessagesRepository(ref.watch(apiClientProvider)),
);

final messagesControllerProvider = AsyncNotifierProvider.autoDispose<
    MessagesController, List<Map<String, dynamic>>>(MessagesController.new);

class MessagesController
    extends AutoDisposeAsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() =>
      ref.read(messagesRepositoryProvider).list();

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(messagesRepositoryProvider).list(),
    );
  }

  Future<void> send({
    required String recipient,
    required String body,
    String channel = 'SMS',
  }) async {
    await ref.read(messagesRepositoryProvider).send(
          recipient: recipient,
          body: body,
          channel: channel,
        );
    await refresh();
  }
}
