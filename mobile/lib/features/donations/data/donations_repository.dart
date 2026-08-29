import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class DonationsRepository {
  DonationsRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/donations', query: {'take': 50}, logTag: 'donations');

  Future<void> create({required String donorName, required num amount, String category = 'GENERAL'}) async {
    try {
      await _api.dio.post('/api/v1/donations', data: {
        'donorName': donorName,
        'amount': amount,
        'category': category,
      });
    } on Failure { rethrow; }
    on DioException catch (e, st) {
      final f = e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'donations.create');
      throw f;
    } catch (e, st) { throwMapped(e, st); }
  }
}
