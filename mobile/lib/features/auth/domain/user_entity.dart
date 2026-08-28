import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  const UserEntity({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.tenantId,
    this.isSuperAdmin = false,
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final String? tenantId;
  final bool isSuperAdmin;

  factory UserEntity.fromJson(Map<String, dynamic> json) {
    return UserEntity(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      name: json['name'] as String? ?? '',
      role: json['role'] as String? ?? '',
      tenantId: json['tenantId'] as String?,
      isSuperAdmin: json['isSuperAdmin'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role,
        'tenantId': tenantId,
        'isSuperAdmin': isSuperAdmin,
      };

  @override
  List<Object?> get props => [id, email, role, tenantId];
}
