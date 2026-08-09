import { type PrismaClient } from "@prisma/client";
import { AppError } from "../../domain/types.js";
import { config } from "../../infrastructure/config.js";
import { jobInclude, upsertSkills, type JobInput } from "./shared.js";

const EXTERNAL_SOURCE = "simpleprj";
const MAX_TITLE_LENGTH = 255;
const MAX_CLIENT_LENGTH = 255;
const MAX_SKILL_LENGTH = 100;
const SUMMARY_LIMIT = 12000;

type ExternalProjectValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ExternalProjectValue[]
  | { [key: string]: ExternalProjectValue };

export interface ExternalProject {
  id?: ExternalProjectValue;
  projectName?: ExternalProjectValue;
  requiredSkills?: ExternalProjectValue;
  unitPrice?: ExternalProjectValue;
  location?: ExternalProjectValue;
  startPeriod?: ExternalProjectValue;
  remoteRatio?: ExternalProjectValue;
  receivedAt?: ExternalProjectValue;
  receivedAtMs?: ExternalProjectValue;
  [key: string]: ExternalProjectValue;
}

interface ExternalProjectsResponse {
  count?: number;
  projects?: ExternalProject[];
}

interface MappedExternalProject {
  externalSource: string;
  externalId: string;
  input: JobInput;
}

export interface ExternalProjectImportResult {
  fetched: number;
  imported: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export function mapExternalProjectToJobInput(
  project: ExternalProject,
): MappedExternalProject | null {
  const externalId = asDisplayText(project.id);
  if (!externalId) return null;

  const title =
    truncate(
      firstText(project.projectName, project.title, project.name) ||
        `外部案件 ${externalId}`,
      MAX_TITLE_LENGTH,
    ) || `外部案件 ${externalId}`;
  const unitPrice = normalizeUnitPrice(project.unitPrice);
  const client = truncate(
    firstText(
      project.clientName,
      project.companyName,
      project.company,
      project.client,
    ) || "外部メール案件",
    MAX_CLIENT_LENGTH,
  );

  return {
    externalSource: EXTERNAL_SOURCE,
    externalId,
    input: {
      title,
      client,
      summary: buildSummary(project, externalId),
      required: splitProjectSkills(asDisplayText(project.requiredSkills)),
      nice: [],
      rateMin: unitPrice,
      rateMax: unitPrice,
      marginRate: 0,
      streamType: "other",
      remoteType: resolveRemoteType(asDisplayText(project.remoteRatio)),
      isPinned: false,
    },
  };
}

export function splitProjectSkills(value: string) {
  return [
    ...new Set(
      value
        .replace(/[【】（）()［］\[\]]/g, " ")
        .split(/[,、\n\r;；/／|]+|\s{2,}/)
        .map((skill) =>
          skill
            .replace(/^(必須|尚可|歓迎|スキル|経験)[:：\s]*/u, "")
            .trim(),
        )
        .filter((skill) => skill.length > 0 && skill.length <= MAX_SKILL_LENGTH),
    ),
  ].slice(0, 30);
}

export function resolveRemoteType(remoteRatio: string): JobInput["remoteType"] {
  const value = remoteRatio.trim();
  if (!value) return "onsite";
  if (/フルリモート|完全リモート|フルリモ|リモート\s*100%/iu.test(value)) {
    return "full_remote";
  }
  if (/リモート|在宅|リモ可|週\s*[1-5１-５一二三四五]\s*リモート/iu.test(value)) {
    return "hybrid";
  }
  return "onsite";
}

export class ExternalProjectImportService {
  constructor(private readonly db: PrismaClient) {}

  async importProjects(createdBy?: string | null) {
    const projects = await fetchExternalProjects();
    const result: ExternalProjectImportResult = {
      fetched: projects.length,
      imported: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    for (const project of projects) {
      const mapped = mapExternalProjectToJobInput(project);
      if (!mapped) {
        result.skipped += 1;
        continue;
      }

      try {
        const action = await this.upsertExternalJob(mapped, createdBy || null);
        result.imported += 1;
        result[action] += 1;
      } catch (error) {
        result.failed += 1;
        console.error("external project import failed", {
          externalId: mapped.externalId,
          error,
        });
      }
    }

    return result;
  }

  private async upsertExternalJob(
    mapped: MappedExternalProject,
    createdBy: string | null,
  ) {
    const { input, externalSource, externalId } = mapped;
    const client = await this.db.client.upsert({
      where: { name: input.client || "外部メール案件" },
      update: {},
      create: { name: input.client || "外部メール案件" },
    });
    const required = await upsertSkills(this.db, input.required || [], "other");
    const skillCreates = required.map((skill) => ({
      skillId: skill.id,
      requirementType: "required" as const,
    }));

    const existing = await this.db.job.findFirst({
      where: { externalSource, externalId },
      select: { id: true },
    });

    if (existing) {
      await this.db.$transaction([
        this.db.jobSkill.deleteMany({ where: { jobId: existing.id } }),
        this.db.job.update({
          where: { id: existing.id },
          data: {
            clientId: client.id,
            title: input.title,
            summary: input.summary || "",
            rateMin: input.rateMin,
            rateMax: input.rateMax,
            marginRate: input.marginRate,
            streamType: input.streamType,
            remoteType: input.remoteType,
            isActive: true,
            skills: skillCreates.length ? { create: skillCreates } : undefined,
          },
        }),
      ]);
      return "updated" as const;
    }

    await this.db.job.create({
      data: {
        clientId: client.id,
        title: input.title,
        summary: input.summary || "",
        rateMin: input.rateMin,
        rateMax: input.rateMax,
        marginRate: input.marginRate,
        streamType: input.streamType,
        remoteType: input.remoteType,
        isPinned: false,
        isActive: true,
        externalSource,
        externalId,
        createdBy,
        skills: skillCreates.length ? { create: skillCreates } : undefined,
      },
      include: jobInclude,
    });
    return "created" as const;
  }
}

async function fetchExternalProjects() {
  const apiKey = config.externalProjectsApiKey.trim();
  if (!apiKey) {
    throw new AppError(
      503,
      "外部案件APIキーが設定されていません。",
      "EXTERNAL_PROJECTS_API_KEY_MISSING",
    );
  }

  const response = await fetch(config.externalProjectsApiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new AppError(
      502,
      `外部案件APIの取得に失敗しました。status=${response.status}`,
      response.status === 401
        ? "EXTERNAL_PROJECTS_API_UNAUTHORIZED"
        : "EXTERNAL_PROJECTS_API_FAILED",
    );
  }

  const payload = (await response.json()) as ExternalProjectsResponse;
  if (!payload || !Array.isArray(payload.projects)) {
    throw new AppError(
      502,
      "外部案件APIのレスポンス形式が不正です。",
      "EXTERNAL_PROJECTS_API_INVALID_RESPONSE",
    );
  }

  return payload.projects;
}

function buildSummary(project: ExternalProject, externalId: string) {
  const lines = [
    `外部案件ID: ${externalId}`,
    textLine("案件名", project.projectName),
    textLine("必須スキル", project.requiredSkills),
    textLine("単価", project.unitPrice),
    textLine("勤務地", project.location),
    textLine("開始時期", project.startPeriod),
    textLine("リモート", project.remoteRatio),
    textLine("受信日時", project.receivedAt),
  ].filter(Boolean);

  const knownKeys = new Set([
    "id",
    "projectName",
    "requiredSkills",
    "unitPrice",
    "location",
    "startPeriod",
    "remoteRatio",
    "receivedAt",
    "receivedAtMs",
  ]);
  const extras = Object.entries(project)
    .filter(([key, value]) => !knownKeys.has(key) && asDisplayText(value))
    .map(([key, value]) => `${key}: ${asDisplayText(value)}`);

  const summary = [...lines, ...extras].join("\n");
  return summary.length > SUMMARY_LIMIT
    ? `${summary.slice(0, SUMMARY_LIMIT)}\n...`
    : summary;
}

function normalizeUnitPrice(value: ExternalProjectValue) {
  const raw = asDisplayText(value).replace(/[^\d.]/g, "");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

function textLine(label: string, value: ExternalProjectValue) {
  const text = asDisplayText(value);
  return text ? `${label}: ${text}` : "";
}

function firstText(...values: ExternalProjectValue[]) {
  return values.map(asDisplayText).find(Boolean) || "";
}

function asDisplayText(value: ExternalProjectValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(asDisplayText).filter(Boolean).join(", ");
  return JSON.stringify(value);
}

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}
