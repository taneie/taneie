import type { PrismaClient } from "@prisma/client";
import type { AuthContext } from "../../domain/types.js";
import { mapFreelancer, mapJob } from "../mappers.js";
import { freelancerInclude, jobInclude } from "./shared.js";

export class CatalogService {
  constructor(private readonly db: PrismaClient) {}

  async bootstrap(context: AuthContext) {
    const jobs = await this.db.job.findMany({
      where: context.role === "sales" ? {} : { isActive: true },
      include: jobInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    const freelancers =
      context.role === "sales"
        ? await this.db.freelancerProfile.findMany({
            include: freelancerInclude,
            orderBy: { updatedAt: "desc" },
          })
        : [];

    return {
      jobs: jobs.map(mapJob),
      freelancers: freelancers.map(mapFreelancer),
    };
  }
}
