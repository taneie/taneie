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
    return applications.map(mapApplication);
  }

  async apply(jobId: string, userId: string) {
    await assertFreelancerCanViewJobs(this.db, userId);
    const profile = await this.db.freelancerProfile.findUniqueOrThrow({
      where: { userId },
    });

    if (!profile.initialMeetingCompleted) {
      throw new AppError(
        403,
        "初回面談が完了していないため応募できません。営業担当との初回面談後に応募できます。",
        "INITIAL_MEETING_REQUIRED",
      );
    }
    const application = await this.db.application
      .create({
        data: {
          jobId,
          freelancerProfileId: profile.id,
          status: "screening",
          histories: { create: { toStatus: "screening", changedBy: userId } },
        },
        include: applicationInclude,
      })
      .catch((error: unknown) => {
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
    const application = await this.db.application.update({
      where: { id },
      data: {
        status: status as never,
        histories: {
          create: {
            fromStatus: current.status,
            toStatus: status as never,
            changedBy,
            note,
          },
        },
      },
      include: applicationInclude,
    });
    const mapped = mapApplication(application);
    await this.notifyStatusChanged(application, mapped.status);
    return mapped;
  }

  private async notifyStatusChanged(
    application: {
      id: string;
      job: { title: string };
      freelancerProfile: { userId: string | null };
    },
    statusLabel: string,
  ) {
    await notifyUser(this.db, application.freelancerProfile.userId, {
      title: "TRYANGLE FREELANCE",
      body: `${application.job.title}の選考ステータスが「${statusLabel}」になりました。`,
      url: "/",
      tag: `tryangle-application-${application.id}-${statusLabel}`,
    });
  }
}
