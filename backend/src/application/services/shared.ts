import { Prisma, type PrismaClient } from "@prisma/client";
import { decryptText, encryptText, piiHash } from "../../infrastructure/crypto.js";
import { AppError } from "../../domain/types.js";

export const jobInclude = {
  client: true,
  skills: { include: { skill: true } },
} satisfies Prisma.JobInclude;

export const freelancerInclude = {
  user: true,
  skills: { include: { skill: true } },
  resumes: { orderBy: { uploadedAt: "desc" as const } },
} satisfies Prisma.FreelancerProfileInclude;

export const applicationInclude = {
  job: { include: jobInclude },
  freelancerProfile: { include: freelancerInclude },
} satisfies Prisma.ApplicationInclude;

export interface JobInput {
  title: string;
  client?: string;
  summary?: string;
  required?: string[];
  nice?: string[];
  rateMin: number;
  rateMax: number;
  marginRate: number;
  streamType: "end_direct" | "prime" | "secondary" | "other";
  remoteType: "full_remote" | "hybrid" | "onsite";
  isPinned: boolean;
}

export interface JobListInput {
  keyword?: string;
  skill?: string;
  rate?: number;
  remote?: string;
  stream?: string;
  limit?: number;
  offset?: number;
}

export interface ScoutableJobListInput {
  keyword?: string;
}

export interface ProfileInput {
  name?: string;
  nameKana?: string;
  phone?: string;
  roleTitle?: string;
  yearsExperience?: number;
  desiredRate?: number;
  startDate?: string;
  workRate?: string;
  remoteType?: "full_remote" | "hybrid" | "onsite";
  availabilityStatus?: "ready" | "scheduled" | "paused";
  availabilityNote?: string;
  pledgeAccepted?: boolean;
  initialMeetingCompleted?: boolean;
  skills?: string[];
  skillExperiences?: Array<{
    name: string;
    yearsExperience?: number;
  }>;
}

export interface ResumeMetadataInput {
  originalFilename: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageKey: string;
}

export interface ResumeUploadIntentInput {
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  applicationId?: string;
}

export interface ResumeBlobPayload extends ResumeUploadIntentInput {
  userId: string;
  pathname: string;
}

export interface ResumeUploadIntentResult {
  pathname: string;
  clientPayload: string;
  allowedContentTypes: readonly string[];
  maximumSizeInBytes: number;
  uploadMode: "api" | "blob";
}

export interface ResumeUploadCompleteInput extends ResumeUploadIntentInput {
  blobPath: string;
  blobUrl?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function upsertSkills(
  db: PrismaClient,
  names: string[],
  category: "language" | "database" | "framework" | "cloud" | "tool" | "other",
) {
  const uniqueNames = [
    ...new Set(names.map((name) => name.trim()).filter(Boolean)),
  ];
  return Promise.all(
    uniqueNames.map((name) =>
      db.skill.upsert({
        where: { name_category: { name, category } },
        update: {},
        create: { name, category },
      }),
    ),
  );
}

export function toAuthUser(user: {
  id: string;
  role: "freelancer" | "sales";
  email: string;
  name: string;
  freelancerProfile?: { id: string } | null;
}) {
  return {
    id: user.id,
    email: decryptText(user.email),
    role: user.role,
    name: decryptText(user.name),
    freelancerId: user.freelancerProfile?.id,
  };
}

export async function findUserByEmailForAuth(db: PrismaClient, email: string) {
  const emailHash = piiHash(email);
  const user = await db.user.findUnique({
    where: { emailHash },
    include: { freelancerProfile: true },
  });
  if (user) return user;

  const normalized = email.trim().toLowerCase();
  const legacyUsers = await db.user.findMany({
    where: { emailHash: null },
    include: { freelancerProfile: true },
  });
  const legacyUser = legacyUsers.find(
    (candidate) =>
      decryptText(candidate.email).trim().toLowerCase() === normalized,
  );
  if (!legacyUser) return null;

  return db.user.update({
    where: { id: legacyUser.id },
    data: {
      email: encryptText(decryptText(legacyUser.email)),
      emailHash,
      name: encryptText(decryptText(legacyUser.name)),
      phone: legacyUser.phone
        ? encryptText(decryptText(legacyUser.phone))
        : null,
    },
    include: { freelancerProfile: true },
  });
}

export async function assertFreelancerCanViewJobs(
  db: PrismaClient,
  userId: string,
) {
  const profile = await db.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: true,
      resumes: { where: { isLatest: true } },
      meetingRequests: true,
      user: true,
    },
  });

  const complete = Boolean(
    profile &&
      decryptText(profile.user.name) &&
      decryptText(profile.user.email) &&
      decryptText(profile.user.phone) &&
      profile.roleTitle &&
      profile.yearsExperience &&
      profile.desiredRate &&
      profile.startDate &&
      profile.workRate &&
      profile.remoteType &&
      profile.availabilityStatus &&
      profile.skills.length &&
      profile.resumes.length &&
      profile.meetingRequests.length &&
      profile.pledgedAt,
  );

  if (!complete) {
    throw new AppError(
      403,
      "案件閲覧にはプロフィール詳細の入力、レジュメ登録、面談候補登録、誓約同意が必要です。",
      "PROFILE_REQUIREMENTS_INCOMPLETE",
    );
  }
}
