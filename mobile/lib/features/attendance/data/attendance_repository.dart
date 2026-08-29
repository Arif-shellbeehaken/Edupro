import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
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
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f = e.error is Failure
          ? e.error as Failure
          : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'AttendanceRepository.list');
      if (f is AuthFailure) await _api.clearSessionOnUnauthorized(f);
      throw f;
    } catch (e, st) {
      ErrorLogger.log(e, st, 'AttendanceRepository.list');
      throwMapped(e, st);
    }
  }

  /// Mark attendance for many students.
  Future<({int count, int smsSent})> mark({
    required String date,
    required List<({String studentId, String status})> entries,
    bool notifyAbsent = false,
  }) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/api/v1/attendance',
        data: {
          'date': date,
          'notifyAbsent': notifyAbsent,
          'entries': [
            for (final e in entries)
              {'studentId': e.studentId, 'status': e.status},
          ],
        },
      );
      final data = res.data ?? {};
      return (
        count: (data['count'] as num?)?.toInt() ?? entries.length,
        smsSent: (data['smsSent'] as num?)?.toInt() ?? 0,
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f = e.error is Failure
          ? e.error as Failure
          : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'AttendanceRepository.mark');
      throw f;
    } catch (e, st) {
      ErrorLogger.log(e, st, 'AttendanceRepository.mark');
      throwMapped(e, st);
    }
  }
}
