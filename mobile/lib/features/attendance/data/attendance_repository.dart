import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';

class AttendanceDto {
  AttendanceDto({
    required this.id,
    this.studentName,
    this.status,
    this.date,
  });

  final String id;
  final String? studentName;
  final String? status;
  final String? date;

  factory AttendanceDto.fromJson(Map<String, dynamic> j) => AttendanceDto(
        id: j['id']?.toString() ?? '',
        studentName: j['studentName']?.toString() ??
            j['student']?['name']?.toString(),
        status: j['status']?.toString(),
        date: j['date']?.toString(),
      );
}

class AttendanceRepository {
  AttendanceRepository(this._api);
  final ApiClient _api;

  Future<List<AttendanceDto>> list({String? date}) async {
    try {
      final res = await _api.dio.get<Map<String, dynamic>>(
        '/api/v1/attendance',
        queryParameters: {
          if (date != null) 'date': date,
          'take': 100,
        },
      );
      final list = res.data?['data'] as List<dynamic>? ?? [];
      return list
          .map((e) => AttendanceDto.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) throw const AuthFailure();
      throw const ServerFailure();
    }
  }
}
