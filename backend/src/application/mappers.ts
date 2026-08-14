import type {
  Application,
  ApplicationJobSnapshot,
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
} from "../domain/types.js";
import { decryptText } from "../infrastructure/crypto.js";

type JobWithRelations = Job & {
  client: Client | null;
  skills: Array<JobSkill & { skill: Skill }>;
};

type FreelancerWithRelations = FreelancerProfile & { initialMeetingCompleted: boolean; initialMeetingCompletedAt: Date | null; user: User; skills: Array<FreelancerSkill & { skill: Skill }>; resumes: Resume[]; };

type ApplicationWithRelations = Application & {
  job: JobWithRelations | null;
  jobSnapshot: ApplicationJobSnapshot | null;
  freelancerProfile: FreelancerWithRelations;
};

function snapshotSkills(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapApplicationJobSnapshot(snapshot: ApplicationJobSnapshot, sourceJobId: string) {
  return {
    id: sourceJobId,
    title: snapshot.title,
    client: snapshot.clientName,
    summary: snapshot.summary || "",
    required: snapshotSkills(snapshot.requiredSkills),
    nice: snapshotSkills(snapshot.niceSkills),
    rateMin: snapshot.rateMin,
    rateMax: snapshot.rateMax,
    unitPrice: snapshot.unitPrice || "",
    settlementLower: snapshot.settlementLower || "",
    settlementUpper: snapshot.settlementUpper || "",
    location: snapshot.location || "",
    startPeriod: snapshot.startPeriod || "",
    remoteRatio: snapshot.remoteRatio || "",
    foreignerAvailability: snapshot.foreignerAvailability || "",
    ageLimit: snapshot.ageLimit || "",
    receivedAt: snapshot.receivedAt,
    receivedAtMs: snapshot.receivedAtMs == null ? null : Number(snapshot.receivedAtMs),
    remote: toRemoteLabel(snapshot.remoteType),
    sortFlag: snapshot.isPinned,
    active: snapshot.isActive,
    createdAt: snapshot.sourceCreatedAt,
  };
}

export function toRemoteLabel(value: string | null | undefined) {
  return value ? getKeyByValue(labelToRemoteType, value) : "";
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
  const job = application.job
    ? mapJob(application.job)
    : application.jobSnapshot
      ? mapApplicationJobSnapshot(application.jobSnapshot, application.sourceJobId)
      : null;

  return {
    id: application.id,
    jobId: application.sourceJobId,
    freelancerId: application.freelancerProfileId,
    status: toApplicationStatusLabel(application.status),
    appliedAt: application.appliedAt.toISOString().slice(0, 10),
    job,
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
