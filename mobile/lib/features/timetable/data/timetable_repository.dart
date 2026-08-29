import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class TimetableRepository {
  TimetableRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/timetable', query: {'take': 80}, logTag: 'timetable');

  Future<void> upsert({
    required int dayOfWeek,
    required int periodNo,
    required String startTime,
    required String endTime,
    String? room,
  }) async {
    try {
      await _api.dio.post('/api/v1/timetable', data: {
        'dayOfWeek': dayOfWeek,
        'periodNo': periodNo,
        'startTime': startTime,
        'endTime': endTime,
        if (room != null) 'room': room,
      });
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'timetable.upsert');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }
}
