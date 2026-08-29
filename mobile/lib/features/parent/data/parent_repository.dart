import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/storage/token_storage.dart';
import 'package:edupro_mobile/features/auth/domain/user_entity.dart';

class ParentRepository {
  ParentRepository(this._api, this._storage);
  final ApiClient _api;
  final TokenStorage _storage;

  Future<void> requestOtp(String phone, {String? tenantSlug}) async {
    try {
      await _api.dio.post(
        '/api/v1/parent/otp/request',
        data: {
          'phone': phone.trim(),
          if (tenantSlug != null && tenantSlug.isNotEmpty)
            'tenantSlug': tenantSlug,
        },
      );
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'ParentRepository.requestOtp');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }

  Future<UserEntity> verifyOtp(String phone, String otp) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/api/v1/parent/otp/verify',
        data: {'phone': phone.trim(), 'otp': otp.trim()},
      );
      final data = res.data;
      final token = data?['accessToken'] as String?;
      final userMap = data?['user'] as Map<String, dynamic>?;
      if (token == null || userMap == null) {
        throw const AuthFailure('OTP ভেরিফাই ব্যর্থ');
      }
      final user = UserEntity(
        id: userMap['id']?.toString() ?? '',
        email: userMap['phone']?.toString() ?? phone,
        name: userMap['name']?.toString() ?? 'অভিভাবক',
        role: 'PARENT',
        tenantId: userMap['tenantId']?.toString(),
      );
      await _storage.saveToken(token);
      await _storage.saveUserJson(jsonEncode(user.toJson()));
      return user;
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'ParentRepository.verifyOtp');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }

  Future<List<Map<String, dynamic>>> children() async {
    try {
      final res = await _api.dio.get<Map<String, dynamic>>(
        '/api/v1/parent/children',
      );
      final list = res.data?['data'] as List<dynamic>? ?? [];
      return list
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f =
          e.error is Failure ? e.error as Failure : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'ParentRepository.children');
      throw f;
    } catch (e, st) {
      throwMapped(e, st);
    }
  }
}
