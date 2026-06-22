import { z } from "zod";
import {
  labelToApplicationStatus,
  labelToAvailabilityStatus,
  labelToMeetingStatus,
  labelToRemoteType,
  labelToStreamType,
} from "../../domain/types.js";

const roleTitleOptions = [
  "フロントエンドエンジニア",
  "バックエンドエンジニア",
  "フルスタックエンジニア",
  "モバイルエンジニア",
  "インフラ・SRE",
  "クラウドエンジニア",
  "DevOpsエンジニア",
  "データエンジニア",
  "機械学習エンジニア",
  "QAエンジニア",
  "セキュリティエンジニア",
  "組み込みエンジニア",
  "テックリード",
  "PM/PL",
] as const;

const roleTitle = z.union([z.enum(roleTitleOptions), z.literal("")]);

const remoteType = z
  .union([
    z.enum(["full_remote", "hybrid", "onsite"]),
    z.enum(
      Object.keys(labelToRemoteType) as [
        keyof typeof labelToRemoteType,
        ...Array<keyof typeof labelToRemoteType>,
      ],
    ),
  ])
  .transform((value) =>
    value in labelToRemoteType
      ? labelToRemoteType[value as keyof typeof labelToRemoteType]
      : value,
  );

const streamType = z
  .union([
    z.enum(["end_direct", "prime", "secondary", "other"]),
    z.enum(
      Object.keys(labelToStreamType) as [
        keyof typeof labelToStreamType,
        ...Array<keyof typeof labelToStreamType>,
      ],
    ),
  ])
  .transform((value) =>
    value in labelToStreamType
      ? labelToStreamType[value as keyof typeof labelToStreamType]
      : value,
  );

const availabilityStatus = z
  .union([
    z.enum(["ready", "scheduled", "paused"]),
    z.enum(
      Object.keys(labelToAvailabilityStatus) as [
        keyof typeof labelToAvailabilityStatus,
        ...Array<keyof typeof labelToAvailabilityStatus>,
      ],
    ),
  ])
  .transform((value) =>
    value in labelToAvailabilityStatus
      ? labelToAvailabilityStatus[
          value as keyof typeof labelToAvailabilityStatus
        ]
      : value,
  );

const applicationStatus = z
  .union([
    z.enum(["screening", "meeting_pending", "contracted", "rejected"]),
    z.enum(
      Object.keys(labelToApplicationStatus) as [
        keyof typeof labelToApplicationStatus,
        ...Array<keyof typeof labelToApplicationStatus>,
      ],
    ),
  ])
  .transform((value) =>
    value in labelToApplicationStatus
      ? labelToApplicationStatus[value as keyof typeof labelToApplicationStatus]
      : value,
  );

const meetingStatus = z
  .union([
    z.enum(["candidate", "confirmed", "reschedule"]),
    z.enum(
      Object.keys(labelToMeetingStatus) as [
        keyof typeof labelToMeetingStatus,
        ...Array<keyof typeof labelToMeetingStatus>,
      ],
    ),
  ])
  .transform((value) =>
    value in labelToMeetingStatus
      ? labelToMeetingStatus[value as keyof typeof labelToMeetingStatus]
      : value,
  );

export const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  privacyPolicyAccepted: z.literal(true),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(32).max(255),
  password: z.string().min(8).max(128),
});

export const listJobsQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  skill: z.string().trim().optional(),
  rate: z.coerce.number().int().min(0).optional(),
  remote: z.string().trim().optional(),
  stream: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const listScoutableJobsQuerySchema = z.object({
  keyword: z.string().trim().optional(),
});

export const createJobSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    client: z.string().trim().max(255).optional(),
    summary: z.string().trim().optional(),
    required: z.array(z.string().trim().min(1)).default([]),
    nice: z.array(z.string().trim().min(1)).default([]),
    rateMin: z.coerce.number().int().min(0),
    rateMax: z.coerce.number().int().min(0),
    marginRate: z.coerce.number().min(0).max(100),
    streamType,
    remoteType,
    isPinned: z.boolean().default(false),
  })
  .refine((value) => value.rateMax >= value.rateMin, {
    message: "rateMax must be greater than or equal to rateMin",
    path: ["rateMax"],
  });

export const updateJobFlagsSchema = z.object({
  isPinned: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  nameKana: z.string().trim().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  roleTitle: roleTitle.optional(),
  yearsExperience: z.coerce.number().min(0).max(99).optional(),
  desiredRate: z.coerce.number().int().min(0).optional(),
  startDate: z.string().trim().optional(),
  workRate: z.string().trim().max(50).optional(),
  remoteType: remoteType.optional(),
  availabilityStatus: availabilityStatus.optional(),
  availabilityNote: z.string().trim().max(255).optional(),
  pledgeAccepted: z.boolean().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
});

export const updateInitialMeetingSchema = z.object({
  completed: z.boolean(),
});

export const applySchema = z.object({
  jobId: z.string().uuid(),
});

export const changeApplicationStatusSchema = z.object({
  status: applicationStatus,
  note: z.string().trim().optional(),
});

export const createMeetingSchema = z.object({
  freelancerProfileId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  candidateAt: z.string().datetime({ offset: true }),
});

export const updateMeetingStatusSchema = z.object({
  status: meetingStatus,
});

export const sendMessageSchema = z
  .object({
    freelancerProfileId: z.string().uuid().optional(),
    receiverUserId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    body: z.string().trim().min(1),
    messageType: z
      .enum(["chat", "scout", "alive_check", "system"])
      .default("chat"),
  })
  .superRefine((value, ctx) => {
    if (value.messageType === "scout" && !value.jobId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobId"],
        message: "スカウトには案件の紐づけが必要です。",
      });
    }
  });

export const markMessagesReadSchema = z.object({
  freelancerProfileId: z.string().uuid().optional(),
});

export const createContactInquirySchema = z.object({
  inquiryType: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional(),
  subject: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1).max(5000),
});

export const answerContactInquirySchema = z.object({
  answerBody: z.string().trim().min(1).max(5000),
});

export const resumeMetadataSchema = z.object({
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100).optional(),
  fileSizeBytes: z.coerce.number().int().min(0).optional(),
  storageKey: z.string().trim().min(1).max(500),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(500),
  keys: z.object({
    p256dh: z.string().min(1).max(255),
    auth: z.string().min(1).max(255),
  }),
});
