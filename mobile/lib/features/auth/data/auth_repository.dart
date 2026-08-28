import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';
import 'package:edupro_mobile/core/error/exception_mapper.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/network/api_client.dart';
import 'package:edupro_mobile/core/storage/token_storage.dart';
import 'package:edupro_mobile/features/auth/domain/user_entity.dart';

class AuthRepository {
  AuthRepository(this._api, this._storage);

  final ApiClient _api;
  final TokenStorage _storage;

  Future<UserEntity> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/api/v1/auth/login',
        data: {'email': email.trim(), 'password': password},
      );
      final data = res.data;
      if (data == null) throw const ServerFailure('খালি রেসপন্স');
      final token = data['accessToken'] as String?;
      final userMap = data['user'] as Map<String, dynamic>?;
      if (token == null || userMap == null) {
        throw const AuthFailure('লগইন ব্যর্থ — টোকেন পাওয়া যায়নি');
      }
      final user = UserEntity.fromJson(userMap);
      await _storage.saveToken(token);
      await _storage.saveUserJson(jsonEncode(user.toJson()));
      return user;
    } on Failure {
      rethrow;
    } on DioException catch (e, st) {
      final f = e.error is Failure
          ? e.error as Failure
          : ExceptionMapper.fromDio(e);
      ErrorLogger.log(f, st, 'AuthRepository.login');
      throw f;
    } catch (e, st) {
      ErrorLogger.log(e, st, 'AuthRepository.login');
      throwMapped(e, st);
    }
  }

  Future<UserEntity?> restoreSession() async {
    try {
      final token = await _storage.readToken();
      final json = await _storage.readUserJson();
      if (token == null || json == null) return null;
      return UserEntity.fromJson(jsonDecode(json) as Map<String, dynamic>);
    } catch (e, st) {
      ErrorLogger.log(e, st, 'AuthRepository.restoreSession');
      await _storage.clear();
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _storage.clear();
    } catch (e, st) {
      ErrorLogger.log(e, st, 'AuthRepository.logout');
      // Still clear best-effort
      try {
        await _storage.clear();
      } catch (_) {}
    }
  }
}
