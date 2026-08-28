import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/config/env.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/storage/token_storage.dart';

class ApiClient {
  ApiClient(this._tokenStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: const Duration(milliseconds: Env.connectTimeoutMs),
        receiveTimeout: const Duration(milliseconds: Env.receiveTimeoutMs),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status != null && status >= 200 && status < 300,
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['X-Request-Id'] ??=
              'm_${DateTime.now().millisecondsSinceEpoch}';
          handler.next(options);
        },
        onError: (error, handler) {
          final failure = ExceptionMapper.fromDio(error);
          ErrorLogger.log(failure, error.stackTrace, 'ApiClient');
          // Attach domain failure for repositories
          handler.next(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: failure,
              message: failure.message,
              stackTrace: error.stackTrace,
            ),
          );
        },
      ),
    );

    if (Env.apiBaseUrl.contains('localhost') ||
        Env.apiBaseUrl.contains('10.0.2.2')) {
      _dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          error: true,
          logPrint: (o) => ErrorLogger.log(o.toString(), null, 'HTTP'),
        ),
      );
    }
  }

  final TokenStorage _tokenStorage;
  late final Dio _dio;

  Dio get dio => _dio;

  /// Clear token on hard 401 (session expired).
  Future<void> clearSessionOnUnauthorized(Failure f) async {
    if (f is AuthFailure || f.statusCode == 401) {
      await _tokenStorage.clear();
    }
  }
}
