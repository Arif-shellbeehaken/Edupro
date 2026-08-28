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
