import 'package:equatable/equatable.dart';

/// Domain-level failure — never expose raw Dio/stack to UI.
sealed class Failure extends Equatable {
  const Failure(this.message, {this.code, this.requestId, this.statusCode});

  final String message;
  final String? code;
  final String? requestId;
  final int? statusCode;

  @override
  List<Object?> get props => [message, code, requestId, statusCode];

  @override
  String toString() => message;
}

class NetworkFailure extends Failure {
  const NetworkFailure([
    super.message = 'ইন্টারনেট সংযোগ নেই বা সময় শেষ',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class AuthFailure extends Failure {
  const AuthFailure([
    super.message = 'লগইন প্রয়োজন',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class ForbiddenFailure extends Failure {
  const ForbiddenFailure([
    super.message = 'অনুমতি নেই',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class NotFoundFailure extends Failure {
  const NotFoundFailure([
    super.message = 'ডেটা পাওয়া যায়নি',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class ValidationFailure extends Failure {
  const ValidationFailure([
    super.message = 'ইনপুট সঠিক নয়',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class RateLimitFailure extends Failure {
  const RateLimitFailure([
    super.message = 'অনেক রিকোয়েস্ট — একটু পরে চেষ্টা করুন',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class ServerFailure extends Failure {
  const ServerFailure([
    super.message = 'সার্ভার ত্রুটি',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class CacheFailure extends Failure {
  const CacheFailure([
    super.message = 'লোকাল ডেটা পড়া যায়নি',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}

class UnknownFailure extends Failure {
  const UnknownFailure([
    super.message = 'অজানা ত্রুটি',
    super.code,
    super.requestId,
    super.statusCode,
  ]);
}
