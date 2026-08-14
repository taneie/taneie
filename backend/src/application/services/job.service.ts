import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError, type AuthContext } from "../../domain/types.js";
import { labelToRemoteType } from "../../domain/types.js";
import { mapJob } from "../mappers.js";
import { ExternalProjectImportService } from "./external-project-import.service.js";
import {
  assertFreelancerCanViewJobs,
  jobInclude,
  type JobInput,
  type JobListInput,
  type ScoutableJobListInput,
  upsertSkills,
} from "./shared.js";

const DEFAULT_JOB_LIMIT = 10;
type FreelancerMatchProfile = {
  roleTitle: string | null;
  desiredRate: number | null;
  remoteType: string | null;
  skills: Array<{ skill: { name: string } }>;
};
type ListedJob = Prisma.JobGetPayload<{ include: typeof jobInclude }>;
export const MINIMUM_MATCH_SCORE = 4;

export class JobService {
  private readonly externalProjectImportService: ExternalProjectImportService;

  constructor(private readonly db: PrismaClient) {
    this.externalProjectImportService = new ExternalProjectImportService(db);
  }

  async list(context?: AuthContext, input: JobListInput = {}) {
    let freelancerMatchProfile: FreelancerMatchProfile | undefined;

    if (context?.role === "freelancer") {
      await assertFreelancerCanViewJobs(this.db, context.userId);
      freelancerMatchProfile =
        await this.db.freelancerProfile.findUniqueOrThrow({
          where: { userId: context.userId },
          select: {
            roleTitle: true,
            desiredRate: true,
            remoteType: true,
            skills: { include: { skill: true } },
          },
        });
    }

    const where = this.buildListWhere(context, input);
    const orderBy = [
      { isPinned: "desc" as const },
      { createdAt: "desc" as const },
    ];

    if (context?.role === "freelancer" && freelancerMatchProfile) {
      const jobs = await this.db.job.findMany({
        where,
        include: jobInclude,
        orderBy,
      });
      const matchedJobs = this.rankJobsByFreelancerMatch(
        jobs,
        freelancerMatchProfile,
      );

      if (input.limit === undefined && input.offset === undefined) {
        return matchedJobs.map(mapJob);
      }

      const limit = input.limit ?? DEFAULT_JOB_LIMIT;
      const offset = input.offset ?? 0;
      const pagedJobs = matchedJobs.slice(offset, offset + limit);
      return {
        items: pagedJobs.map(mapJob),
        total: matchedJobs.length,
        limit,
        offset,
        hasMore: offset + pagedJobs.length < matchedJobs.length,
      };
    }

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

  async listScoutableForFreelancer(
    context: AuthContext,
    freelancerProfileId: string,
    input: ScoutableJobListInput = {},
  ) {
    if (context.role !== "sales") {
      throw new AppError(403, "スカウト案件の検索は営業アカウントで利用できます。", "FORBIDDEN");
    }

    const profile = await this.db.freelancerProfile.findUnique({
      where: { id: freelancerProfileId },
      include: { skills: { include: { skill: true } } },
    });

    if (!profile) {
      throw new AppError(404, "候補者が見つかりません。", "FREELANCER_PROFILE_NOT_FOUND");
    }

    const where = this.buildScoutableJobWhere(profile, input);
    const jobs = await this.db.job.findMany({
      where,
      include: jobInclude,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return this.rankJobsByFreelancerMatch(jobs, profile)
      .slice(0, 30)
      .map(mapJob);
  }

  async getById(context: AuthContext | undefined, id: string) {
    if (context?.role === "freelancer") {
      await assertFreelancerCanViewJobs(this.db, context.userId);
    }

    const where: Prisma.JobWhereInput = { id };
    if (context?.role !== "sales") {
      where.isActive = true;
    }

    const job = await this.db.job.findFirst({
      where,
      include: jobInclude,
    });
    if (!job) {
      throw new AppError(404, "案件が見つかりません。", "JOB_NOT_FOUND");
    }

    return mapJob(job);
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
        marginRate: input.marginRate ?? 0,
        streamType: "other",
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

  async importExternalProjects(createdBy?: string | null, limit?: number, onlyNew = false) {
    return this.externalProjectImportService.importProjects(createdBy, limit, onlyNew);
  }

  private buildScoutableJobWhere(
    profile: {
      id: string;
      desiredRate: number | null;
      remoteType: string | null;
      skills: Array<{ skill: { name: string } }>;
    },
    input: ScoutableJobListInput,
  ) {
    const filters: Prisma.JobWhereInput[] = [
      { isActive: true },
      {
        messages: {
          none: {
            freelancerProfileId: profile.id,
            messageType: "scout",
          },
        },
      },
    ];

    if (input.keyword) {
      filters.push({
        OR: [
          { title: { contains: input.keyword, mode: "insensitive" } },
          { summary: { contains: input.keyword, mode: "insensitive" } },
          { location: { contains: input.keyword, mode: "insensitive" } },
          { startPeriod: { contains: input.keyword, mode: "insensitive" } },
          { remoteRatio: { contains: input.keyword, mode: "insensitive" } },
          {
            client: {
              name: { contains: input.keyword, mode: "insensitive" },
            },
          },
        ],
      });
    }

    return { AND: filters };
  }

  private buildListWhere(
    context: AuthContext | undefined,
    input: JobListInput,
  ) {
    const filters: Prisma.JobWhereInput[] = [];

    if (context?.role !== "sales") {
      filters.push({ isActive: true });
    }

    if (input.keyword) {
      filters.push({
        OR: [
          { title: { contains: input.keyword, mode: "insensitive" } },
          { summary: { contains: input.keyword, mode: "insensitive" } },
          { location: { contains: input.keyword, mode: "insensitive" } },
          { startPeriod: { contains: input.keyword, mode: "insensitive" } },
          { remoteRatio: { contains: input.keyword, mode: "insensitive" } },
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

    return filters.length ? { AND: filters } : {};
  }

  private rankJobsByFreelancerMatch(
    jobs: ListedJob[],
    profile: FreelancerMatchProfile,
  ) {
    return jobs
      .map((job) => ({ job, score: calculateJobMatchScore(job, profile) }))
      .filter((item) => item.score >= MINIMUM_MATCH_SCORE)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.job);
  }
}

export function calculateJobMatchScore(
  job: Pick<ListedJob, "title" | "summary" | "rateMin" | "rateMax" | "remoteType" | "skills">,
  profile: FreelancerMatchProfile,
) {
  const profileSkills = profile.skills.map((item) => item.skill.name).filter(Boolean);
  const matched = new Set<string>();
  let score = 0;

  for (const item of job.skills) {
    const skill = profileSkills.find((name) => skillNamesMatch(name, item.skill.name));
    if (!skill || matched.has(skill)) continue;
    matched.add(skill);
    score += item.requirementType === "required" ? 4 : 2;
  }

  if (roleMatchesJob(profile.roleTitle || "", job)) score += 3;
  if (rateMatches(profile.desiredRate, job.rateMin, job.rateMax)) score += 1;
  if (remoteMatches(profile.remoteType, job.remoteType)) score += 1;
  return score;
}

function skillNamesMatch(left: string, right: string) {
  const a = normalizeSkillName(left);
  const b = normalizeSkillName(right);
  if (!a || !b) return false;
  if (a === b) return true;
  return containsSkillTerm(a, b) || containsSkillTerm(b, a);
}

function containsSkillTerm(container: string, term: string) {
  if (term.length < 2) return false;
  let index = container.indexOf(term);
  while (index >= 0) {
    const before = container[index - 1] || "";
    const after = container[index + term.length] || "";
    if (!/[a-z0-9+#]/i.test(before) && !/[a-z0-9+#]/i.test(after)) return true;
    index = container.indexOf(term, index + 1);
  }
  return false;
}

function normalizeSkillName(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9+#ぁ-んァ-ヶ一-龠]/gu, "");
  const aliases: Record<string, string> = {
    ts: "typescript", js: "javascript", vuejs: "vue",
    nuxtjs: "nuxt", nodejs: "node", reactjs: "react",
  };
  return aliases[normalized] || normalized;
}

function normalizeRate(value: number | null) {
  if (!value) return 0;
  return value >= 10_000 ? value / 10_000 : value;
}

function rateMatches(desiredRate: number | null, rateMin: number, rateMax: number) {
  const desired = normalizeRate(desiredRate);
  if (!desired) return false;
  const maximum = normalizeRate(rateMax);
  const minimum = normalizeRate(rateMin);
  return maximum >= desired * 0.9 && (!minimum || minimum <= desired * 1.5);
}

function remoteMatches(profileRemote: string | null, jobRemote: string) {
  if (!profileRemote) return false;
  if (profileRemote === jobRemote) return true;
  if (profileRemote === "hybrid") return jobRemote === "full_remote";
  if (profileRemote === "onsite") return true;
  return false;
}

function roleMatchesJob(
  roleTitle: string,
  job: Pick<ListedJob, "title" | "summary" | "skills">,
) {
  if (!roleTitle) return false;
  const corpus = [job.title, job.summary || "", ...job.skills.map((item) => item.skill.name)]
    .join(" ")
    .toLowerCase();
  const groups: Array<[RegExp, string[]]> = [
    [/フロント|frontend/i, ["フロントエンド", "frontend", "react", "vue", "next.js", "nuxt"]],
    [/バックエンド|backend/i, ["バックエンド", "backend", "サーバーサイド", "spring boot", "laravel"]],
    [/インフラ|sre|クラウド|devops/i, ["インフラ", "sre", "aws", "gcp", "azure", "terraform", "kubernetes"]],
    [/データ|機械学習|ai/i, ["データ", "機械学習", "ai", "llm", "生成ai"]],
    [/qa|テスト/i, ["qa", "品質保証", "テスト設計"]],
    [/セキュリティ/i, ["セキュリティ", "security"]],
    [/pm|pl|プロジェクト/i, ["pmo", "プロジェクトマネージャ", "プロジェクト管理"]],
  ];
  const keywords = groups.find(([pattern]) => pattern.test(roleTitle))?.[1] || [];
  return keywords.some((keyword) =>
    /^[a-z]{1,2}$/i.test(keyword)
      ? new RegExp(`\\b${keyword}\\b`, "i").test(corpus)
      : corpus.includes(keyword),
  );
}
