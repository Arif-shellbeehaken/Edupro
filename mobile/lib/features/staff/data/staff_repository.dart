import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class StaffRepository {
  StaffRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/staff', query: {'take': 50}, logTag: 'staff');
}
