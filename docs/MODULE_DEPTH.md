# Module depth — production use readiness

Software modules are implemented with create/list/update lifecycle, SMS hooks, and tenant isolation.

## Full operational depth (create → list → status/update → notify)
SIS, Attendance, Finance (invoice/pay/remind), HR leave/payroll, Library issue/return, Hostel, Transport, Inventory IN/OUT, Admission CRM + merit, Hifz, Namaz, Hijri, Certificates, Communication SMS, Emergency, Gate, Grievance, Donations, Exams/marks/MCQ, Timetable + substitute, LMS Meet/Zoom, Canteen POS + menu toggle, Assets condition, Career job open/close, Alumni, Health clinic records, Surveys, Clubs, Multi-campus, Reports/EMIS/dropout, Parent OTP portal, Teacher portal, Super-admin provision.

## External / hardware (not in-repo as device drivers)
Biometric/RFID readers, live GPS trackers, Flutter stores, SAML IdP, live BMEB API, blockchain registry — integrate via env keys / separate apps.

## Gateway live mode
bKash/Nagad/Rocket/SMS: sandbox by default; set provider credentials for production traffic.
