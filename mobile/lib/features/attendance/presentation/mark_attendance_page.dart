import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/attendance/presentation/attendance_provider.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';

const _statuses = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

class MarkAttendancePage extends ConsumerStatefulWidget {
  const MarkAttendancePage({super.key});

  @override
  ConsumerState<MarkAttendancePage> createState() => _MarkAttendancePageState();
}

class _MarkAttendancePageState extends ConsumerState<MarkAttendancePage> {
  final Map<String, String> _statusByStudent = {};
  bool _notifyAbsent = true;
  bool _saving = false;
  late String _date;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _date =
        '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  Future<void> _save() async {
    if (_statusByStudent.isEmpty) {
      showAppError(const ValidationFailure('কমপক্ষে একজন সিলেক্ট করুন'));
      return;
    }
    setState(() => _saving = true);
    try {
      final repo = ref.read(attendanceRepositoryProvider);
      final result = await repo.mark(
        date: _date,
        notifyAbsent: _notifyAbsent,
        entries: [
          for (final e in _statusByStudent.entries)
            (studentId: e.key, status: e.value),
        ],
      );
      ref.invalidate(attendanceControllerProvider);
      showAppSuccess(
        '${result.count} জন সেভ · SMS ${result.smsSent}',
      );
      if (mounted) Navigator.of(context).maybePop();
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final studentsAsync = ref.watch(studentsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('উপস্থিতি মার্ক'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('সেভ'),
          ),
        ],
      ),
      body: Column(
        children: [
          ListTile(
            title: Text('তারিখ: $_date'),
            trailing: IconButton(
              icon: const Icon(Icons.calendar_today),
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.tryParse(_date) ?? DateTime.now(),
                  firstDate: DateTime(DateTime.now().year - 1),
                  lastDate: DateTime.now(),
                );
                if (picked != null) {
                  setState(() {
                    _date =
                        '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                  });
                }
              },
            ),
          ),
          SwitchListTile(
            title: const Text('অনুপস্থিত/লেটে অভিভাবক SMS'),
            value: _notifyAbsent,
            onChanged: (v) => setState(() => _notifyAbsent = v),
          ),
          const Divider(height: 1),
          Expanded(
            child: studentsAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (list) {
                if (list.isEmpty) {
                  return const Center(child: Text('শিক্ষার্থী নেই'));
                }
                return ListView.builder(
                  itemCount: list.length,
                  itemBuilder: (context, i) {
                    final s = list[i];
                    final id = s.id.isNotEmpty ? s.id : s.studentId;
                    final current = _statusByStudent[id] ?? 'PRESENT';
                    return ListTile(
                      title: Text(s.nameBn ?? s.name),
                      subtitle: Text(s.studentId),
                      trailing: DropdownButton<String>(
                        value: current,
                        items: [
                          for (final st in _statuses)
                            DropdownMenuItem(value: st, child: Text(st)),
                        ],
                        onChanged: (v) {
                          if (v == null) return;
                          setState(() => _statusByStudent[id] = v);
                        },
                      ),
                      onTap: () {
                        setState(() {
                          _statusByStudent.putIfAbsent(id, () => 'PRESENT');
                        });
                      },
                    );
                  },
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: FilledButton(
              onPressed: _saving
                  ? null
                  : () {
                      // default all present if empty
                      final list =
                          studentsAsync.valueOrNull ?? [];
                      if (_statusByStudent.isEmpty) {
                        for (final s in list) {
                          final id = s.id.isNotEmpty ? s.id : s.studentId;
                          _statusByStudent[id] = 'PRESENT';
                        }
                      }
                      _save();
                    },
              child: const Text('সব সেভ করুন'),
            ),
          ),
        ],
      ),
    );
  }
}
