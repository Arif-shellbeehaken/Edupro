import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';

class DashboardRepository {
  DashboardRepository(this._api);
  final ApiClient _api;

  Future<Map<String, dynamic>> stats() async {
    try {
      final res = await _api.dio.get<Map<String, dynamic>>('/api/v1/dashboard');
      final data = res.data?['data'];
      if (data is Map<String, dynamic>) return data;
      if (data is Map) return Map<String, dynamic>.from(data);
      return {};
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'dashboard');
      throw f;
    } catch (e, st) {
      ErrorLogger.log(e, st, 'dashboard');
      throwMapped(e, st);
    }
  }
}
