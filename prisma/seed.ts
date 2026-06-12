import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { decryptText, encryptText, piiHash } from "../backend/src/infrastructure/crypto.js";

const databaseUrl = process.env.DATABASE_URL || "postgresql://tryangle:tryangle@localhost:5432/tryangle_freelance?schema=public";
const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

async function upsertSkill(name: string, category: "language" | "database" | "framework" | "cloud" | "tool" | "other") {
  return prisma.skill.upsert({
    where: { name_category: { name, category } },
    update: {},
    create: { name, category }
  });
}

async function upsertSeedUser(input: { email: string; passwordHash: string; role: "freelancer" | "sales"; name: string; phone?: string }) {
  const emailHash = piiHash(input.email);
  const encryptedData = {
    email: encryptText(input.email),
    emailHash,
    passwordHash: input.passwordHash,
    role: input.role,
    name: encryptText(input.name),
    phone: input.phone ? encryptText(input.phone) : null,
    isActive: true
  };
  const user = await prisma.user.findUnique({ where: { emailHash } });
  if (user) {
    return prisma.user.update({ where: { id: user.id }, data: encryptedData });
  }

  const normalized = input.email.trim().toLowerCase();
  const legacyUsers = await prisma.user.findMany({ where: { emailHash: null } });
  const legacyUser = legacyUsers.find((candidate) => decryptText(candidate.email).trim().toLowerCase() === normalized);
  if (legacyUser) {
    return prisma.user.update({ where: { id: legacyUser.id }, data: encryptedData });
  }

  return prisma.user.create({ data: encryptedData });
}

async function main() {
  const [freelancerPassword, salesPassword] = await Promise.all([
    bcrypt.hash("freelance123", 12),
    bcrypt.hash("sales123", 12)
  ]);

  const sales = await upsertSeedUser({
    email: "sales@tryangle.jp",
    passwordHash: salesPassword,
    role: "sales",
    name: "TRYANGLE 営業"
  });

  const freelancer = await upsertSeedUser({
    email: "freelancer@example.com",
    passwordHash: freelancerPassword,
    role: "freelancer",
    name: "山田 太郎",
    phone: "090-0000-0000"
  });

  await prisma.privacyPolicyConsent.createMany({
    data: [
      { userId: freelancer.id, policyVersion: "2026-06-10" },
      { userId: sales.id, policyVersion: "2026-06-10" }
    ],
    skipDuplicates: true
  });

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: freelancer.id },
    update: {
      publicCode: "tf-demo-yamada",
      roleTitle: "バックエンドエンジニア",
      yearsExperience: 6,
      desiredRate: 85,
      workRate: "週5",
      remoteType: "full_remote",
      availabilityStatus: "scheduled",
      availabilityNote: "2026年7月から空き予定",
      pledgedAt: new Date("2026-06-04T09:00:00+09:00"),
      lastUpdatedOn: new Date("2026-06-04")
    },
    create: {
      userId: freelancer.id,
      publicCode: "tf-demo-yamada",
      roleTitle: "バックエンドエンジニア",
      yearsExperience: 6,
      desiredRate: 85,
      workRate: "週5",
      remoteType: "full_remote",
      availabilityStatus: "scheduled",
      availabilityNote: "2026年7月から空き予定",
      pledgedAt: new Date("2026-06-04T09:00:00+09:00"),
      lastUpdatedOn: new Date("2026-06-04")
    }
  });

  const skillSpecs = [
    ["Java", "language"],
    ["TypeScript", "language"],
    ["Spring Boot", "framework"],
    ["React", "framework"],
    ["PostgreSQL", "database"],
    ["AWS", "cloud"],
    ["Terraform", "tool"]
  ] as const;

  const skills = await Promise.all(skillSpecs.map(([name, category]) => upsertSkill(name, category)));

  await prisma.freelancerSkill.createMany({
    data: skills.slice(0, 5).map((skill) => ({
      freelancerProfileId: profile.id,
      skillId: skill.id,
      yearsExperience: 4,
      level: "実務"
    })),
    skipDuplicates: true
  });

  await prisma.resume.upsert({
    where: { id: (await prisma.resume.findFirst({ where: { storageKey: "resumes/demo/yamada.pdf" }, select: { id: true } }))?.id || "00000000-0000-0000-0000-000000000000" },
    update: {
      originalFilename: encryptText("職務経歴書_山田太郎.pdf"),
      mimeType: "application/pdf",
      fileSizeBytes: 384000,
      isLatest: true
    },
    create: {
      freelancerProfileId: profile.id,
      originalFilename: encryptText("職務経歴書_山田太郎.pdf"),
      mimeType: "application/pdf",
      fileSizeBytes: 384000,
      storageKey: "resumes/demo/yamada.pdf",
      isLatest: true
    }
  });

  const client = await prisma.client.upsert({
    where: { name: "FinTech事業会社" },
    update: {},
    create: { name: "FinTech事業会社" }
  });

  const existingJob = await prisma.job.findFirst({
    where: { clientId: client.id, title: "金融SaaSのバックエンド刷新" },
    select: { id: true }
  });

  const job = existingJob
    ? await prisma.job.update({
      where: { id: existingJob.id },
      data: {
        summary: "Java/Spring Bootで既存決済基盤を刷新。設計から実装、テストまで担当。",
        rateMin: 80,
        rateMax: 100,
        marginRate: 12,
        streamType: "end_direct",
        remoteType: "hybrid",
        isPinned: true,
        isActive: true,
        createdBy: sales.id
      }
    })
    : await prisma.job.create({
    data: {
      clientId: client.id,
      title: "金融SaaSのバックエンド刷新",
      summary: "Java/Spring Bootで既存決済基盤を刷新。設計から実装、テストまで担当。",
      rateMin: 80,
      rateMax: 100,
      marginRate: 12,
      streamType: "end_direct",
      remoteType: "hybrid",
      isPinned: true,
      isActive: true,
      createdBy: sales.id,
    }
  });

  await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
  await prisma.jobSkill.createMany({
    data: skills.slice(0, 5).map((skill, index) => ({
      jobId: job.id,
      skillId: skill.id,
      requirementType: index < 4 ? "required" : "nice"
    }))
  });

  const application = await prisma.application.upsert({
    where: { jobId_freelancerProfileId: { jobId: job.id, freelancerProfileId: profile.id } },
    update: { status: "meeting_pending" },
    create: {
      jobId: job.id,
      freelancerProfileId: profile.id,
      status: "meeting_pending"
    }
  });

  await prisma.meetingRequest.deleteMany({ where: { applicationId: application.id } });
  await prisma.meetingRequest.createMany({
    data: [
      {
        freelancerProfileId: profile.id,
        applicationId: application.id,
        candidateAt: new Date("2026-06-10T10:00:00+09:00"),
        status: "candidate",
        createdBy: freelancer.id
      },
      {
        freelancerProfileId: profile.id,
        applicationId: application.id,
        candidateAt: new Date("2026-06-11T15:00:00+09:00"),
        status: "candidate",
        createdBy: freelancer.id
      }
    ]
  });

  await prisma.message.deleteMany({ where: { freelancerProfileId: profile.id, jobId: job.id } });
  await prisma.message.createMany({
    data: [
      {
        senderUserId: sales.id,
        receiverUserId: freelancer.id,
        freelancerProfileId: profile.id,
        jobId: job.id,
        messageType: "chat",
        body: encryptText("金融SaaS案件について、初回面談候補を確認しました。"),
        sentAt: new Date("2026-06-04T11:20:00+09:00")
      },
      {
        senderUserId: freelancer.id,
        receiverUserId: sales.id,
        freelancerProfileId: profile.id,
        jobId: job.id,
        messageType: "chat",
        body: encryptText("6月10日午前で調整可能です。職務経歴書も更新しました。"),
        sentAt: new Date("2026-06-04T11:36:00+09:00")
      }
    ]
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
