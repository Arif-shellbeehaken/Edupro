import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  const Failure(this.message);
  final String message;

  @override
  List<Object?> get props => [message];
}

class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'নেটওয়ার্ক সমস্যা']);
}

class AuthFailure extends Failure {
  const AuthFailure([super.message = 'লগইন প্রয়োজন']);
}

class ServerFailure extends Failure {
  const ServerFailure([super.message = 'সার্ভার ত্রুটি']);
}

class UnknownFailure extends Failure {
  const UnknownFailure([super.message = 'অজানা ত্রুটি']);
}
