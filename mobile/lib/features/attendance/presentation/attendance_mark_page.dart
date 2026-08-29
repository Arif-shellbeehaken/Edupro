import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:edupro_mobile/core/error/failures.dart';
import 'package:edupro_mobile/core/utils/messenger.dart';
import 'package:edupro_mobile/features/attendance/presentation/attendance_provider.dart';
import 'package:edupro_mobile/features/students/presentation/students_provider.dart';

class AttendanceMarkPage extends ConsumerStatefulWidget {
  const AttendanceMarkPage({super.key});

  @override
  ConsumerState<AttendanceMarkPage> createState() => _AttendanceMarkPageState();
}

class _AttendanceMarkPageState extends ConsumerState<AttendanceMarkPage> {
  final Map<String, String> _status = {};
  bool _notify = true;
  bool _saving = false;
  String get _today {
    final n = DateTime.now();
    return '${n.year.toString().padLeft(4, '0')}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
  }

  Future<void> _save() async {
    final entries = _status.entries
        .map((e) => (studentId: e.key, status: e.value))
        .toList();
    if (entries.isEmpty) {
      showAppError(const ValidationFailure('কমপক্ষে একজন সিলেক্ট করুন'));
      return;
    }
    setState(() => _saving = true);
    try {
      final repo = ref.read(attendanceRepositoryProvider);
      final result = await repo.mark(
        date: _today,
        entries: entries,
        notifyAbsent: _notify,
      );
      showAppSuccess('মার্ক ${result.marked} · SMS ${result.smsSent}');
      ref.invalidate(attendanceControllerProvider);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      showAppError(e is Failure ? e : UnknownFailure(e.toString()));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final students = ref.watch(studentsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('উপস্থিতি মার্ক ($_today)'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('সেভ'),
          ),
        ],
      ),
      body: students.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('শিক্ষার্থী নেই'));
          }
          return Column(
            children: [
              SwitchListTile(
                title: const Text('অনুপস্থিত/লেট → অভিভাবক SMS'),
                value: _notify,
                onChanged: (v) => setState(() => _notify = v),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: list.length,
                  itemBuilder: (context, i) {
                    final s = list[i];
                    // need internal id - StudentDto may only have studentId code
                    final id = s.id;
                    final selected = _status[id];
                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      child: ListTile(
                        title: Text(s.nameBn ?? s.name),
                        subtitle: Text(s.studentId),
                        trailing: DropdownButton<String>(
                          value: selected,
                          hint: const Text('—'),
                          items: const [
                            DropdownMenuItem(
                              value: 'PRESENT',
                              child: Text('Present'),
                            ),
                            DropdownMenuItem(
                              value: 'ABSENT',
                              child: Text('Absent'),
                            ),
                            DropdownMenuItem(
                              value: 'LATE',
                              child: Text('Late'),
                            ),
                            DropdownMenuItem(
                              value: 'LEAVE',
                              child: Text('Leave'),
                            ),
                          ],
                          onChanged: (v) {
                            if (v == null) return;
                            setState(() => _status[id] = v);
                          },
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
