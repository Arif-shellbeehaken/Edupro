import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

export const extendedOpsRepository = {
  // Alumni
  async listAlumni(take = 100) {
    const tid = requireTenantId();
    return prisma.alumni.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { graduationYear: "desc" },
      take,
    });
  },
  async createAlumni(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    phone?: string;
    email?: string;
    graduationYear?: number;
    lastClass?: string;
    currentJob?: string;
    organization?: string;
  }) {
    return prisma.alumni.create({ data: { ...data, isActive: true } });
  },

  // Health
  async listHealth(take = 100) {
    const tid = requireTenantId();
    return prisma.healthRecord.findMany({
      where: { tenantId: tid },
      orderBy: { updatedAt: "desc" },
      take,
    });
  },
  async upsertHealth(data: {
    tenantId: string;
    studentId: string;
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
    vaccinations?: string;
    lastVisitNote?: string;
    emergencyContact?: string;
    notes?: string;
  }) {
    return prisma.healthRecord.upsert({
      where: {
        tenantId_studentId: { tenantId: data.tenantId, studentId: data.studentId },
      },
      create: { ...data, lastVisitAt: new Date() },
      update: {
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        chronicConditions: data.chronicConditions,
        vaccinations: data.vaccinations,
        lastVisitNote: data.lastVisitNote,
        emergencyContact: data.emergencyContact,
        notes: data.notes,
        lastVisitAt: new Date(),
      },
    });
  },

  // Notices
  async listNotices(take = 50) {
    const tid = requireTenantId();
    return prisma.notice.findMany({
      where: { tenantId: tid },
      orderBy: { publishedAt: "desc" },
      take,
    });
  },
  async createNotice(data: {
    tenantId: string;
    title: string;
    titleBn?: string;
    body: string;
    audience?: string;
  }) {
    return prisma.notice.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        titleBn: data.titleBn,
        body: data.body,
        audience: data.audience || "ALL",
        isPublished: true,
      },
    });
  },

  // Surveys
  async listSurveys(take = 50) {
    const tid = requireTenantId();
    return prisma.survey.findMany({
      where: { tenantId: tid },
      include: { responses: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  async createSurvey(data: {
    tenantId: string;
    title: string;
    description?: string;
    audience?: string;
  }) {
    return prisma.survey.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        audience: data.audience || "PARENTS",
        status: "OPEN",
      },
    });
  },
  async addSurveyResponse(data: {
    tenantId: string;
    surveyId: string;
    respondent?: string;
    score?: number;
    comment?: string;
  }) {
    return prisma.surveyResponse.create({ data });
  },

  // Clubs
  async listClubs(take = 50) {
    const tid = requireTenantId();
    return prisma.club.findMany({
      where: { tenantId: tid, isActive: true },
      include: { members: true },
      orderBy: { name: "asc" },
      take,
    });
  },
  async createClub(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    category?: string;
    coachName?: string;
  }) {
    return prisma.club.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        category: data.category || "GENERAL",
        coachName: data.coachName,
        isActive: true,
      },
    });
  },
  async addClubMember(data: {
    tenantId: string;
    clubId: string;
    studentId: string;
    role?: string;
  }) {
    return prisma.clubMember.create({
      data: {
        tenantId: data.tenantId,
        clubId: data.clubId,
        studentId: data.studentId,
        role: data.role || "MEMBER",
      },
    });
  },

  // LMS
  async listMaterials(take = 100) {
    const tid = requireTenantId();
    return prisma.lmsMaterial.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  async createMaterial(data: {
    tenantId: string;
    title: string;
    className?: string;
    subject?: string;
    materialType?: string;
    url?: string;
    body?: string;
  }) {
    return prisma.lmsMaterial.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        className: data.className,
        subject: data.subject,
        materialType: data.materialType || "NOTE",
        url: data.url,
        body: data.body,
        isPublished: true,
      },
    });
  },

  // Campus branches
  async listCampuses(take = 50) {
    const tid = requireTenantId();
    return prisma.campus.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
      take,
    });
  },
  async createCampus(data: {
    tenantId: string;
    name: string;
    nameBn?: string;
    code?: string;
    address?: string;
    phone?: string;
    isMain?: boolean;
  }) {
    return prisma.campus.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        nameBn: data.nameBn,
        code: data.code,
        address: data.address,
        phone: data.phone,
        isMain: data.isMain ?? false,
        isActive: true,
      },
    });
  },

  // Emergency
  async listEmergencies(take = 50) {
    const tid = requireTenantId();
    return prisma.emergencyAlert.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  async createEmergency(data: {
    tenantId: string;
    title: string;
    message: string;
    severity?: string;
    audience?: string;
    createdById?: string;
  }) {
    return prisma.emergencyAlert.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        message: data.message,
        severity: data.severity || "HIGH",
        audience: data.audience || "ALL",
        status: "ACTIVE",
        createdById: data.createdById,
      },
    });
  },
  async resolveEmergency(id: string) {
    const tid = requireTenantId();
    return prisma.emergencyAlert.updateMany({
      where: { id, tenantId: tid },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  },

  // Career / jobs
  async listJobs(take = 50) {
    const tid = requireTenantId();
    return prisma.jobPosting.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  async createJob(data: {
    tenantId: string;
    title: string;
    company?: string;
    location?: string;
    jobType?: string;
    description?: string;
    applyUrl?: string;
  }) {
    return prisma.jobPosting.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        company: data.company,
        location: data.location,
        jobType: data.jobType || "FULL_TIME",
        description: data.description,
        applyUrl: data.applyUrl,
        isActive: true,
      },
    });
  },

  // Fixed assets
  async listAssets(take = 100) {
    const tid = requireTenantId();
    return prisma.fixedAsset.findMany({
      where: { tenantId: tid, isActive: true },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  async createAsset(data: {
    tenantId: string;
    name: string;
    category?: string;
    assetTag?: string;
    location?: string;
    purchaseValue?: number;
    condition?: string;
    notes?: string;
  }) {
    return prisma.fixedAsset.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        category: data.category || "GENERAL",
        assetTag: data.assetTag,
        location: data.location,
        purchaseValue: data.purchaseValue,
        condition: data.condition || "GOOD",
        notes: data.notes,
        isActive: true,
      },
    });
  },

  // Question bank
  async listQuestions(take = 100) {
    const tid = requireTenantId();
    return prisma.questionBankItem.findMany({
      where: { tenantId: tid },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
  async createQuestion(data: {
    tenantId: string;
    subject: string;
    className?: string;
    questionType?: string;
    questionText: string;
    optionsJson?: string;
    correctAnswer?: string;
    difficulty?: string;
    marks?: number;
  }) {
    return prisma.questionBankItem.create({
      data: {
        tenantId: data.tenantId,
        subject: data.subject,
        className: data.className,
        questionType: data.questionType || "MCQ",
        questionText: data.questionText,
        optionsJson: data.optionsJson,
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty || "MEDIUM",
        marks: data.marks ?? 1,
      },
    });
  },
};
