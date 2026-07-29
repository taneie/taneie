import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  decryptText,
  encryptText,
  piiHash,
} from "../src/infrastructure/crypto.js";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://frichy:frichy@localhost:5432/frichy?schema=public";
const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });

const demoEmails = ["sales@frichy.jp", "freelancer@example.com"];
const demoFreelancerPublicCode = "tf-demo-yamada";

async function resetDemoFreelancerProfile() {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { publicCode: demoFreelancerPublicCode },
    select: { userId: true },
  });
  if (!profile) return;

  await prisma.user.delete({ where: { id: profile.userId } });
}

async function upsertSkill(
  name: string,
  category: "language" | "database" | "framework" | "cloud" | "tool" | "other",
) {
  return prisma.skill.upsert({
    where: { name_category: { name, category } },
    update: {},
    create: { name, category },
  });
}

async function upsertSeedUser(input: {
  email: string;
  passwordHash: string;
  role: "freelancer" | "sales";
  name: string;
  phone?: string;
}) {
  const emailHash = piiHash(input.email);
  const encryptedData = {
    email: encryptText(input.email),
    emailHash,
    passwordHash: input.passwordHash,
    role: input.role,
    name: encryptText(input.name),
    phone: input.phone ? encryptText(input.phone) : null,
    isActive: true,
  };
  if (demoEmails.includes(input.email)) {
    const existingDemoUsers = await prisma.user.findMany({
      where: {
        OR: [
          { emailHash },
          { email: input.email },
        ],
      },
      select: { id: true },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: existingDemoUsers.map((user) => user.id) },
      },
    });

    return prisma.user.create({ data: encryptedData });
  }

  const user = await prisma.user.findUnique({ where: { emailHash } });
  if (user) {
    return prisma.user.update({ where: { id: user.id }, data: encryptedData });
  }

  const normalized = input.email.trim().toLowerCase();
  const legacyUsers = await prisma.user.findMany({
    where: { emailHash: null },
  });
  const legacyUser = legacyUsers.find(
    (candidate) =>
      decryptText(candidate.email).trim().toLowerCase() === normalized,
  );
  if (legacyUser) {
    return prisma.user.update({
      where: { id: legacyUser.id },
      data: encryptedData,
    });
  }

  return prisma.user.create({ data: encryptedData });
}

async function main() {
  const [freelancerPassword, salesPassword] = await Promise.all([
    bcrypt.hash("freelance123", 12),
    bcrypt.hash("sales123", 12),
  ]);

  await resetDemoFreelancerProfile();

  const sales = await upsertSeedUser({
    email: "sales@frichy.jp",
    passwordHash: salesPassword,
    role: "sales",
    name: "営業",
  });

  const freelancer = await upsertSeedUser({
    email: "freelancer@example.com",
    passwordHash: freelancerPassword,
    role: "freelancer",
    name: "山田 太郎",
    phone: "090-0000-0000",
  });

  await prisma.privacyPolicyConsent.createMany({
    data: [
      { userId: freelancer.id, policyVersion: "2026-06-10" },
      { userId: sales.id, policyVersion: "2026-06-10" },
    ],
    skipDuplicates: true,
  });

  const profile = await prisma.freelancerProfile.upsert({
    where: { userId: freelancer.id },
    update: {
      publicCode: demoFreelancerPublicCode,
      roleTitle: "バックエンドエンジニア",
      yearsExperience: 6,
      desiredRate: 85,
      workRate: "週5",
      remoteType: "full_remote",
      availabilityStatus: "scheduled",
      availabilityNote: "2026年7月から空き予定",
      pledgedAt: new Date("2026-06-04T09:00:00+09:00"),
      lastUpdatedOn: new Date("2026-06-04"),
    },
    create: {
      userId: freelancer.id,
      publicCode: demoFreelancerPublicCode,
      roleTitle: "バックエンドエンジニア",
      yearsExperience: 6,
      desiredRate: 85,
      workRate: "週5",
      remoteType: "full_remote",
      availabilityStatus: "scheduled",
      availabilityNote: "2026年7月から空き予定",
      pledgedAt: new Date("2026-06-04T09:00:00+09:00"),
      lastUpdatedOn: new Date("2026-06-04"),
    },
  });

  const skillSpecs = [
    ["Java", "language"],
    ["TypeScript", "language"],
    ["JavaScript", "language"],
    ["Python", "language"],
    ["Go", "language"],
    ["PHP", "language"],
    ["Ruby", "language"],
    ["Kotlin", "language"],
    ["Swift", "language"],
    ["C#", "language"],
    ["Spring Boot", "framework"],
    ["React", "framework"],
    ["Vue.js", "framework"],
    ["Nuxt.js", "framework"],
    ["Next.js", "framework"],
    ["Laravel", "framework"],
    ["Ruby on Rails", "framework"],
    ["Django", "framework"],
    ["Express", "framework"],
    ["PostgreSQL", "database"],
    ["MySQL", "database"],
    ["SQL Server", "database"],
    ["MongoDB", "database"],
    ["Redis", "database"],
    ["AWS", "cloud"],
    ["GCP", "cloud"],
    ["Azure", "cloud"],
    ["Firebase", "cloud"],
    ["Vercel", "cloud"],
    ["Terraform", "tool"],
    ["Docker", "tool"],
    ["Kubernetes", "tool"],
  ] as const;

  const skills = await Promise.all(
    skillSpecs.map(([name, category]) => upsertSkill(name, category)),
  );
  const skillByName = new Map(skills.map((skill) => [skill.name, skill]));

  await prisma.freelancerSkill.createMany({
    data: skills.slice(0, 5).map((skill) => ({
      freelancerProfileId: profile.id,
      skillId: skill.id,
      yearsExperience: 4,
      level: "実務",
    })),
    skipDuplicates: true,
  });

  await prisma.resume.upsert({
    where: {
      id:
        (
          await prisma.resume.findFirst({
            where: { storageKey: "resumes/demo/yamada.pdf" },
            select: { id: true },
          })
        )?.id || "00000000-0000-0000-0000-000000000000",
    },
    update: {
      originalFilename: encryptText("職務経歴書_山田太郎.pdf"),
      mimeType: "application/pdf",
      fileSizeBytes: 384000,
      isLatest: true,
    },
    create: {
      freelancerProfileId: profile.id,
      originalFilename: encryptText("職務経歴書_山田太郎.pdf"),
      mimeType: "application/pdf",
      fileSizeBytes: 384000,
      storageKey: "resumes/demo/yamada.pdf",
      isLatest: true,
    },
  });

  const client = await prisma.client.upsert({
    where: { name: "FinTech事業会社" },
    update: {},
    create: { name: "FinTech事業会社" },
  });

  const existingJob = await prisma.job.findFirst({
    where: { clientId: client.id, title: "金融SaaSのバックエンド刷新" },
    select: { id: true },
  });

  const job = existingJob
    ? await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          summary:
            "Java/Spring Bootで既存決済基盤を刷新。設計から実装、テストまで担当。",
          rateMin: 80,
          rateMax: 100,
          marginRate: 12,
          streamType: "end_direct",
          remoteType: "hybrid",
          isPinned: true,
          isActive: true,
          createdBy: sales.id,
        },
      })
    : await prisma.job.create({
        data: {
          clientId: client.id,
          title: "金融SaaSのバックエンド刷新",
          summary:
            "Java/Spring Bootで既存決済基盤を刷新。設計から実装、テストまで担当。",
          rateMin: 80,
          rateMax: 100,
          marginRate: 12,
          streamType: "end_direct",
          remoteType: "hybrid",
          isPinned: true,
          isActive: true,
          createdBy: sales.id,
        },
      });

  await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
  await prisma.jobSkill.createMany({
    data: skills.slice(0, 5).map((skill, index) => ({
      jobId: job.id,
      skillId: skill.id,
      requirementType: index < 4 ? "required" : "nice",
    })),
  });

  const jobFixtures = [
    {
      clientName: "HR Tech事業会社",
      title: "人材マッチングSaaSのフロント改善",
      summary: "React/TypeScriptで候補者・営業向け画面を改善。検索、応募、管理UIの実装が中心。",
      rateMin: 70,
      rateMax: 90,
      marginRate: 14,
      streamType: "prime",
      remoteType: "full_remote",
      isPinned: true,
      required: ["React", "TypeScript"],
      nice: ["Next.js", "Vercel"],
    },
    {
      clientName: "製造業DX企業",
      title: "製造業向けクラウド基盤構築",
      summary: "AWS/Terraformで新規クラウド環境を設計。監視、権限、CI/CD整備を含む。",
      rateMin: 75,
      rateMax: 95,
      marginRate: 13,
      streamType: "secondary",
      remoteType: "hybrid",
      isPinned: false,
      required: ["AWS", "Terraform", "Docker"],
      nice: ["Kubernetes"],
    },
    {
      clientName: "医療系スタートアップ",
      title: "オンライン診療サービスのAPI開発",
      summary: "Goで予約、決済、通知APIを開発。既存PHPからの段階移行も担当。",
      rateMin: 80,
      rateMax: 105,
      marginRate: 12,
      streamType: "end_direct",
      remoteType: "full_remote",
      isPinned: true,
      required: ["Go", "PostgreSQL"],
      nice: ["AWS", "Redis"],
    },
    {
      clientName: "ECプラットフォーム",
      title: "大規模ECの検索基盤リニューアル",
      summary: "PythonとRedisを用いた検索・レコメンド周辺の改善。性能検証を含む。",
      rateMin: 65,
      rateMax: 85,
      marginRate: 16,
      streamType: "prime",
      remoteType: "hybrid",
      isPinned: false,
      required: ["Python", "Redis"],
      nice: ["AWS"],
    },
    {
      clientName: "不動産Tech企業",
      title: "不動産管理システムのNuxt移行",
      summary: "Vue.jsからNuxt.jsへの移行。画面設計、状態管理、API接続を担当。",
      rateMin: 60,
      rateMax: 80,
      marginRate: 15,
      streamType: "prime",
      remoteType: "full_remote",
      isPinned: false,
      required: ["Vue.js", "Nuxt.js", "TypeScript"],
      nice: ["Firebase"],
    },
    {
      clientName: "物流SaaS企業",
      title: "配送管理システムのバックエンド開発",
      summary: "Java/Spring Bootで配車、配送状況、請求連携のAPIを開発。",
      rateMin: 72,
      rateMax: 92,
      marginRate: 14,
      streamType: "secondary",
      remoteType: "hybrid",
      isPinned: false,
      required: ["Java", "Spring Boot", "MySQL"],
      nice: ["Docker"],
    },
    {
      clientName: "教育系サービス",
      title: "学習アプリのモバイルAPI開発",
      summary: "Kotlin/Javaを利用したAPI改修とモバイル連携。認証、課金、通知を担当。",
      rateMin: 62,
      rateMax: 82,
      marginRate: 17,
      streamType: "other",
      remoteType: "hybrid",
      isPinned: false,
      required: ["Kotlin", "Java"],
      nice: ["Firebase"],
    },
    {
      clientName: "金融系SIer",
      title: "社内業務システムのC#刷新",
      summary: "C#で社内ワークフローを刷新。画面、API、バッチ処理を横断して担当。",
      rateMin: 58,
      rateMax: 78,
      marginRate: 18,
      streamType: "secondary",
      remoteType: "onsite",
      isPinned: false,
      required: ["C#", "SQL Server"],
      nice: ["Azure"],
    },
    {
      clientName: "メディア企業",
      title: "ニュース配信CMSの機能追加",
      summary: "PHP/Laravelで編集、配信、権限周りの改修。運用改善も含む。",
      rateMin: 55,
      rateMax: 75,
      marginRate: 16,
      streamType: "prime",
      remoteType: "hybrid",
      isPinned: false,
      required: ["PHP", "Laravel", "MySQL"],
      nice: ["AWS"],
    },
    {
      clientName: "広告配信企業",
      title: "広告効果分析ダッシュボード開発",
      summary: "Next.jsとPythonで分析画面と集計APIを開発。データ可視化を担当。",
      rateMin: 78,
      rateMax: 98,
      marginRate: 12,
      streamType: "end_direct",
      remoteType: "full_remote",
      isPinned: true,
      required: ["Next.js", "TypeScript", "Python"],
      nice: ["GCP"],
    },
    {
      clientName: "旅行予約サービス",
      title: "予約プラットフォームのRuby開発",
      summary: "Ruby on Railsで予約、在庫、決済連携を改善。既存コードの品質改善も実施。",
      rateMin: 68,
      rateMax: 88,
      marginRate: 15,
      streamType: "prime",
      remoteType: "full_remote",
      isPinned: false,
      required: ["Ruby", "Ruby on Rails", "PostgreSQL"],
      nice: ["Redis"],
    },
    {
      clientName: "自治体向けDX企業",
      title: "行政手続きポータルのAzure移行",
      summary: "Azure環境への移行とアプリ改修。認証、権限、監視設計を担当。",
      rateMin: 70,
      rateMax: 92,
      marginRate: 13,
      streamType: "secondary",
      remoteType: "hybrid",
      isPinned: false,
      required: ["Azure", "C#", "Docker"],
      nice: ["Kubernetes"],
    },
    {
      clientName: "ゲーム関連企業",
      title: "ゲーム運営管理ツールのVue開発",
      summary: "Vue.jsで運営管理画面を刷新。イベント設定、ユーザー検索、ログ確認を実装。",
      rateMin: 60,
      rateMax: 82,
      marginRate: 17,
      streamType: "other",
      remoteType: "hybrid",
      isPinned: false,
      required: ["Vue.js", "JavaScript"],
      nice: ["Firebase"],
    },
    {
      clientName: "保険Tech企業",
      title: "保険申込ワークフローのAPI設計",
      summary: "Spring Bootで申込、審査、契約周辺のAPIを設計・実装。",
      rateMin: 82,
      rateMax: 110,
      marginRate: 11,
      streamType: "end_direct",
      remoteType: "hybrid",
      isPinned: true,
      required: ["Java", "Spring Boot", "PostgreSQL"],
      nice: ["AWS"],
    },
    {
      clientName: "小売DX企業",
      title: "店舗在庫管理アプリのバックエンド",
      summary: "Express/TypeScriptで在庫・発注APIを開発。管理画面との連携も担当。",
      rateMin: 64,
      rateMax: 84,
      marginRate: 15,
      streamType: "prime",
      remoteType: "full_remote",
      isPinned: false,
      required: ["TypeScript", "Express", "MongoDB"],
      nice: ["AWS"],
    },
    {
      clientName: "AIプロダクト企業",
      title: "AI業務支援ツールのPython開発",
      summary: "Djangoで業務支援ツールのAPIと管理画面を開発。権限管理を含む。",
      rateMin: 75,
      rateMax: 100,
      marginRate: 12,
      streamType: "end_direct",
      remoteType: "full_remote",
      isPinned: true,
      required: ["Python", "Django", "PostgreSQL"],
      nice: ["GCP"],
    },
    {
      clientName: "通信キャリア",
      title: "会員基盤のKubernetes運用改善",
      summary: "Kubernetes環境の運用改善、監視、CI/CD、障害調査を担当。",
      rateMin: 85,
      rateMax: 115,
      marginRate: 10,
      streamType: "secondary",
      remoteType: "onsite",
      isPinned: false,
      required: ["Kubernetes", "Docker", "AWS"],
      nice: ["Terraform"],
    },
    {
      clientName: "ヘルスケアアプリ企業",
      title: "iOSヘルスケアアプリのSwift開発",
      summary: "Swiftで記録、通知、API連携を改善。UI実装とテストも担当。",
      rateMin: 66,
      rateMax: 86,
      marginRate: 16,
      streamType: "prime",
      remoteType: "hybrid",
      isPinned: false,
      required: ["Swift"],
      nice: ["Firebase", "AWS"],
    },
    {
      clientName: "BtoB SaaS企業",
      title: "営業管理SaaSのReact改善",
      summary: "React/TypeScriptで商談、顧客、レポート画面を改善。UI品質向上が中心。",
      rateMin: 70,
      rateMax: 94,
      marginRate: 13,
      streamType: "end_direct",
      remoteType: "full_remote",
      isPinned: false,
      required: ["React", "TypeScript"],
      nice: ["Next.js", "Vercel"],
    },
  ] as const;

  for (const fixture of jobFixtures) {
    const fixtureClient = await prisma.client.upsert({
      where: { name: fixture.clientName },
      update: {},
      create: { name: fixture.clientName },
    });
    const existingFixtureJob = await prisma.job.findFirst({
      where: { clientId: fixtureClient.id, title: fixture.title },
      select: { id: true },
    });
    const savedJob = existingFixtureJob
      ? await prisma.job.update({
          where: { id: existingFixtureJob.id },
          data: {
            summary: fixture.summary,
            rateMin: fixture.rateMin,
            rateMax: fixture.rateMax,
            marginRate: fixture.marginRate,
            streamType: fixture.streamType,
            remoteType: fixture.remoteType,
            isPinned: fixture.isPinned,
            isActive: true,
            createdBy: sales.id,
          },
        })
      : await prisma.job.create({
          data: {
            clientId: fixtureClient.id,
            title: fixture.title,
            summary: fixture.summary,
            rateMin: fixture.rateMin,
            rateMax: fixture.rateMax,
            marginRate: fixture.marginRate,
            streamType: fixture.streamType,
            remoteType: fixture.remoteType,
            isPinned: fixture.isPinned,
            isActive: true,
            createdBy: sales.id,
          },
        });

    await prisma.jobSkill.deleteMany({ where: { jobId: savedJob.id } });
    await prisma.jobSkill.createMany({
      data: [
        ...fixture.required.map((skillName) => ({
          jobId: savedJob.id,
          skillId: skillByName.get(skillName)!.id,
          requirementType: "required" as const,
        })),
        ...fixture.nice.map((skillName) => ({
          jobId: savedJob.id,
          skillId: skillByName.get(skillName)!.id,
          requirementType: "nice" as const,
        })),
      ],
    });
  }

  const application = await prisma.application.upsert({
    where: {
      jobId_freelancerProfileId: {
        jobId: job.id,
        freelancerProfileId: profile.id,
      },
    },
    update: { status: "meeting_pending" },
    create: {
      jobId: job.id,
      freelancerProfileId: profile.id,
      status: "meeting_pending",
    },
  });

  await prisma.meetingRequest.deleteMany({
    where: { applicationId: application.id },
  });
  await prisma.meetingRequest.createMany({
    data: [
      {
        freelancerProfileId: profile.id,
        applicationId: application.id,
        candidateAt: new Date("2026-06-10T10:00:00+09:00"),
        status: "candidate",
        createdBy: freelancer.id,
      },
      {
        freelancerProfileId: profile.id,
        applicationId: application.id,
        candidateAt: new Date("2026-06-11T15:00:00+09:00"),
        status: "candidate",
        createdBy: freelancer.id,
      },
    ],
  });

  await prisma.message.deleteMany({
    where: { freelancerProfileId: profile.id, jobId: job.id },
  });
  await prisma.message.createMany({
    data: [
      {
        senderUserId: sales.id,
        receiverUserId: freelancer.id,
        freelancerProfileId: profile.id,
        jobId: job.id,
        messageType: "chat",
        body: encryptText("金融SaaS案件について、初回面談候補を確認しました。"),
        sentAt: new Date("2026-06-04T11:20:00+09:00"),
      },
      {
        senderUserId: freelancer.id,
        receiverUserId: sales.id,
        freelancerProfileId: profile.id,
        jobId: job.id,
        messageType: "chat",
        body: encryptText(
          "6月10日午前で調整可能です。職務経歴書も更新しました。",
        ),
        sentAt: new Date("2026-06-04T11:36:00+09:00"),
      },
    ],
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
