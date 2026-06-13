import type { PrismaClient } from "@prisma/client";
import type { AuthContext } from "../../domain/types.js";
import { mapJob } from "../mappers.js";
import {
  assertFreelancerCanViewJobs,
  jobInclude,
  type JobInput,
  upsertSkills,
} from "./shared.js";

export class JobService {
  constructor(private readonly db: PrismaClient) {}

  async list(context?: AuthContext) {
    if (context?.role === "freelancer") {
      await assertFreelancerCanViewJobs(this.db, context.userId);
    }
    const jobs = await this.db.job.findMany({
      where: context?.role === "sales" ? {} : { isActive: true },
      include: jobInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    return jobs.map(mapJob);
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
}
