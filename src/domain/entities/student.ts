import { Gender, StudentStatus } from "../enums";

/**
 * Student Aggregate
 * Core of the Academic bounded context.
 */
export interface Student {
  id: string;
  tenantId: string;

  // Identity
  studentId: string;                // Institution-generated ID (e.g. 2025-HIFZ-0042)
  rollNumber?: string | null;
  name: string;
  nameBn?: string | null;
  nameAr?: string | null;           // Arabic name (common in madrasah)
  dateOfBirth?: Date | null;
  gender: Gender;
  bloodGroup?: string | null;
  photoUrl?: string | null;

  // Academic placement
  currentClassId?: string | null;
  currentSectionId?: string | null;
  academicYearId?: string | null;
  status: StudentStatus;
  admissionDate?: Date | null;

  // Family
  fatherName?: string | null;
  fatherNameBn?: string | null;
  fatherPhone?: string | null;
  fatherNid?: string | null;
  motherName?: string | null;
  motherNameBn?: string | null;
  motherPhone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelation?: string | null;

  // Address & documents
  presentAddress?: string | null;
  permanentAddress?: string | null;
  birthCertificateNo?: string | null;
  nid?: string | null;

  // Health
  allergies?: string | null;
  chronicConditions?: string | null;

  // Hifz specific (nullable for non-hifz students)
  isHifzStudent: boolean;
  currentJuz?: number | null;       // 1-30
  currentPage?: number | null;

  // Meta
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateStudentInput {
  tenantId: string;
  studentId: string;
  name: string;
  nameBn?: string;
  nameAr?: string;
  gender: Gender;
  dateOfBirth?: Date;
  currentClassId?: string;
  currentSectionId?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  guardianPhone?: string;
  isHifzStudent?: boolean;
}
