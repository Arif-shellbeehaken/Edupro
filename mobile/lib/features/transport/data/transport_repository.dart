import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class TransportRepository {
  TransportRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> listAssignments() =>
      fetchList(_api, '/api/v1/transport', query: {'take': 50}, logTag: 'transport');

  Future<List<Map<String, dynamic>>> listRoutes() =>
      fetchList(_api, '/api/v1/transport/routes', logTag: 'routes');

  Future<void> assign({required String routeId, required String studentId, String? pickupPoint}) async {
    try {
      await _api.dio.post('/api/v1/transport/assign', data: {
        'routeId': routeId,
        'studentId': studentId,
        if (pickupPoint != null) 'pickupPoint': pickupPoint,
      });
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'transport.assign');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }
}
