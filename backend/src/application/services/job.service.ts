import { Prisma, type PrismaClient } from "@prisma/client";
import type { AuthContext } from "../../domain/types.js";
import { labelToRemoteType, labelToStreamType } from "../../domain/types.js";
import { mapJob } from "../mappers.js";
import {
  assertFreelancerCanViewJobs,
  jobInclude,
  type FreelancerJobMatchCondition,
  type JobInput,
  type JobListInput,
  upsertSkills,
} from "./shared.js";

const DEFAULT_JOB_LIMIT = 10;

export class JobService {
  constructor(private readonly db: PrismaClient) {}

  async list(context?: AuthContext, input: JobListInput = {}) {
    let matchCondition: FreelancerJobMatchCondition | undefined;

    if (context?.role === "freelancer") {
      await assertFreelancerCanViewJobs(this.db, context.userId);
      matchCondition = await this.findFreelancerJobMatchCondition(context.userId);
    }

    const where = this.buildListWhere(context, input, matchCondition);
    const orderBy = [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

    if (input.limit === undefined && input.offset === undefined) {
      const jobs = await this.db.job.findMany({
        where,
        include: jobInclude,
        orderBy,
      });
      return jobs.map(mapJob);
    }

    const limit = input.limit ?? DEFAULT_JOB_LIMIT;
    const offset = input.offset ?? 0;
    const [total, jobs] = await Promise.all([
      this.db.job.count({ where }),
      this.db.job.findMany({
        where,
        include: jobInclude,
        orderBy,
        take: limit,
        skip: offset,
      }),
    ]);

    return {
      items: jobs.map(mapJob),
      total,
      limit,
      offset,
      hasMore: offset + jobs.length < total,
    };
  }

  async create(input: JobInput, createdBy: string) {
    const client = await this.db.client.upsert({
      where: { name: input.client || "未設定" },
      update: {},
      create: { name: input.client || "未設定" },
    });
    const required = await upsertSkills(
      this.db,
      input.required || [],
      "language",
    );
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
            ...required.map((skill) => ({
              skillId: skill.id,
              requirementType: "required" as const,
            })),
            ...nice.map((skill) => ({
              skillId: skill.id,
              requirementType: "nice" as const,
            })),
          ],
        },
      },
      include: jobInclude,
    });
    return mapJob(job);
  }

  async updateFlags(
    id: string,
    input: { isPinned?: boolean; isActive?: boolean },
  ) {
    const job = await this.db.job.update({
      where: { id },
      data: input,
      include: jobInclude,
    });
    return mapJob(job);
  }

  private async findFreelancerJobMatchCondition(userId: string) {
    const profile = await this.db.freelancerProfile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });

    return {
      desiredRate: profile?.desiredRate ?? undefined,
      remoteType: profile?.remoteType ?? undefined,
      skillNames:
        profile?.skills
          .map((item) => item.skill.name.trim())
          .filter(Boolean) ?? [],
    } satisfies FreelancerJobMatchCondition;
  }

  private buildListWhere(
    context: AuthContext | undefined,
    input: JobListInput,
    matchCondition?: FreelancerJobMatchCondition,
  ) {
    const filters: Prisma.JobWhereInput[] = [];

    if (context?.role !== "sales") {
      filters.push({ isActive: true });
    }

    if (context?.role === "freelancer" && matchCondition) {
      if (matchCondition.desiredRate) {
        filters.push({ rateMax: { gte: matchCondition.desiredRate } });
      }

      if (matchCondition.remoteType) {
        filters.push({ remoteType: matchCondition.remoteType });
      }

      if (matchCondition.skillNames.length) {
        filters.push({
          skills: {
            some: {
              skill: {
                name: { in: matchCondition.skillNames, mode: "insensitive" },
              },
            },
          },
        });
      }
    }

    if (input.keyword) {
      filters.push({
        OR: [
          { title: { contains: input.keyword, mode: "insensitive" } },
          { summary: { contains: input.keyword, mode: "insensitive" } },
          {
            client: {
              name: { contains: input.keyword, mode: "insensitive" },
            },
          },
        ],
      });
    }

    if (input.skill) {
      filters.push({
        skills: {
          some: {
            skill: {
              name: { contains: input.skill, mode: "insensitive" },
            },
          },
        },
      });
    }

    if (input.rate !== undefined) {
      filters.push({ rateMax: { gte: input.rate } });
    }

    if (input.remote && input.remote in labelToRemoteType) {
      filters.push({
        remoteType: labelToRemoteType[input.remote as keyof typeof labelToRemoteType],
      });
    }

    if (input.stream && input.stream in labelToStreamType) {
      filters.push({
        streamType: labelToStreamType[input.stream as keyof typeof labelToStreamType],
      });
    }

    return filters.length ? { AND: filters } : {};
  }
}
