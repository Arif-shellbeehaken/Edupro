import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';

class StudentDto {
  StudentDto({
    required this.id,
    required this.studentId,
    required this.name,
    this.nameBn,
    this.status,
    this.rollNumber,
    this.guardianPhone,
  });

  final String id;
  final String studentId;
  final String name;
  final String? nameBn;
  final String? status;
  final String? rollNumber;
  final String? guardianPhone;

  factory StudentDto.fromJson(Map<String, dynamic> j) => StudentDto(
        id: j['id']?.toString() ?? '',
        studentId: j['studentId']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        nameBn: j['nameBn']?.toString(),
        status: j['status']?.toString(),
        rollNumber: j['rollNumber']?.toString(),
        guardianPhone: j['guardianPhone']?.toString(),
      );
}

class StudentsRepository {
  StudentsRepository(this._api);
  final ApiClient _api;

  Future<List<StudentDto>> list({String status = 'ACTIVE'}) async {
    try {
      final res = await _api.dio.get<Map<String, dynamic>>(
        '/api/v1/students',
        queryParameters: {'status': status, 'take': 100},
      );
      final list = res.data?['data'] as List<dynamic>? ?? [];
      return list
          .map((e) => StudentDto.fromJson(e as Map<String, dynamic>))
          .toList();
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f = e.error is Failure
          ? e.error as Failure
          : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'StudentsRepository.list');
      if (f is AuthFailure) await _api.clearSessionOnUnauthorized(f);
      throw f;
    } catch (e, st) {
      ErrorLogger.log(e, st, 'StudentsRepository.list');
      throwMapped(e, st);
    }
  }
}
