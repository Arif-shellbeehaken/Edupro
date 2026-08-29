import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class CertificatesRepository {
  CertificatesRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/certificates', query: {'take': 50}, logTag: 'certs');

  Future<void> issue({required String studentName, String certType = 'CHARACTER', String? className}) async {
    try {
      await _api.dio.post('/api/v1/certificates', data: {
        'studentName': studentName,
        'certType': certType,
        if (className != null) 'className': className,
      });
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'certs.issue');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }
}
