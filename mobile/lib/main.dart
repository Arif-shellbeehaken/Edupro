import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/app.dart';
import 'package:edupro_mobile/core/error/error_logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    ErrorLogger.log(
      details.exception,
      details.stack,
      'FlutterError',
    );
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    ErrorLogger.log(error, stack, 'PlatformDispatcher');
    return true; // handled
  };

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(const ProviderScope(child: EduproApp()));
}
