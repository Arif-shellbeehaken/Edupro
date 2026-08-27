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
    { studentId: "HIFZ-004", name: "আবু বকর সিদ্দীক", nameBn: "আবু বকর সিদ্দীক", juz: 18, page: 340 },
    { studentId: "HIFZ-005", name: "উসমান ইবনে আফফান", nameBn: "উসমান ইবনে আফফান", juz: 27, page: 510 },
    { studentId: "HIFZ-006", name: "আলী ইবনে আবী তালিব", nameBn: "আলী ইবনে আবী তালিব", juz: 8, page: 155 },
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

  // 6. Sample Staff for HR/Payroll
  const staffSeed = [
    {
      employeeId: "EMP-001",
      name: "মাওলানা আব্দুর রহিম",
      nameBn: "মাওলানা আব্দুর রহিম",
      designation: "হিফজ শিক্ষক",
      roleType: "HIFZ_TEACHER",
      basicSalary: 25000,
      houseRent: 5000,
      medicalAllow: 2000,
    },
    {
      employeeId: "EMP-002",
      name: "উস্তাদ কামরুল হাসান",
      nameBn: "উস্তাদ কামরুল হাসান",
      designation: "সিনিয়র মুহাদ্দিস",
      roleType: "TEACHER",
      basicSalary: 30000,
      houseRent: 6000,
      medicalAllow: 2000,
    },
    {
      employeeId: "EMP-003",
      name: "জনাব করিম উল্লাহ",
      nameBn: "জনাব করিম উল্লাহ",
      designation: "অ্যাকাউন্ট্যান্ট",
      roleType: "ACCOUNTANT",
      basicSalary: 22000,
      houseRent: 4000,
      medicalAllow: 1500,
    },
  ];

  for (const st of staffSeed) {
    await prisma.staff.upsert({
      where: {
        tenantId_employeeId: {
          tenantId: tenant.id,
          employeeId: st.employeeId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        employeeId: st.employeeId,
        name: st.name,
        nameBn: st.nameBn,
        designation: st.designation,
        roleType: st.roleType,
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        joiningDate: new Date("2024-01-01"),
        basicSalary: st.basicSalary,
        houseRent: st.houseRent,
        medicalAllow: st.medicalAllow,
        otherAllow: 0,
        phone: "01700000000",
      },
    });
  }
  console.log("✅ Staff:", staffSeed.length);

  
  // ─── SEED_REFRESH_V2: general class, staff, subjects, fee ───
  const genClass = await prisma.class.upsert({
    where: {
      tenantId_academicYearId_name: {
        tenantId: tenant.id,
        academicYearId: year.id,
        name: "Class 6",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      academicYearId: year.id,
      name: "Class 6",
      nameBn: "ষষ্ঠ শ্রেণি",
      board: "NCTB",
      level: "Secondary",
      capacity: 50,
    },
  });

  const genStudents = [
    {
      studentId: "STD-601",
      name: "Rahim Uddin",
      nameBn: "রহিম উদ্দিন",
      phone: "01710000001",
    },
    {
      studentId: "STD-602",
      name: "Karim Hossain",
      nameBn: "করিম হোসেন",
      phone: "01710000002",
    },
    {
      studentId: "STD-603",
      name: "Fatema Akter",
      nameBn: "ফাতেমা আক্তার",
      phone: "01710000003",
    },
  ];
  for (const gs of genStudents) {
    await prisma.student.upsert({
      where: {
        tenantId_studentId: {
          tenantId: tenant.id,
          studentId: gs.studentId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        studentId: gs.studentId,
        name: gs.name,
        nameBn: gs.nameBn,
        gender: gs.studentId.endsWith("3") ? "FEMALE" : "MALE",
        status: "ACTIVE",
        currentClassId: genClass.id,
        academicYearId: year.id,
        fatherPhone: gs.phone,
        guardianPhone: gs.phone,
        admissionDate: new Date(),
      },
    });
  }
  console.log("✅ Class 6 +", genStudents.length, "students");

  const staffRows = [
    {
      employeeId: "EMP-001",
      name: "Md. Yusuf",
      nameBn: "মোঃ ইউসুফ",
      designation: "Teacher",
      roleType: "TEACHER",
      phone: "01810000001",
      basicSalary: 25000,
    },
    {
      employeeId: "EMP-002",
      name: "Ayesha Begum",
      nameBn: "আয়েশা বেগম",
      designation: "Accountant",
      roleType: "ACCOUNTANT",
      phone: "01810000002",
      basicSalary: 22000,
    },
    {
      employeeId: "EMP-003",
      name: "Maulana Karim",
      nameBn: "মাওলানা করিম",
      designation: "Hifz Teacher",
      roleType: "HIFZ_TEACHER",
      phone: "01810000003",
      basicSalary: 20000,
    },
  ];
  for (const s of staffRows) {
    await prisma.staff.upsert({
      where: {
        tenantId_employeeId: {
          tenantId: tenant.id,
          employeeId: s.employeeId,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        employeeId: s.employeeId,
        name: s.name,
        nameBn: s.nameBn,
        designation: s.designation,
        roleType: s.roleType,
        phone: s.phone,
        basicSalary: s.basicSalary,
        status: "ACTIVE",
        employmentType: "FULL_TIME",
        joiningDate: new Date("2024-01-01"),
      },
    });
  }
  console.log("✅ Staff:", staffRows.length);

  // Subjects
  const subjects = [
    { name: "Bangla", nameBn: "বাংলা", fullMarks: 100 },
    { name: "English", nameBn: "ইংরেজি", fullMarks: 100 },
    { name: "Mathematics", nameBn: "গণিত", fullMarks: 100 },
    { name: "Quran", nameBn: "কুরআন", fullMarks: 100 },
  ];
  for (const sub of subjects) {
    const existing = await prisma.subject.findFirst({
      where: { tenantId: tenant.id, name: sub.name },
    });
    if (!existing) {
      await prisma.subject.create({
        data: {
          tenantId: tenant.id,
          name: sub.name,
          nameBn: sub.nameBn,
          fullMarks: sub.fullMarks,
        },
      });
    }
  }
  console.log("✅ Subjects:", subjects.length);

  // Fee structure sample (if model exists)
  try {
    const feeExisting = await prisma.feeStructure.findFirst({
      where: { tenantId: tenant.id, name: "Monthly Tuition" },
    });
    if (!feeExisting) {
      await prisma.feeStructure.create({
        data: {
          tenantId: tenant.id,
          name: "Monthly Tuition",
          nameBn: "মাসিক বেতন",
          feeType: "TUITION",
          amount: 1500,
          classId: genClass.id,
          isRecurring: true,
          dueDay: 10,
          isActive: true,
        },
      });
      console.log("✅ Fee structure: Monthly Tuition ৳1500");
    }
  } catch (e) {
    console.log("⚠️ Fee structure skip", e instanceof Error ? e.message : e);
  }

  // Subscription plans for super-admin revenue
  const plans = [
    { code: "BASIC", name: "Basic", priceMonthly: 2000, sortOrder: 1 },
    { code: "STANDARD", name: "Standard", priceMonthly: 5000, sortOrder: 2 },
    { code: "PREMIUM", name: "Premium", priceMonthly: 10000, sortOrder: 3 },
  ];
  for (const p of plans) {
    try {
      await prisma.subscriptionPlanConfig.upsert({
        where: { code: p.code },
        update: { priceMonthly: p.priceMonthly, isActive: true },
        create: {
          code: p.code,
          name: p.name,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceMonthly * 10,
          maxStudents: p.code === "BASIC" ? 200 : p.code === "STANDARD" ? 500 : 2000,
          maxStaff: p.code === "BASIC" ? 20 : p.code === "STANDARD" ? 50 : 200,
          features: { modules: "all" },
          sortOrder: p.sortOrder,
          isActive: true,
        },
      });
    } catch {
      /* schema may differ */
    }
  }
  console.log("✅ Subscription plans seeded");

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
