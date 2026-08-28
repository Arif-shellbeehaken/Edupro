import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final FlutterSecureStorage _storage;
  static const _keyToken = 'edupro_access_token';
  static const _keyUserJson = 'edupro_user_json';

  Future<void> saveToken(String token) =>
      _storage.write(key: _keyToken, value: token);

  Future<String?> readToken() => _storage.read(key: _keyToken);

  Future<void> saveUserJson(String json) =>
      _storage.write(key: _keyUserJson, value: json);

  Future<String?> readUserJson() => _storage.read(key: _keyUserJson);

  Future<void> clear() async {
    await _storage.delete(key: _keyToken);
    await _storage.delete(key: _keyUserJson);
  }
}
