import 'package:flutter/foundation.dart';
import 'package:edupro_mobile/core/error/failures.dart';

/// Central log sink — swap for Crashlytics/Sentry in production.
class ErrorLogger {
  ErrorLogger._();

  static void log(
    Object error, [
    StackTrace? stack,
    String? context,
  ]) {
    final tag = context != null ? '[$context] ' : '';
    if (error is Failure) {
      debugPrint(
        '⚠️ $tag${error.runtimeType}: ${error.message}'
        '${error.statusCode != null ? ' status=${error.statusCode}' : ''}'
        '${error.requestId != null ? ' req=${error.requestId}' : ''}',
      );
    } else {
      debugPrint('❌ $tag$error');
    }
    if (stack != null && kDebugMode) {
      debugPrint(stack.toString());
    }
  }
}
