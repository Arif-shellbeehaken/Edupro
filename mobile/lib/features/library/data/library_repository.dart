import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/network/list_fetch.dart';

class LibraryRepository {
  LibraryRepository(this._api);
  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list() =>
      fetchList(_api, '/api/v1/library', query: {'take': 50}, logTag: 'library');
}
