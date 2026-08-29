import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/messages/presentation/messages_provider.dart';

class MessagesPage extends ConsumerWidget {
  const MessagesPage({super.key});

  Future<void> _send(BuildContext context, WidgetRef ref) async {
    final phone = TextEditingController();
    final body = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('SMS পাঠান'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'মোবাইল *',
                hintText: '01XXXXXXXXX',
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: body,
              maxLines: 4,
              maxLength: 500,
              decoration: const InputDecoration(labelText: 'বার্তা *'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('বাতিল'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('পাঠান'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    if (phone.text.trim().length < 10 || body.text.trim().isEmpty) {
      showAppError(const ValidationFailure('সঠিক নম্বর ও বার্তা দিন'));
      return;
    }
    try {
      await ref.read(messagesControllerProvider.notifier).send(
            recipient: phone.text.trim(),
            body: body.text.trim(),
          );
      showAppSuccess('SMS পাঠানো হয়েছে / লগ হয়েছে');
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(messagesControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('SMS / মেসেজ')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _send(context, ref),
        icon: const Icon(Icons.send),
        label: const Text('পাঠান'),
      ),
      body: AsyncValueWidget<List<Map<String, dynamic>>>(
        value: async,
        onRetry: () => ref.read(messagesControllerProvider.notifier).refresh(),
        empty: const Center(child: Text('কোনো মেসেজ নেই')),
        data: (list) => RefreshIndicator(
          onRefresh: () =>
              ref.read(messagesControllerProvider.notifier).refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final m = list[i];
              return Card(
                child: ListTile(
                  title: Text(
                    m['subject']?.toString() ??
                        m['channel']?.toString() ??
                        'SMS',
                  ),
                  subtitle: Text(
                    [
                      m['recipient'],
                      m['status'],
                      m['body'],
                    ].whereType<Object>().join(' · '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
