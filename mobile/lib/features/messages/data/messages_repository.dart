import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class MessagesRepository {
  MessagesRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/messages', query: {'take': 50}, logTag: 'messages');

  Future<void> send({
    required String recipient,
    required String body,
    String channel = 'SMS',
    String? subject,
  }) async {
    try {
      await _api.dio.post(
        '/api/v1/messages',
        data: {
          'recipient': recipient,
          'body': body,
          'channel': channel,
          if (subject != null) 'subject': subject,
        },
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'messages.send');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }
}
