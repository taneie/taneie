import { Prisma, type PrismaClient } from "@prisma/client";
import {
  AppError,
  labelToApplicationStatus,
  type AuthContext,
} from "../../domain/types.js";
import { notifyUser } from "../../infrastructure/push.js";
import { mapApplication } from "../mappers.js";
import {
  applicationInclude,
  assertFreelancerCanViewJobs,
} from "./shared.js";

export class ApplicationService {
  constructor(private readonly db: PrismaClient) {}

  async list(context: AuthContext) {
    const where =
      context.role === "sales"
        ? {}
        : { freelancerProfile: { userId: context.userId } };
    const applications = await this.db.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { appliedAt: "desc" },
    });
    return applications.map((application) =>
      mapApplication(application, {
        canViewExpiredContractedJob: context.role === "freelancer",
      }),
    );
  }

  async apply(jobId: string, userId: string) {
    await assertFreelancerCanViewJobs(this.db, userId);
    const profile = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { userId },
    });
    const job = await this.db.job.findFirst({
      where: { id: jobId, isActive: true },
      include: { client: true, skills: { include: { skill: true } } },
    });
    if (!job) throw new AppError(404, "案件が見つかりません。", "JOB_NOT_FOUND");

    const requiredSkills = job.skills
      .filter((item) => item.requirementType === "required")
      .map((item) => item.skill.name);
    const niceSkills = job.skills
      .filter((item) => item.requirementType === "nice")
      .map((item) => item.skill.name);

    const status = profile.initialMeetingCompleted
      ? "initial_meeting_completed"
      : "screening";
    let applicationId: string;
    try {
      applicationId = await this.db.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: {
            jobId,
            sourceJobId: jobId,
            freelancerProfileId: profile.id,
            status,
          },
        });
        await tx.applicationStatusHistory.create({
          data: {
            applicationId: created.id,
            toStatus: status,
            changedBy: userId,
          },
        });
        await tx.applicationJobSnapshot.create({
          data: {
            applicationId: created.id,
            title: job.title,
            clientName: job.client?.name || "未設定",
            summary: job.summary,
            requiredSkills,
            niceSkills,
            rateMin: job.rateMin,
            rateMax: job.rateMax,
            unitPrice: job.unitPrice,
            settlementLower: job.settlementLower,
            settlementUpper: job.settlementUpper,
            location: job.location,
            startPeriod: job.startPeriod,
            remoteRatio: job.remoteRatio,
            foreignerAvailability: job.foreignerAvailability,
            ageLimit: job.ageLimit,
            receivedAt: job.externalReceivedAt,
            receivedAtMs: job.externalReceivedAtMs,
            remoteType: job.remoteType,
            isPinned: job.isPinned,
            isActive: job.isActive,
            sourceCreatedAt: job.createdAt,
          },
        });
        return created.id;
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          409,
          "この案件にはすでに応募済みです。",
          "APPLICATION_ALREADY_EXISTS",
        );
      }
      throw error;
    }
    const application = await this.db.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: applicationInclude,
    });
    return mapApplication(application);
  }

  async changeStatus(
    id: string,
    toStatus: keyof typeof labelToApplicationStatus | string,
    changedBy: string,
    note?: string,
  ) {
    const status =
      toStatus in labelToApplicationStatus
        ? labelToApplicationStatus[
            toStatus as keyof typeof labelToApplicationStatus
          ]
        : toStatus;
    const current = await this.db.application.findUniqueOrThrow({
      where: { id },
    });
    await this.db.$transaction(async (tx) => {
      await tx.application.update({
        where: { id },
        data: {
          status: status as never,
          ...(status === "contracted"
            ? { isHiddenByExpiration: false, hiddenAt: null }
            : {}),
        },
      });
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: current.status,
          toStatus: status as never,
          changedBy,
          note,
        },
      });
    });
    const application = await this.db.application.findUniqueOrThrow({
      where: { id },
      include: applicationInclude,
    });
    const mapped = mapApplication(application);
    await this.notifyStatusChanged(application, mapped.status, mapped.job?.title || "案件");
    return mapped;
  }

  private async notifyStatusChanged(
    application: {
      id: string;
      freelancerProfile: { userId: string | null };
    },
    statusLabel: string,
    jobTitle: string,
  ) {
    await notifyUser(this.db, application.freelancerProfile.userId, {
      title: "Frichy",
      body: `${jobTitle}の選考ステータスが「${statusLabel}」になりました。`,
      url: "/",
      tag: `frichy-application-${application.id}-${statusLabel}`,
    });
  }
}
