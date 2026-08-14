import type {
  Application,
  Client,
  FreelancerProfile,
  FreelancerSkill,
  Job,
  JobSkill,
  Message,
  Resume,
  Skill,
  User,
} from "@prisma/client";
import {
  getKeyByValue,
  labelToApplicationStatus,
  labelToAvailabilityStatus,
  labelToRemoteType,
  labelToStreamType,
} from "../domain/types.js";
import { decryptText } from "../infrastructure/crypto.js";

type JobWithRelations = Job & {
  client: Client | null;
  skills: Array<JobSkill & { skill: Skill }>;
};

type FreelancerWithRelations = FreelancerProfile & { initialMeetingCompleted: boolean; initialMeetingCompletedAt: Date | null; user: User; skills: Array<FreelancerSkill & { skill: Skill }>; resumes: Resume[]; };

type ApplicationWithRelations = Application & {
  job: JobWithRelations;
  freelancerProfile: FreelancerWithRelations;
};

export function toRemoteLabel(value: string | null | undefined) {
  return value ? getKeyByValue(labelToRemoteType, value) : "";
}

export function toStreamLabel(value: string | null | undefined) {
  return value ? getKeyByValue(labelToStreamType, value) : "";
}

export function toAvailabilityLabel(
  value: string | null | undefined,
  note?: string | null,
) {
  if (value === "scheduled") {
    return "稼働可能開始日";
  }
  if (note) return note;
  return value ? getKeyByValue(labelToAvailabilityStatus, value) : "";
}

export function toApplicationStatusLabel(value: string) {
  return getKeyByValue(labelToApplicationStatus, value);
}

export function mapJob(job: JobWithRelations) {
  const required = job.skills
    .filter((item) => item.requirementType === "required")
    .map((item) => item.skill.name);
  const nice = job.skills
    .filter((item) => item.requirementType === "nice")
    .map((item) => item.skill.name);

  return {
    id: job.id,
    title: job.title,
    client: job.client?.name || "未設定",
    summary: job.summary || "",
    required,
    nice,
    rateMin: job.rateMin,
    rateMax: job.rateMax,
    unitPrice: job.unitPrice || "",
    settlementLower: job.settlementLower || "",
    settlementUpper: job.settlementUpper || "",
    location: job.location || "",
    startPeriod: job.startPeriod || "",
    remoteRatio: job.remoteRatio || "",
    foreignerAvailability: job.foreignerAvailability || "",
    ageLimit: job.ageLimit || "",
    receivedAt: job.externalReceivedAt,
    receivedAtMs: job.externalReceivedAtMs != null
      ? Number(job.externalReceivedAtMs)
      : null,
    stream: toStreamLabel(job.streamType),
    remote: toRemoteLabel(job.remoteType),
    sortFlag: job.isPinned,
    active: job.isActive,
    createdAt: job.createdAt,
  };
}

export function mapFreelancer(profile: FreelancerWithRelations) {
  const latestResume =
    profile.resumes.find((resume) => resume.isLatest) || profile.resumes[0];

  return {
    id: profile.id,
    userId: profile.userId,
    name: decryptText(profile.user.name),
    nameKana: decryptText(profile.user.nameKana),
    email: decryptText(profile.user.email),
    phone: decryptText(profile.user.phone),
    role: profile.roleTitle || "",
    skills: profile.skills.map((item) => item.skill.name),
    skillExperiences: profile.skills.map((item) => ({
      name: item.skill.name,
      yearsExperience: item.yearsExperience
        ? Number(item.yearsExperience)
        : 0,
    })),
    desiredRate: profile.desiredRate || 0,
    yearsExperience: profile.yearsExperience
      ? Number(profile.yearsExperience)
      : 0,
    startDate: profile.startDate?.toISOString().slice(0, 10) || "",
    workRate: profile.workRate || "",
    remote: toRemoteLabel(profile.remoteType),
    availability: toAvailabilityLabel(
      profile.availabilityStatus,
      profile.availabilityNote,
    ),
    pledgedAt: profile.pledgedAt?.toISOString() || "",
    initialMeetingCompleted: profile.initialMeetingCompleted,
    initialMeetingCompletedAt: profile.initialMeetingCompletedAt?.toISOString() || "",
    lastUpdated: profile.lastUpdatedOn?.toISOString().slice(0, 10) || "",
    resumeId: latestResume?.id || "",
    resumeName: decryptText(latestResume?.originalFilename) || "",
    publicCode: profile.publicCode,
  };
}

export function mapApplication(application: ApplicationWithRelations) {
  return {
    id: application.id,
    jobId: application.jobId,
    freelancerId: application.freelancerProfileId,
    status: toApplicationStatusLabel(application.status),
    appliedAt: application.appliedAt.toISOString().slice(0, 10),
    job: mapJob(application.job),
    freelancer: mapFreelancer(application.freelancerProfile),
  };
}

export function mapMessage(
  message: Message & { sender: User; receiver: User | null },
) {
  return {
    id: message.id,
    freelancerId: message.freelancerProfileId,
    jobId: message.jobId || "",
    from: decryptText(message.sender.name),
    to: decryptText(message.receiver?.name),
    body: decryptText(message.body),
    at: message.sentAt.toISOString(),
    readAt: message.readAt?.toISOString() || "",
    channel: message.sender.role === "sales" ? "sales" : "freelancer",
    messageType: message.messageType,
  };
}
