import type { PrismaClient } from "@prisma/client";
import { notifyUser } from "../../infrastructure/push.js";
import { decryptText, encryptText } from "../../infrastructure/crypto.js";
import {
  AppError,
  labelToMeetingStatus,
  type AuthContext,
} from "../../domain/types.js";
import { mapMessage } from "../mappers.js";

export class CommunicationService {
  constructor(private readonly db: PrismaClient) {}

  async listMeetings(context: AuthContext, freelancerProfileId?: string) {
    const where =
      context.role === "sales"
        ? { freelancerProfileId }
        : { freelancerProfile: { userId: context.userId } };
    return this.db.meetingRequest.findMany({
      where,
      orderBy: { candidateAt: "asc" },
    });
  }

  async createMeeting(
    context: AuthContext,
    input: {
      freelancerProfileId?: string;
      applicationId?: string;
      candidateAt: string;
    },
  ) {
    const profileId =
      context.role === "sales"
        ? input.freelancerProfileId
        : (
            await this.db.freelancerProfile.findUniqueOrThrow({
              where: { userId: context.userId },
            })
          ).id;
    if (!profileId)
      throw new AppError(
        400,
        "freelancerProfileId is required",
        "FREELANCER_PROFILE_REQUIRED",
      );
    return this.db.meetingRequest.create({
      data: {
        freelancerProfileId: profileId,
        applicationId: input.applicationId,
        candidateAt: new Date(input.candidateAt),
        status: "candidate",
        createdBy: context.userId,
      },
    });
  }

  async updateMeeting(
    id: string,
    status: keyof typeof labelToMeetingStatus | string,
  ) {
    const nextStatus =
      status in labelToMeetingStatus
        ? labelToMeetingStatus[status as keyof typeof labelToMeetingStatus]
        : status;
    return this.db.meetingRequest.update({
      where: { id },
      data: { status: nextStatus as never },
    });
  }

  async listMessages(context: AuthContext, freelancerProfileId?: string) {
    const where =
      context.role === "sales"
        ? { freelancerProfileId }
        : { freelancerProfile: { userId: context.userId } };
    const messages = await this.db.message.findMany({
      where,
      include: { sender: true, receiver: true },
      orderBy: { sentAt: "asc" },
    });
    return messages.map(mapMessage);
  }

  async sendMessage(
    context: AuthContext,
    input: {
      freelancerProfileId?: string;
      receiverUserId?: string;
      jobId?: string;
      body: string;
      messageType?: "chat" | "scout" | "alive_check" | "system";
    },
  ) {
    if (input.messageType === "scout") {
      if (context.role !== "sales") {
        throw new AppError(403, "スカウトは営業アカウントで利用できます。", "FORBIDDEN");
      }
      if (!input.jobId) {
        throw new AppError(400, "スカウトには案件の紐づけが必要です。", "SCOUT_JOB_REQUIRED");
      }

      const job = await this.db.job.findFirst({
        where: { id: input.jobId, isActive: true },
        select: { id: true },
      });
      if (!job) {
        throw new AppError(404, "スカウトに紐づける案件が見つかりません。", "JOB_NOT_FOUND");
      }
    }

    const profile =
      context.role === "sales"
        ? await this.db.freelancerProfile.findUniqueOrThrow({
            where: { id: input.freelancerProfileId || "" },
          })
        : await this.db.freelancerProfile.findUniqueOrThrow({
            where: { userId: context.userId },
          });
    const receiverUserId =
      context.role === "sales"
        ? profile.userId
        : input.receiverUserId ||
          (
            await this.db.user.findFirstOrThrow({
              where: { role: "sales", isActive: true },
            })
          ).id;
    const message = await this.db.message.create({
      data: {
        senderUserId: context.userId,
        receiverUserId,
        freelancerProfileId: profile.id,
        jobId: input.jobId,
        body: encryptText(input.body),
        messageType: input.messageType || "chat",
      },
      include: { sender: true, receiver: true },
    });
    const mapped = mapMessage(message);
    await notifyUser(this.db, receiverUserId, {
      title: "TRYANGLE FREELANCE",
      body: `${decryptText(message.sender.name)}: ${input.body}`,
      url: "/",
      tag: `tryangle-chat-${message.id}`,
    });
    return mapped;
  }

  async markMessagesRead(
    context: AuthContext,
    input: { freelancerProfileId?: string },
  ) {
    const profile =
      context.role === "sales"
        ? await this.db.freelancerProfile.findUnique({
            where: { id: input.freelancerProfileId || "" },
          })
        : await this.db.freelancerProfile.findUnique({
            where: { userId: context.userId },
          });

    if (!profile) {
      throw new AppError(404, "チャット対象が見つかりません。", "PROFILE_NOT_FOUND");
    }

    await this.db.message.updateMany({
      where: {
        freelancerProfileId: profile.id,
        receiverUserId: context.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return this.listMessages(context, profile.id);
  }

  async createAliveCheck(executedBy: string) {
    const targets = await this.db.freelancerProfile.findMany({
      where: {
        OR: [
          { availabilityStatus: { not: "ready" } },
          { lastUpdatedOn: { lt: new Date(Date.now() - 14 * 86400000) } },
        ],
      },
      select: { id: true },
    });
    return this.db.aliveCheckBatch.create({
      data: {
        executedBy,
        targetCount: targets.length,
        targets: {
          create: targets.map((target) => ({ freelancerProfileId: target.id })),
        },
      },
      include: { targets: true },
    });
  }
}
