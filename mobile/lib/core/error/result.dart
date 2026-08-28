import 'package:edupro_mobile/core/error/failures.dart';

/// Lightweight Result type for optional non-throwing flows.
sealed class Result<T> {
  const Result();

  R when<R>({
    required R Function(T data) success,
    required R Function(Failure failure) failure,
  });
}

class Success<T> extends Result<T> {
  const Success(this.data);
  final T data;

  @override
  R when<R>({
    required R Function(T data) success,
    required R Function(Failure failure) failure,
  }) =>
      success(data);
}

class Err<T> extends Result<T> {
  const Err(this.failure);
  final Failure failure;

  @override
  R when<R>({
    required R Function(T data) success,
    required R Function(Failure failure) failure,
  }) =>
      failure(this.failure);
}
