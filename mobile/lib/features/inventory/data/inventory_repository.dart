import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class InventoryRepository {
  InventoryRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/inventory', query: {'take': 50}, logTag: 'inventory');
}
