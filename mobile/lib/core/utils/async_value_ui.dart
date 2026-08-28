import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/shared/widgets/error_view.dart';

extension AsyncValueUiX<T> on AsyncValue<T> {
  Failure? get asFailure {
    if (!hasError) return null;
    return ExceptionMapper.from(error!);
  }

  String? get errorMessage => asFailure?.message;
}

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
        final failure = ExceptionMapper.from(e);
        return ErrorView(failure: failure, onRetry: onRetry);
      },
    );
  }
}
