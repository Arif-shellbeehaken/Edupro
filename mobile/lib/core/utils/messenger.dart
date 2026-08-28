import 'package:flutter/material.dart';
import 'package:edupro_mobile/core/error/failures.dart';

final rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void showAppError(Object error, {String? contextLabel}) {
  final msg = error is Failure ? error.message : error.toString();
  final messenger = rootScaffoldMessengerKey.currentState;
  messenger
    ?..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(contextLabel != null ? '$contextLabel: $msg' : msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.red.shade800,
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
}

void showAppSuccess(String message) {
  rootScaffoldMessengerKey.currentState
    ?..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.green.shade700,
      ),
    );
}
