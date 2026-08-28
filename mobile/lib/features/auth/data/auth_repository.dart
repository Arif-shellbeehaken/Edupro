import 'dart:convert';

import 'package:dio/dio.dart';
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
      if (data == null) throw const ServerFailure();
      final token = data['accessToken'] as String?;
      final userMap = data['user'] as Map<String, dynamic>?;
      if (token == null || userMap == null) {
        throw const AuthFailure('লগইন ব্যর্থ');
      }
      final user = UserEntity.fromJson(userMap);
      await _storage.saveToken(token);
      await _storage.saveUserJson(jsonEncode(user.toJson()));
      return user;
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data as Map)['error']?.toString()
          : null;
      if (e.response?.statusCode == 401) {
        throw AuthFailure(msg ?? 'ইমেইল বা পাসওয়ার্ড ভুল');
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw const NetworkFailure();
      }
      throw ServerFailure(msg ?? 'সার্ভার ত্রুটি');
    }
  }

  Future<UserEntity?> restoreSession() async {
    final token = await _storage.readToken();
    final json = await _storage.readUserJson();
    if (token == null || json == null) return null;
    try {
      return UserEntity.fromJson(
        jsonDecode(json) as Map<String, dynamic>,
      );
    } catch (_) {
      await _storage.clear();
      return null;
    }
  }

  Future<void> logout() => _storage.clear();
}
