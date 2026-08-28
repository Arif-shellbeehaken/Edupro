import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';

Future<List<Map<String, dynamic>>> fetchList(
  ApiClient api,
  String path, {
  Map<String, dynamic>? query,
  String logTag = 'fetchList',
}) async {
  try {
    final res = await api.dio.get<Map<String, dynamic>>(
      path,
      queryParameters: query,
    );
    final list = res.data?['data'];
    if (list is! List) return [];
    return list
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  } on Failure {
    rethrow;
  } on DioException catch (e, st) {
    final f =
        e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
    ErrorLogger.log(f, st, logTag);
    if (f is AuthFailure) await api.clearSessionOnUnauthorized(f);
    throw f;
  } catch (e, st) {
    ErrorLogger.log(e, st, logTag);
    throwMapped(e, st);
  }
}
