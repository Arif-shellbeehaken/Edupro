/**
 * Database Seed — Development & Demo
 *
 * Run: npx tsx prisma/seed.ts
 * (or npm run db:seed after wiring package.json)
 *
 * Creates:
 * - Super Admin
 * - Demo Madrasah tenant
 * - Institution Admin for that tenant
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Edupro...");

  // 1. Super Admin (no tenant)
  const superPassword = await hash("Super@1234", 12);
  const superAdmin = await prisma.user.upsert({
    where: {
      // We need a unique constraint workaround since tenantId can be null
      // Using findFirst + create pattern for safety
      id: "seed-super-admin",
    },
    update: {},
    create: {
      id: "seed-super-admin",
      tenantId: null,
      email: "super@edupro.app",
      passwordHash: superPassword,
      name: "Super Admin",
      nameBn: "সুপার অ্যাডমিন",
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  }).catch(async () => {
    // Fallback if id conflict strategy differs
    const existing = await prisma.user.findFirst({
      where: { email: "super@edupro.app", tenantId: null },
    });
    if (existing) return existing;
    return prisma.user.create({
      data: {
        tenantId: null,
        email: "super@edupro.app",
        passwordHash: superPassword,
        name: "Super Admin",
        nameBn: "সুপার অ্যাডমিন",
        role: "SUPER_ADMIN",
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    });
  });
  console.log("✅ Super Admin:", superAdmin.email);

  // 2. Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "darul-ulum" },
    update: {},
    create: {
      name: "দারুল উলূম মাদ্রাসা",
      nameBn: "দারুল উলূম মাদ্রাসা",
      slug: "darul-ulum",
      type: "QAWMI_MADRASAH",
      status: "ACTIVE",
      plan: "PREMIUM",
      email: "info@darululum.edu.bd",
      phone: "01700000000",
      address: "মিরপুর, ঢাকা",
      district: "ঢাকা",
      division: "ঢাকা",
      boardAffiliation: JSON.stringify(["BEFAQ"]),
      maxStudents: 2000,

      maxStaff: 100,
      primaryColor: "#059669",
    },
  });
  console.log("✅ Tenant:", tenant.name, `(${tenant.slug})`);

  // 3. Institution Admin
  const adminPassword = await hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@demo-madrasah.edu.bd",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo-madrasah.edu.bd",
      passwordHash: adminPassword,
      name: "মাওলানা আব্দুল্লাহ",
      nameBn: "মাওলানা আব্দুল্লাহ",
      role: "INSTITUTION_ADMIN",
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log("✅ Institution Admin:", admin.email);

  // 4. Current Academic Year
  const year = await prisma.academicYear.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "2025-2026",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "2025-2026",
      nameBn: "২০২৫-২০২৬",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      isCurrent: true,
    },
  });
  console.log("✅ Academic Year:", year.name);

  // 5. Sample Class + Hifz students
  const hifzClass = await prisma.class.upsert({
    where: {
      tenantId_academicYearId_name: {
        tenantId: tenant.id,
        academicYearId: year.id,
        name: "Hifz Group A",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      academicYearId: year.id,
      name: "Hifz Group A",
      nameBn: "হিফজ গ্রুপ এ",
      board: "BEFAQ",
      level: "Hifz",
      capacity: 40,
    },
  });

  const hifzStudents = [
    { studentId: "HIFZ-001", name: "আব্দুল্লাহ ইবনে মাসউদ", nameBn: "আব্দুল্লাহ ইবনে মাসউদ", juz: 5, page: 95 },
    { studentId: "HIFZ-002", name: "মুহাম্মদ ইউসুফ", nameBn: "মুহাম্মদ ইউসুফ", juz: 12, page: 230 },
    { studentId: "HIFZ-003", name: "উমর ফারুক", nameBn: "উমর ফারুক", juz: 3, page: 48 },
  ];

  for (const hs of hifzStudents) {
    const student = await prisma.student.upsert({
      where: {
        tenantId_studentId: {
          tenantId: tenant.id,
          studentId: hs.studentId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        studentId: hs.studentId,
        name: hs.name,
        nameBn: hs.nameBn,
        gender: "MALE",
        status: "ACTIVE",
        isHifzStudent: true,
        currentJuz: hs.juz,
        currentPage: hs.page,
        currentClassId: hifzClass.id,
        academicYearId: year.id,
        admissionDate: new Date("2025-01-15"),
        fatherName: "আবদুর রহমান",
        guardianPhone: "01711111111",
      },
    });

    await prisma.hifzProgress.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        tenantId: tenant.id,
        studentId: student.id,
        currentJuz: hs.juz,
        currentPage: hs.page,
        totalJuzCompleted: Math.max(0, hs.juz - 1),
        totalPagesMemorized: hs.page,
        averageQualityScore: 4.2,
        lastEntryDate: new Date(),
      },
    });
  }
  console.log("✅ Hifz students:", hifzStudents.length);

  console.log("\n🎉 Seed completed successfully!");
  console.log("────────────────────────────────────");
  console.log("Super Admin  → super@edupro.app / Super@1234");
  console.log("Admin        → admin@demo-madrasah.edu.bd / Admin@1234");
  console.log("────────────────────────────────────");
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
