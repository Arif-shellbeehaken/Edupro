/**
 * Domain Enums — Single source of truth
 * Keep these pure (no framework dependencies)
 */

// ─── Tenancy & Platform ───────────────────────────────────────────
export enum TenantStatus {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  CANCELLED = "CANCELLED",
}

export enum SubscriptionPlan {
  BASIC = "BASIC",
  STANDARD = "STANDARD",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
}

export enum InstitutionType {
  SCHOOL = "SCHOOL",
  COLLEGE = "COLLEGE",
  ALIA_MADRASAH = "ALIA_MADRASAH",       // BMEB
  QAWMI_MADRASAH = "QAWMI_MADRASAH",     // BEFAQ
  MIXED = "MIXED",                       // School + Madrasah combined
}

// ─── Identity & Access ────────────────────────────────────────────
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  INSTITUTION_ADMIN = "INSTITUTION_ADMIN",
  PRINCIPAL = "PRINCIPAL",
  TEACHER = "TEACHER",
  HIFZ_TEACHER = "HIFZ_TEACHER",
  MUHADDIS = "MUHADDIS",
  ACCOUNTANT = "ACCOUNTANT",
  LIBRARIAN = "LIBRARIAN",
  HOSTEL_WARDEN = "HOSTEL_WARDEN",
  TRANSPORT_MANAGER = "TRANSPORT_MANAGER",
  PARENT = "PARENT",
  STUDENT = "STUDENT",
}

export enum PermissionAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  APPROVE = "APPROVE",
}

// ─── Academic ─────────────────────────────────────────────────────
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum StudentStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  GRADUATED = "GRADUATED",
  TRANSFERRED = "TRANSFERRED",
  DROPPED = "DROPPED",
  SUSPENDED = "SUSPENDED",
}

export enum AdmissionStatus {
  APPLIED = "APPLIED",
  SHORTLISTED = "SHORTLISTED",
  WAITLISTED = "WAITLISTED",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  HALF_DAY = "HALF_DAY",
  LEAVE = "LEAVE",
  HOLIDAY = "HOLIDAY",
}

export enum ExamType {
  CLASS_TEST = "CLASS_TEST",
  MID_TERM = "MID_TERM",
  FINAL = "FINAL",
  BOARD = "BOARD",
  HIFZ_TEST = "HIFZ_TEST",
}

// ─── Hifz (Critical Differentiator) ───────────────────────────────
export enum HifzStream {
  SABAK = "SABAK",     // New memorization (আজকের নতুন হিফজ)
  SABKI = "SABKI",     // Recent revision (সাম্প্রতিক মুখস্থ)
  MANZIL = "MANZIL",   // Old revision (পুরনো রিভিশন)
}

export enum TilawatQuality {
  EXCELLENT = "EXCELLENT",   // ৫
  GOOD = "GOOD",             // ৪
  AVERAGE = "AVERAGE",       // ৩
  NEEDS_WORK = "NEEDS_WORK", // ২
  WEAK = "WEAK",             // ১
}

// ─── Finance ──────────────────────────────────────────────────────
export enum FeeType {
  TUITION = "TUITION",
  ADMISSION = "ADMISSION",
  EXAM = "EXAM",
  HOSTEL = "HOSTEL",
  TRANSPORT = "TRANSPORT",
  LIBRARY = "LIBRARY",
  OTHER = "OTHER",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  WAIVED = "WAIVED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BKASH = "BKASH",
  NAGAD = "NAGAD",
  ROCKET = "ROCKET",
  BANK = "BANK",
  CARD = "CARD",
  OTHER = "OTHER",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

// ─── Board Affiliation ────────────────────────────────────────────
export enum EducationBoard {
  GENERAL = "GENERAL",           // NCTB / Board of Intermediate
  BMEB = "BMEB",                 // Bangladesh Madrasah Education Board (Alia)
  BEFAQ = "BEFAQ",               // Befaqul Madarisil Arabia (Qawmi)
}
