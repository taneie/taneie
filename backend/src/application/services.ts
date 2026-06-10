import { Prisma, type PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { hashPassword, signToken, verifyPassword } from "../infrastructure/security.js";
import { notifyUser } from "../infrastructure/push.js";
import {
  AppError,
  labelToApplicationStatus,
  labelToAvailabilityStatus,
  labelToMeetingStatus,
  labelToRemoteType,
  labelToStreamType,
  type AuthContext
} from "../domain/types.js";
import { mapApplication, mapFreelancer, mapJob, mapMessage } from "./mappers.js";

const jobInclude = {
  client: true,
  skills: { include: { skill: true } }
} satisfies Prisma.JobInclude;

const freelancerInclude = {
  user: true,
  skills: { include: { skill: true } },
  resumes: { orderBy: { uploadedAt: "desc" as const } }
} satisfies Prisma.FreelancerProfileInclude;

const applicationInclude = {
  job: { include: jobInclude },
  freelancerProfile: { include: freelancerInclude }
} satisfies Prisma.ApplicationInclude;

export class AuthService {
  constructor(private readonly db: PrismaClient) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    roleTitle?: string;
    policyVersion: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const passwordHash = await hashPassword(input.password);
    const user = await this.db.user.create({
      data: {
        role: "freelancer",
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone || null,
        freelancerProfile: {
          create: {
            publicCode: `tf-${randomUUID().slice(0, 8)}`,
            roleTitle: input.roleTitle || null,
            lastUpdatedOn: new Date()
          }
        },
        privacyConsents: {
          create: {
            policyVersion: input.policyVersion,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent
          }
        }
      },
      include: { freelancerProfile: true }
    });

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    return { token, user: toAuthUser(user) };
  }

  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      include: { freelancerProfile: true }
    });
    if (!user || !user.isActive) return null;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    return { token, user: toAuthUser(user) };
  }
}

export class CatalogService {
  constructor(private readonly db: PrismaClient) {}

  async bootstrap(context: AuthContext) {
    const jobs = await this.db.job.findMany({
      where: context.role === "sales" ? {} : { isActive: true },
      include: jobInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
    });
    const freelancers = context.role === "sales"
      ? await this.db.freelancerProfile.findMany({
        include: freelancerInclude,
        orderBy: { updatedAt: "desc" }
      })
      : [];

    return {
      jobs: jobs.map(mapJob),
      freelancers: freelancers.map(mapFreelancer)
    };
  }
}

export class JobService {
  constructor(private readonly db: PrismaClient) {}

  async list(context?: AuthContext) {
    if (context?.role === "freelancer") {
      await assertFreelancerCanViewJobs(this.db, context.userId);
    }
    const jobs = await this.db.job.findMany({
      where: context?.role === "sales" ? {} : { isActive: true },
      include: jobInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
    });
    return jobs.map(mapJob);
  }

  async create(input: JobInput, createdBy: string) {
    const client = await this.db.client.upsert({
      where: { name: input.client || "未設定" },
      update: {},
      create: { name: input.client || "未設定" }
    });
    const required = await upsertSkills(this.db, input.required || [], "language");
    const nice = await upsertSkills(this.db, input.nice || [], "other");

    const job = await this.db.job.create({
      data: {
        clientId: client.id,
        title: input.title,
        summary: input.summary || "",
        rateMin: input.rateMin,
        rateMax: input.rateMax,
        marginRate: input.marginRate,
        streamType: input.streamType,
        remoteType: input.remoteType,
        isPinned: input.isPinned,
        isActive: true,
        createdBy,
        skills: {
          create: [
            ...required.map((skill) => ({ skillId: skill.id, requirementType: "required" as const })),
            ...nice.map((skill) => ({ skillId: skill.id, requirementType: "nice" as const }))
          ]
        }
      },
      include: jobInclude
    });
    return mapJob(job);
  }

  async updateFlags(id: string, input: { isPinned?: boolean; isActive?: boolean }) {
    const job = await this.db.job.update({
      where: { id },
      data: input,
      include: jobInclude
    });
    return mapJob(job);
  }
}

export class ProfileService {
  constructor(private readonly db: PrismaClient) {}

  async listFreelancers() {
    const profiles = await this.db.freelancerProfile.findMany({
      include: freelancerInclude,
      orderBy: { updatedAt: "desc" }
    });
    return profiles.map(mapFreelancer);
  }

  async getCurrent(userId: string) {
    const profile = await this.db.freelancerProfile.findUnique({
      where: { userId },
      include: freelancerInclude
    });
    return profile ? mapFreelancer(profile) : null;
  }

  async updateCurrent(userId: string, input: ProfileInput) {
    const profile = await this.db.freelancerProfile.upsert({
      where: { userId },
      update: {
        roleTitle: input.roleTitle,
        yearsExperience: input.yearsExperience,
        desiredRate: input.desiredRate,
        startDate: input.startDate ? new Date(input.startDate) : null,
        workRate: input.workRate,
        remoteType: input.remoteType,
        availabilityStatus: input.availabilityStatus,
        availabilityNote: input.availabilityNote,
        pledgedAt: input.pledgeAccepted ? new Date() : undefined,
        lastUpdatedOn: new Date()
      },
      create: {
        userId,
        publicCode: `tf-${randomUUID().slice(0, 8)}`,
        roleTitle: input.roleTitle,
        yearsExperience: input.yearsExperience,
        desiredRate: input.desiredRate,
        startDate: input.startDate ? new Date(input.startDate) : null,
        workRate: input.workRate,
        remoteType: input.remoteType,
        availabilityStatus: input.availabilityStatus,
        availabilityNote: input.availabilityNote,
        pledgedAt: input.pledgeAccepted ? new Date() : undefined,
        lastUpdatedOn: new Date()
      }
    });

    if (input.name || input.phone) {
      await this.db.user.update({
        where: { id: userId },
        data: { name: input.name, phone: input.phone }
      });
    }

    if (input.skills) {
      await this.db.freelancerSkill.deleteMany({ where: { freelancerProfileId: profile.id } });
      const skills = await upsertSkills(this.db, input.skills, "other");
      await this.db.freelancerSkill.createMany({
        data: skills.map((skill) => ({ freelancerProfileId: profile.id, skillId: skill.id }))
      });
    }

    const updated = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: freelancerInclude
    });
    return mapFreelancer(updated);
  }
}

export class ApplicationService {
  constructor(private readonly db: PrismaClient) {}

  async list(context: AuthContext) {
    const where = context.role === "sales"
      ? {}
      : { freelancerProfile: { userId: context.userId } };
    const applications = await this.db.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { appliedAt: "desc" }
    });
    return applications.map(mapApplication);
  }

  async apply(jobId: string, userId: string) {
    await assertFreelancerCanViewJobs(this.db, userId);
    const profile = await this.db.freelancerProfile.findUniqueOrThrow({ where: { userId } });
    const application = await this.db.application.create({
      data: {
        jobId,
        freelancerProfileId: profile.id,
        status: "screening",
        histories: { create: { toStatus: "screening", changedBy: userId } }
      },
      include: applicationInclude
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "この案件にはすでに応募済みです。", "APPLICATION_ALREADY_EXISTS");
      }
      throw error;
    });
    return mapApplication(application);
  }

  async changeStatus(id: string, toStatus: keyof typeof labelToApplicationStatus | string, changedBy: string, note?: string) {
    const status = toStatus in labelToApplicationStatus
      ? labelToApplicationStatus[toStatus as keyof typeof labelToApplicationStatus]
      : toStatus;
    const current = await this.db.application.findUniqueOrThrow({ where: { id } });
    const application = await this.db.application.update({
      where: { id },
      data: {
        status: status as never,
        histories: {
          create: {
            fromStatus: current.status,
            toStatus: status as never,
            changedBy,
            note
          }
        }
      },
      include: applicationInclude
    });
    return mapApplication(application);
  }
}

export class CommunicationService {
  constructor(private readonly db: PrismaClient) {}

  async listMeetings(context: AuthContext, freelancerProfileId?: string) {
    const where = context.role === "sales"
      ? { freelancerProfileId }
      : { freelancerProfile: { userId: context.userId } };
    return this.db.meetingRequest.findMany({
      where,
      orderBy: { candidateAt: "asc" }
    });
  }

  async createMeeting(context: AuthContext, input: { freelancerProfileId?: string; applicationId?: string; candidateAt: string }) {
    const profileId = context.role === "sales"
      ? input.freelancerProfileId
      : (await this.db.freelancerProfile.findUniqueOrThrow({ where: { userId: context.userId } })).id;
    if (!profileId) throw new AppError(400, "freelancerProfileId is required", "FREELANCER_PROFILE_REQUIRED");
    return this.db.meetingRequest.create({
      data: {
        freelancerProfileId: profileId,
        applicationId: input.applicationId,
        candidateAt: new Date(input.candidateAt),
        status: "candidate",
        createdBy: context.userId
      }
    });
  }

  async updateMeeting(id: string, status: keyof typeof labelToMeetingStatus | string) {
    const nextStatus = status in labelToMeetingStatus
      ? labelToMeetingStatus[status as keyof typeof labelToMeetingStatus]
      : status;
    return this.db.meetingRequest.update({
      where: { id },
      data: { status: nextStatus as never }
    });
  }

  async listMessages(context: AuthContext, freelancerProfileId?: string) {
    const where = context.role === "sales"
      ? { freelancerProfileId }
      : { freelancerProfile: { userId: context.userId } };
    const messages = await this.db.message.findMany({
      where,
      include: { sender: true, receiver: true },
      orderBy: { sentAt: "asc" }
    });
    return messages.map(mapMessage);
  }

  async sendMessage(context: AuthContext, input: { freelancerProfileId?: string; receiverUserId?: string; jobId?: string; body: string; messageType?: "chat" | "scout" | "alive_check" | "system" }) {
    const profile = context.role === "sales"
      ? await this.db.freelancerProfile.findUniqueOrThrow({ where: { id: input.freelancerProfileId || "" } })
      : await this.db.freelancerProfile.findUniqueOrThrow({ where: { userId: context.userId } });
    const receiverUserId = context.role === "sales"
      ? profile.userId
      : input.receiverUserId || (await this.db.user.findFirstOrThrow({ where: { role: "sales", isActive: true } })).id;
    const message = await this.db.message.create({
      data: {
        senderUserId: context.userId,
        receiverUserId,
        freelancerProfileId: profile.id,
        jobId: input.jobId,
        body: input.body,
        messageType: input.messageType || "chat"
      },
      include: { sender: true, receiver: true }
    });
    const mapped = mapMessage(message);
    await notifyUser(this.db, receiverUserId, {
      title: "TRYANGLE FREELANCE",
      body: `${message.sender.name}: ${input.body}`,
      url: "/",
      tag: `tryangle-chat-${message.id}`
    });
    return mapped;
  }

  async createAliveCheck(executedBy: string) {
    const targets = await this.db.freelancerProfile.findMany({
      where: {
        OR: [
          { availabilityStatus: { not: "ready" } },
          { lastUpdatedOn: { lt: new Date(Date.now() - 14 * 86400000) } }
        ]
      },
      select: { id: true }
    });
    return this.db.aliveCheckBatch.create({
      data: {
        executedBy,
        targetCount: targets.length,
        targets: { create: targets.map((target) => ({ freelancerProfileId: target.id })) }
      },
      include: { targets: true }
    });
  }
}

async function upsertSkills(db: PrismaClient, names: string[], category: "language" | "database" | "framework" | "cloud" | "tool" | "other") {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  return Promise.all(uniqueNames.map((name) => db.skill.upsert({
    where: { name_category: { name, category } },
    update: {},
    create: { name, category }
  })));
}

function toAuthUser(user: { id: string; role: "freelancer" | "sales"; email: string; name: string; freelancerProfile?: { id: string } | null }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    freelancerId: user.freelancerProfile?.id
  };
}

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

export interface ProfileInput {
  name?: string;
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
  skills?: string[];
}

async function assertFreelancerCanViewJobs(db: PrismaClient, userId: string) {
  const profile = await db.freelancerProfile.findUnique({
    where: { userId },
    include: {
      skills: true,
      resumes: { where: { isLatest: true } },
      meetingRequests: true,
      user: true
    }
  });

  const complete = Boolean(
    profile
    && profile.user.name
    && profile.user.email
    && profile.user.phone
    && profile.roleTitle
    && profile.yearsExperience
    && profile.desiredRate
    && profile.startDate
    && profile.workRate
    && profile.remoteType
    && profile.availabilityStatus
    && profile.skills.length
    && profile.resumes.length
    && profile.meetingRequests.length
    && profile.pledgedAt
  );

  if (!complete) {
    throw new AppError(403, "案件閲覧にはプロフィール詳細の入力、レジュメ登録、面談候補登録、誓約同意が必要です。", "PROFILE_REQUIREMENTS_INCOMPLETE");
  }
}
