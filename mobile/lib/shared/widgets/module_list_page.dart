import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/utils/async_value_ui.dart';

/// Generic list page driven by an AsyncValue provider + refresh callback.
class ModuleListPage<T> extends ConsumerWidget {
  const ModuleListPage({
    super.key,
    required this.title,
    required this.asyncValue,
    required this.onRefresh,
    required this.itemBuilder,
    this.emptyMessage = 'কোনো ডেটা নেই',
  });

  final String title;
  final AsyncValue<List<T>> asyncValue;
  final Future<void> Function() onRefresh;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final String emptyMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: AsyncValueWidget<List<T>>(
        value: asyncValue,
        onRetry: onRefresh,
        empty: Center(child: Text(emptyMessage)),
        data: (list) => RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) => itemBuilder(context, list[i]),
          ),
        ),
      ),
    );
  }
}
