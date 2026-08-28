/// Runtime config via --dart-define
class Env {
  Env._();

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const appName = 'Edupro';
  static const connectTimeoutMs = 20000;
  static const receiveTimeoutMs = 30000;
}
