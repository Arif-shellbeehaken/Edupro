import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class MessagesRepository {
  MessagesRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/messages', query: {'take': 50}, logTag: 'messages');
}
