import { type PrismaClient } from "@prisma/client";
import { AppError } from "../../domain/types.js";
import { config } from "../../infrastructure/config.js";
import { jobInclude, upsertSkills, type JobInput } from "./shared.js";

const EXTERNAL_SOURCE = "simpleprj";
const MAX_TITLE_LENGTH = 255;
const MAX_SKILL_LENGTH = 100;

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
  dedupeKey?: ExternalProjectValue;
  receivedAt?: ExternalProjectValue;
  receivedAtMs?: ExternalProjectValue;
  projectName?: ExternalProjectValue;
  requiredSkills?: ExternalProjectValue;
  preferredSkills?: ExternalProjectValue;
  unitPrice?: ExternalProjectValue;
  settlementUpper?: ExternalProjectValue;
  settlementLower?: ExternalProjectValue;
  location?: ExternalProjectValue;
  startPeriod?: ExternalProjectValue;
  remoteRatio?: ExternalProjectValue;
  foreignerAvailability?: ExternalProjectValue;
  ageLimit?: ExternalProjectValue;
  createdAt?: ExternalProjectValue;
  updatedAt?: ExternalProjectValue;
}

interface ExternalProjectsResponse {
  count?: number;
  projects?: ExternalProject[];
}

interface MappedExternalProject {
  externalSource: string;
  externalId: string;
  input: JobInput;
  externalFields: {
    externalDedupeKey: string | null;
    externalReceivedAt: Date | null;
    externalReceivedAtMs: bigint | null;
    unitPrice: string | null;
    settlementLower: string | null;
    settlementUpper: string | null;
    location: string | null;
    startPeriod: string | null;
    remoteRatio: string | null;
    foreignerAvailability: string | null;
    ageLimit: string | null;
    externalCreatedAt: Date | null;
    externalUpdatedAt: Date | null;
  };
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

  const title = truncate(
    asDisplayText(project.projectName) || `外部案件 ${externalId}`,
    MAX_TITLE_LENGTH,
  );
  const unitPriceText = asDisplayText(project.unitPrice);
  const [rateMin, rateMax] = normalizeUnitPriceRange(project.unitPrice);
  const receivedAtMs = normalizeInteger(project.receivedAtMs);

  return {
    externalSource: EXTERNAL_SOURCE,
    externalId,
    input: {
      title,
      client: "外部メール案件",
      summary: "",
      required: splitProjectSkills(asDisplayText(project.requiredSkills)),
      nice: splitProjectSkills(asDisplayText(project.preferredSkills)),
      rateMin,
      rateMax,
      streamType: "other",
      remoteType: resolveRemoteType(asDisplayText(project.remoteRatio)),
      isPinned: false,
    },
    externalFields: {
      externalDedupeKey: nullableText(project.dedupeKey),
      externalReceivedAt:
        parseExternalDate(project.receivedAt) || dateFromEpochMs(receivedAtMs),
      externalReceivedAtMs:
        receivedAtMs === null ? null : BigInt(receivedAtMs),
      unitPrice: unitPriceText || null,
      settlementLower: nullableText(project.settlementLower),
      settlementUpper: nullableText(project.settlementUpper),
      location: nullableText(project.location),
      startPeriod: nullableText(project.startPeriod),
      remoteRatio: nullableText(project.remoteRatio),
      foreignerAvailability: nullableText(project.foreignerAvailability),
      ageLimit: nullableText(project.ageLimit),
      externalCreatedAt: parseExternalDate(project.createdAt),
      externalUpdatedAt: parseExternalDate(project.updatedAt),
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

  async importProjects(createdBy?: string | null, limit?: number) {
    const fetchedProjects = await fetchExternalProjects();
    const projects = limit ? fetchedProjects.slice(0, limit) : fetchedProjects;
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
    const { input, externalSource, externalId, externalFields } = mapped;
    const client = await this.db.client.upsert({
      where: { name: input.client || "外部メール案件" },
      update: {},
      create: { name: input.client || "外部メール案件" },
    });
    const [required, nice] = await Promise.all([
      upsertSkills(this.db, input.required || [], "other"),
      upsertSkills(this.db, input.nice || [], "other"),
    ]);
    const skillCreates = [
      ...required.map((skill) => ({
        skillId: skill.id,
        requirementType: "required" as const,
      })),
      ...nice.map((skill) => ({
        skillId: skill.id,
        requirementType: "nice" as const,
      })),
    ];

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
            marginRate: 0,
            streamType: input.streamType,
            remoteType: input.remoteType,
            ...externalFields,
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
        marginRate: 0,
        streamType: input.streamType,
        remoteType: input.remoteType,
        isPinned: false,
        isActive: true,
        externalSource,
        externalId,
        ...externalFields,
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

function normalizeUnitPriceRange(value: ExternalProjectValue) {
  const values = asDisplayText(value)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((item) => Number.isFinite(item) && item >= 0) || [0];
  const normalized = values.map((item) => Math.round(item));
  return [Math.min(...normalized), Math.max(...normalized)] as const;
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

function nullableText(value: ExternalProjectValue) {
  return asDisplayText(value) || null;
}

function normalizeInteger(value: ExternalProjectValue) {
  const parsed = Number(asDisplayText(value));
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function dateFromEpochMs(value: number | null) {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseExternalDate(value: ExternalProjectValue) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const seconds = Number(value._seconds);
    const nanoseconds = Number(value._nanoseconds || 0);
    if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) {
      const date = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const text = asDisplayText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}
