# Edupro Mobile (Flutter)

Industry-standard Flutter client for Edupro SaaS (School / College / Madrasah).

## Architecture

```
lib/
  core/           # config, network, storage, theme, router, errors
  features/       # auth, home, students, attendance, notices, fees, parent, profile
  shared/         # reusable widgets
```

- **State:** Riverpod  
- **Navigation:** go_router  
- **HTTP:** Dio + interceptors (Bearer token, request-id)  
- **Secrets:** flutter_secure_storage  
- **API:** `POST /api/v1/auth/login`, `GET /api/v1/students|attendance|notices`

## Setup

```bash
cd mobile
flutter pub get
# Point to your backend:
# --dart-define=API_BASE_URL=https://your-domain.com
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Android emulator → host machine: `http://10.0.2.2:3000`  
iOS simulator → `http://127.0.0.1:3000`

## Demo login (after seed)

- Admin: `admin@demo-madrasah.edu.bd` / `Admin@1234`

## Build release

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.edupro.app
flutter build ios --release --dart-define=API_BASE_URL=https://api.edupro.app
```


## State management (Riverpod)

| Provider | Type | Role |
|----------|------|------|
| `authControllerProvider` | `AsyncNotifier<UserEntity?>` | Session bootstrap, login, logout |
| `currentUserProvider` | `Provider` | Derived user |
| `studentsControllerProvider` | `AutoDisposeAsyncNotifier` | Student list (status filter) |
| `studentSearchProvider` | `StateProvider` | Client search |
| `filteredStudentsProvider` | `Provider` | Derived filtered list |
| `attendanceControllerProvider` | `AutoDisposeAsyncNotifier` | Attendance by date |
| `noticesControllerProvider` | `AutoDisposeAsyncNotifier` | Notices |
| `themeModeProvider` | `StateNotifier` | Persisted theme |

DI lives in `lib/core/di/providers.dart`. UI uses `AsyncValueWidget` for loading/error/retry.


## Error handling

| Layer | Component |
|-------|-----------|
| Domain | `Failure` hierarchy (Network, Auth, Forbidden, NotFound, Validation, RateLimit, Server) |
| Mapping | `ExceptionMapper.fromDio` / `from` |
| HTTP | Dio interceptor attaches `Failure` on `DioException.error` |
| UI | `ErrorView` + `AsyncValueWidget` + `showAppError` snackbar |
| Logging | `ErrorLogger` (debug; swap for Sentry/Crashlytics) |
| Global | `FlutterError.onError` + `PlatformDispatcher.onError` |

Repositories catch `DioException`, rethrow typed `Failure`. Auth 401 clears secure token.


## Modules (mobile)

Bottom nav: Home · Modules hub · Students · Notices · Profile.

Feature screens (read lists via `/api/v1/*`): fees, exams, homework, hifz, timetable, library, hostel, transport, staff, messages, certificates, donations, inventory.

Each module: `Repository` → `AsyncNotifier` → `ModuleListPage` + error/retry.


## Complete modules (read + write)

| Module | List | Create / Action |
|--------|------|-----------------|
| Attendance | ✅ | ✅ Mark + SMS |
| Notices | ✅ | ✅ Publish |
| Fees | ✅ | ✅ Record payment |
| Homework | ✅ | ✅ Assign |
| Hifz | ✅ | ✅ Daily entry |
| Students | ✅ | Search + filter |
