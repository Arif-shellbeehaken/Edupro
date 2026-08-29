import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class ExamsRepository {
  ExamsRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/exams', query: {'take': 50}, logTag: 'exams');

  Future<void> create({
    required String name,
    String? nameBn,
    String examType = 'MIDTERM',
    String? startDate,
  }) async {
    try {
      await _api.dio.post(
        '/api/v1/exams',
        data: {
          'name': name,
          if (nameBn != null) 'nameBn': nameBn,
          'examType': examType,
          if (startDate != null) 'startDate': startDate,
        },
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'exams.create');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }
}
