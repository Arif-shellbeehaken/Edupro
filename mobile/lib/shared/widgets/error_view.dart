import 'package:flutter/material.dart';
import 'package:edupro_mobile/core/error/failures.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.failure,
    this.onRetry,
    this.compact = false,
  });

  final Failure failure;
  final VoidCallback? onRetry;
  final bool compact;

  IconData get _icon {
    return switch (failure) {
      NetworkFailure() => Icons.wifi_off_rounded,
      AuthFailure() => Icons.lock_outline,
      ForbiddenFailure() => Icons.gpp_bad_outlined,
      RateLimitFailure() => Icons.hourglass_top,
      NotFoundFailure() => Icons.search_off,
      ValidationFailure() => Icons.edit_note,
      _ => Icons.error_outline,
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (compact) {
      return Row(
        children: [
          Icon(_icon, size: 18, color: theme.colorScheme.error),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              failure.message,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.error,
              ),
            ),
          ),
          if (onRetry != null)
            TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(_icon, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: 12),
            Text(
              failure.message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge,
            ),
            if (failure.requestId != null) ...[
              const SizedBox(height: 6),
              Text(
                'Ref: ${failure.requestId}',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
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
  }
}
