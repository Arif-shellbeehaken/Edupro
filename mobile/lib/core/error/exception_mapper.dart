import 'dart:io';

import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/failures.dart';

/// Maps transport/API errors → domain [Failure].
class ExceptionMapper {
  ExceptionMapper._();

  static Failure from(Object error, [StackTrace? stack]) {
    if (error is Failure) return error;
    if (error is DioException) return fromDio(error);
    if (error is SocketException) {
      return const NetworkFailure('ইন্টারনেট সংযোগ নেই');
    }
    if (error is FormatException) {
      return const ServerFailure('সার্ভার রেসপন্স পার্স করা যায়নি');
    }
    return UnknownFailure(error.toString());
  }

  static Failure fromDio(DioException e) {
    final requestId = e.response?.headers.value('x-request-id') ??
        e.requestOptions.headers['X-Request-Id']?.toString();
    final status = e.response?.statusCode;
    final serverMsg = _extractMessage(e.response?.data);

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkFailure(
          'সংযোগের সময় শেষ — আবার চেষ্টা করুন',
          code: e.type.name,
          requestId: requestId,
          statusCode: status,
        );
      case DioExceptionType.connectionError:
        return NetworkFailure(
          'সার্ভারে সংযোগ হয়নি — নেটওয়ার্ক/API URL চেক করুন',
          code: e.type.name,
          requestId: requestId,
          statusCode: status,
        );
      case DioExceptionType.cancel:
        return const NetworkFailure('রিকোয়েস্ট বাতিল');
      case DioExceptionType.badCertificate:
        return const NetworkFailure('SSL সার্টিফিকেট সমস্যা');
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        return _fromStatus(status, serverMsg, requestId);
    }
  }

  static Failure _fromStatus(int? status, String? msg, String? requestId) {
    final m = (msg != null && msg.trim().isNotEmpty) ? msg.trim() : null;
    switch (status) {
      case 400:
        return ValidationFailure(
          m ?? 'অনুরোধ সঠিক নয়',
          code: 'bad_request',
          requestId: requestId,
          statusCode: status,
        );
      case 401:
        return AuthFailure(
          m ?? 'লগইন প্রয়োজন বা সেশন শেষ',
          code: 'unauthorized',
          requestId: requestId,
          statusCode: status,
        );
      case 403:
        return ForbiddenFailure(
          m ?? 'অনুমতি নেই',
          code: 'forbidden',
          requestId: requestId,
          statusCode: status,
        );
      case 404:
        return NotFoundFailure(
          m ?? 'রিসোর্স পাওয়া যায়নি',
          code: 'not_found',
          requestId: requestId,
          statusCode: status,
        );
      case 422:
        return ValidationFailure(
          m ?? 'ভ্যালিডেশন ব্যর্থ',
          code: 'validation',
          requestId: requestId,
          statusCode: status,
        );
      case 429:
        return RateLimitFailure(
          m ?? 'অনেক রিকোয়েস্ট — একটু পরে চেষ্টা করুন',
          code: 'rate_limit',
          requestId: requestId,
          statusCode: status,
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return ServerFailure(
          m ?? 'সার্ভার ত্রুটি ($status)',
          code: 'server',
          requestId: requestId,
          statusCode: status,
        );
      default:
        return ServerFailure(
          m ?? 'অনাকাঙ্ক্ষিত রেসপন্স (${status ?? '—'})',
          code: 'http',
          requestId: requestId,
          statusCode: status,
        );
    }
  }

  static String? _extractMessage(dynamic data) {
    if (data == null) return null;
    if (data is String && data.isNotEmpty) return data;
    if (data is Map) {
      final err = data['error'] ?? data['message'] ?? data['detail'];
      if (err is String) return err;
      if (err is List && err.isNotEmpty) return err.first.toString();
      if (data['errors'] is Map) {
        final first = (data['errors'] as Map).values.first;
        if (first is List && first.isNotEmpty) return first.first.toString();
        return first?.toString();
      }
    }
    return null;
  }
}

/// Throws domain [Failure] from any error (for repository catch blocks).
Never throwMapped(Object error, [StackTrace? stack]) {
  throw ExceptionMapper.from(error, stack);
}
