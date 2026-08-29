import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class HomeworkRepository {
  HomeworkRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/homework', query: {'take': 50}, logTag: 'homework');

  Future<void> create({
    required String title,
    String? description,
    String? subjectName,
    String? dueDate,
  }) async {
    try {
      await _api.dio.post(
        '/api/v1/homework',
        data: {
          'title': title,
          if (description != null) 'description': description,
          if (subjectName != null) 'subjectName': subjectName,
          if (dueDate != null) 'dueDate': dueDate,
        },
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'HomeworkRepository.create');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }
}
