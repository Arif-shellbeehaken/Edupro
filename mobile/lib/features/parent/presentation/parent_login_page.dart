import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:edupro_mobile/core/di/providers.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/features/auth/presentation/auth_provider.dart';
import 'package:edupro_mobile/features/parent/data/parent_repository.dart';

final parentRepositoryProvider = Provider(
  (ref) => ParentRepository(
    ref.watch(apiClientProvider),
    ref.watch(tokenStorageProvider),
  ),
);

class ParentLoginPage extends ConsumerStatefulWidget {
  const ParentLoginPage({super.key});

  @override
  ConsumerState<ParentLoginPage> createState() => _ParentLoginPageState();
}

class _ParentLoginPageState extends ConsumerState<ParentLoginPage> {
  final _phone = TextEditingController();
  final _otp = TextEditingController();
  bool _otpSent = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(parentRepositoryProvider).requestOtp(_phone.text);
      setState(() => _otpSent = true);
    } catch (e) {
      setState(() => _error = e is Failure ? e.message : 'ব্যর্থ');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await ref
          .read(parentRepositoryProvider)
          .verifyOtp(_phone.text, _otp.text);
      // refresh auth controller state
      ref.invalidate(authControllerProvider);
      if (mounted) context.go('/parent-home');
    } catch (e) {
      setState(() => _error = e is Failure ? e.message : 'ব্যর্থ');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('অভিভাবক লগইন')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              labelText: 'মোবাইল নম্বর',
              prefixIcon: Icon(Icons.phone),
            ),
            enabled: !_otpSent,
          ),
          if (_otpSent) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _otp,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                labelText: 'OTP',
                prefixIcon: Icon(Icons.pin),
              ),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading
                ? null
                : (_otpSent ? _verify : _request),
            child: Text(_otpSent ? 'ভেরিফাই' : 'OTP পাঠান'),
          ),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('স্টাফ লগইন'),
          ),
        ],
      ),
    );
  }
}
