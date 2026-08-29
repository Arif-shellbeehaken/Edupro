import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class HostelRepository {
  HostelRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> listAllocations() =>
      fetchList(_api, '/api/v1/hostel', query: {'take': 50}, logTag: 'hostel');

  Future<List<Map<String, dynamic>>> listRooms() =>
      fetchList(_api, '/api/v1/hostel/rooms', logTag: 'rooms');

  Future<void> allocate({required String roomId, required String studentId}) async {
    try {
      await _api.dio.post('/api/v1/hostel/allocate', data: {
        'roomId': roomId,
        'studentId': studentId,
      });
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'hostel.allocate');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }

  Future<void> end(String allocationId) async {
    try {
      await _api.dio.post('/api/v1/hostel/end', data: {'allocationId': allocationId});
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'hostel.end');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }
}
