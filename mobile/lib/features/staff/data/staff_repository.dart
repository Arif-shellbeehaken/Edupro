import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class StaffRepository {
  StaffRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/staff', query: {'take': 50}, logTag: 'staff');

  Future<void> requestLeave({
    required String staffId,
    required String startDate,
    required String endDate,
    String leaveType = 'CASUAL',
    String? reason,
  }) async {
    try {
      await _api.dio.post('/api/v1/staff/leave', data: {
        'staffId': staffId,
        'startDate': startDate,
        'endDate': endDate,
        'leaveType': leaveType,
        if (reason != null) 'reason': reason,
      });
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'staff.leave');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }
}
