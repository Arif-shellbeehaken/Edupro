import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class LibraryRepository {
  LibraryRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> listIssues() =>
      fetchList(_api, '/api/v1/library', query: {'take': 50}, logTag: 'library');

  Future<List<Map<String, dynamic>>> listBooks() =>
      fetchList(_api, '/api/v1/library/books', query: {'take': 50}, logTag: 'books');

  Future<void> issue({
    required String bookId,
    String? studentId,
    int days = 14,
  }) async {
    try {
      await _api.dio.post(
        '/api/v1/library/issue',
        data: {
          'bookId': bookId,
          if (studentId != null) 'studentId': studentId,
          'days': days,
        },
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'library.issue');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }

  Future<int> returnBook(String issueId) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/api/v1/library/return',
        data: {'issueId': issueId},
      );
      return (res.data?['data']?['fineAmount'] as num?)?.toInt() ?? 0;
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'library.return');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }
}
