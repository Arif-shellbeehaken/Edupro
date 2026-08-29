# Edupro Mobile — Module completion

| Module | List | Write / Action |
|--------|------|----------------|
| Auth | — | Login / Logout / Token |
| Parent portal | OTP | Children summary |
| Students | ✅ | Search / filter |
| Attendance | ✅ | Mark + parent SMS |
| Notices | ✅ | Publish |
| Fees | ✅ | Record payment |
| Homework | ✅ | Assign |
| Hifz | ✅ | Daily entry |
| Library | ✅ | Issue / Return |
| Exams | ✅ | Create exam |
| Inventory | ✅ | Stock IN/OUT/ADJUST |
| Hostel | ✅ | Allocate / End |
| Transport | ✅ | Assign route |
| Certificates | ✅ | Issue |
| Donations | ✅ | Record donation |
| Timetable | ✅ | Upsert slot |
| Staff | ✅ | Leave request |
| Messages | ✅ | Send SMS |
| Profile | ✅ | Session info |

Pattern: Repository → AsyncNotifier → Page (Riverpod + Failure mapping)
API: `/api/v1/*` JWT + tenant isolation + rate limit
