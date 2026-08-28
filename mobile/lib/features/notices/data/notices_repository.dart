import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';

class NoticeDto {
  NoticeDto({
    required this.id,
    required this.title,
    this.body,
    this.audience,
  });

  final String id;
  final String title;
  final String? body;
  final String? audience;

  factory NoticeDto.fromJson(Map<String, dynamic> j) => NoticeDto(
        id: j['id']?.toString() ?? '',
        title: (j['titleBn'] ?? j['title'])?.toString() ?? '',
        body: j['body']?.toString(),
        audience: j['audience']?.toString(),
      );
}

class NoticesRepository {
  NoticesRepository(this._api);
  final ApiClient _api;

  Future<List<NoticeDto>> list() async {
    try {
      final res = await _api.dio.get<Map<String, dynamic>>(
        '/api/v1/notices',
        queryParameters: {'take': 50},
      );
      final list = res.data?['data'] as List<dynamic>? ?? [];
      return list
          .map((e) => NoticeDto.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw const AuthFailure();
      throw const ServerFailure();
    }
  }
}
