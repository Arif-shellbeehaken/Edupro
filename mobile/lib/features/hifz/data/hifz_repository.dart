import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class HifzRepository {
  HifzRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/hifz', query: {'take': 50}, logTag: 'hifz');

  Future<void> addEntry({
    required String studentId,
    required int fromJuz,
    required int fromPage,
    required int toJuz,
    required int toPage,
    String stream = 'SABAK',
    String quality = 'GOOD',
    String? teacherNote,
  }) async {
    try {
      await _api.dio.post(
        '/api/v1/hifz/entries',
        data: {
          'studentId': studentId,
          'stream': stream,
          'fromJuz': fromJuz,
          'fromPage': fromPage,
          'toJuz': toJuz,
          'toPage': toPage,
          'quality': quality,
          if (teacherNote != null) 'teacherNote': teacherNote,
        },
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'HifzRepository.addEntry');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }
}
