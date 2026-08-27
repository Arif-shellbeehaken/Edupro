# Edupro SMS Catalog — Production Complete

All notification types use `communicationRepository.sendMessage` with sandbox/console fallback.

## Academic & Students
| relatedType | Trigger |
|---|---|
| ATTENDANCE | Absent/Late mark |
| CHRONIC_ABSENCE | Chronic absentees bulk |
| CHRONIC_DIGEST | Weekly admin digest |
| STUDENT_STATUS | LEFT/SUSPENDED/etc. |
| STUDENT_PROMOTE | Class promote/transfer |
| ID_CARD | ID cards ready |
| PARENT_OTP | Parent portal login |
| BULK_IMPORT | Import complete notice |
| ACADEMIC_ROLLOVER | Session rollover |

## Exams & Homework
| relatedType | Trigger |
|---|---|
| EXAM_SCHEDULE | Exam created |
| EXAM_RESULT | Results + AI remarks |
| EXAM_SEATING | Seat plan publish |
| HOMEWORK | New homework |
| HOMEWORK_DUE | Due reminders |

## Finance
| relatedType | Trigger |
|---|---|
| FEE_INVOICE | Invoice create |
| FEE_MONTHLY | Monthly fee batch |
| FEE_PAYMENT | Payment recorded |
| FEE_REMINDER | Overdue reminders |
| FEE_FINE | Fine applied |
| FEE_BKASH / FEE_NAGAD | Gateway success |
| TRANSPORT_FEE | Transport monthly invoices |

## HR & Payroll
| relatedType | Trigger |
|---|---|
| STAFF_WELCOME | Staff onboarding |
| LEAVE / LEAVE_BALANCE | Leave decisions & balances |
| PAYROLL / PAYROLL_PROCESS / PAYSLIP | Salary flows |
| STAFF_ATTENDANCE | Staff attendance alerts |

## Operations
| relatedType | Trigger |
|---|---|
| LIBRARY_ISSUE / LIBRARY_OVERDUE | Library |
| HOSTEL / MESS_MENU | Hostel |
| TRANSPORT / TRANSPORT_ROUTE | Transport |
| TIMETABLE / TIMETABLE_DAY / TIMETABLE_DIGEST | Routine |
| INVENTORY* / STOCKTAKE / INVENTORY_PO | Inventory |
| GATE / VISITOR_OUT | Gate |
| CERTIFICATE* | Certificates |
| HIFZ / NAMAZ / HIJRI_HOLIDAY | Islamic calendar |

## CRM & Comms
| relatedType | Trigger |
|---|---|
| ADMISSION / ADMISSION_OFFER / ADMISSION_CONVERT | Admission CRM |
| DONATION / DONATION_CAMPAIGN | Donations |
| GRIEVANCE / GRIEVANCE_SLA | Grievances |
| NOTICE / SURVEY / SURVEY_NPS | Notices & NPS |
| EMERGENCY / EMERGENCY_DRILL | Safety |
| SUPPORT / SUPPORT_ASSIGN | Helpdesk |
| WHITELABEL / CAMPUS* / AUDIT_EXPORT | Platform |

**Status: SMS notification surface area for blueprint modules is complete.**
