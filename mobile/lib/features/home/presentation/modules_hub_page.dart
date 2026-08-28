import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ModulesHubPage extends StatelessWidget {
  const ModulesHubPage({super.key});

  static const modules = <(String path, String label, IconData icon)>[
    ('/students', 'শিক্ষার্থী', Icons.people),
    ('/attendance', 'উপস্থিতি', Icons.fact_check),
    ('/fees', 'ফি', Icons.payments),
    ('/exams', 'পরীক্ষা', Icons.assignment),
    ('/homework', 'হোমওয়ার্ক', Icons.menu_book),
    ('/hifz', 'হিফজ', Icons.auto_stories),
    ('/timetable', 'রুটিন', Icons.schedule),
    ('/library', 'লাইব্রেরি', Icons.local_library),
    ('/hostel', 'হোস্টেল', Icons.apartment),
    ('/transport', 'ট্রান্সপোর্ট', Icons.directions_bus),
    ('/staff', 'স্টাফ', Icons.badge),
    ('/messages', 'SMS', Icons.sms),
    ('/notices', 'নোটিশ', Icons.campaign),
    ('/certificates', 'সার্টিফিকেট', Icons.workspace_premium),
    ('/donations', 'দান', Icons.volunteer_activism),
    ('/inventory', 'ইনভেন্টরি', Icons.inventory_2),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('সব মডিউল')),
      body: GridView.builder(
        padding: const EdgeInsets.all(12),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 0.95,
        ),
        itemCount: modules.length,
        itemBuilder: (context, i) {
          final (path, label, icon) = modules[i];
          return Card(
            child: InkWell(
              onTap: () => context.push(path),
              borderRadius: BorderRadius.circular(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: theme.colorScheme.primary),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.labelMedium,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
