import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';

extension AsyncValueUiX<T> on AsyncValue<T> {
  String? get errorMessage {
    if (!hasError) return null;
    final e = error;
    if (e is Failure) return e.message;
    return e?.toString() ?? 'ত্রুটি';
  }
}

/// Shared loading / error / data renderer for Riverpod AsyncValue.
class AsyncValueWidget<T> extends StatelessWidget {
  const AsyncValueWidget({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
    this.loading,
    this.empty,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;
  final Widget? loading;
  final Widget? empty;

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: (d) {
        if (d is List && d.isEmpty && empty != null) return empty!;
        return data(d);
      },
      loading: () =>
          loading ?? const Center(child: CircularProgressIndicator()),
      error: (e, _) {
        final msg = e is Failure ? e.message : 'লোড ব্যর্থ';
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline,
                    size: 40, color: Theme.of(context).colorScheme.error),
                const SizedBox(height: 12),
                Text(msg, textAlign: TextAlign.center),
                if (onRetry != null) ...[
                  const SizedBox(height: 16),
                  FilledButton.tonal(
                    onPressed: onRetry,
                    child: const Text('আবার চেষ্টা'),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
