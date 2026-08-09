import { type PrismaClient } from "@prisma/client";
import { AppError } from "../../domain/types.js";
import { config } from "../../infrastructure/config.js";
import { jobInclude, upsertSkills, type JobInput } from "./shared.js";

const EXTERNAL_SOURCE = "simpleprj";
const MAX_TITLE_LENGTH = 255;
const MAX_CLIENT_LENGTH = 255;
const MAX_SKILL_LENGTH = 100;
const SUMMARY_LIMIT = 12000;

const HIDDEN_EXTERNAL_SUMMARY_KEYS = new Set([
  "dedupekey",
  "email",
  "subject",
  "salesrep",
  "createdat",
  "updatedat",
]);
const HIDDEN_EXTERNAL_SUMMARY_BLOCK_KEYS = new Set([
  "sourcebody",
  "rawbody",
  "body",
  "htmlbody",
  "sourcehtml",
]);

const EMAIL_BOILERPLATE_LINE_PATTERNS = [
  /^(?:株式会社tryangle\s*)?(?:御中|ご担当者|担当者|協力会社|各位|関係者|ビジネスパートナー).{0,20}(?:様|各位)?$/iu,
  /^(?:いつも)?(?:大変)?お世話になっております[。.!！\s]*$/u,
  /^(?:いつも)?(?:大変)?お世話になります[。.!！\s]*$/u,
  /^お疲れ様です[。.!！\s]*$/u,
  /^はじめまして[。.!！\s]*$/u,
  /^突然のご連絡.*$/u,
  /^.*お世話になっております[、,].*(?:です|でございます|申します).*$/u,
  /^.*お世話になっております[。．].*(?:です|でございます|申します).*$/u,
  /^平素よりお世話になっております[。.!！\s]*$/u,
  /^(?:現在)?営業中の案件情報をお送りいたします[。.!！\s]*$/u,
  /^案件情報をお送りいたします[。.!！\s]*$/u,
  /^掲題の件、お送りいたします[。.!！\s]*$/u,
  /^弊社注力案件をお送りいたします[。.!！\s]*$/u,
  /^(?:下記|以下|現在|弊社).{0,30}(?:案件|注力案件|募集案件).{0,40}(?:紹介|ご紹介|共有|案内).*$/u,
  /^下記案件.*(?:募集|紹介).*$/u,
  /^掲題の件.*(?:案件のご紹介|ご紹介).*$/u,
  /^(?:見合う|ご対応可能な|ご紹介可能な).{0,30}(?:要員|技術者).{0,40}(?:紹介|提案|連絡).*$/u,
  /^見合う(?:方|人材).{0,40}ご提案.*$/u,
  /^ご紹介可能な(?:方|要員|人材).{0,50}(?:ご提案|紹介).*$/u,
  /^ご提案可能な要員様.*(?:ご紹介|お願い).*$/u,
  /^是非ご提案.*$/u,
  /^【?ご提案時のお願い】?$/u,
  /^☆?技術者様ご紹介時のお願い☆?$/u,
  /^ご提案(?:時|の際|方法|いただく際|お待ち).*$/u,
  /^尚、?ご提案時.*$/u,
  /^※?ご提案時.*$/u,
  /^下記についてご確認いただき、要員様ご紹介時に.*$/u,
  /^下記案件にご対応可能な技術者.*$/u,
  /^尚、下記案件は並行営業.*$/u,
  /^新規案件のご紹介です[。.!！\s]*$/u,
  /^早速ですが下記案件のご紹介.*$/u,
  /^早速ではございますが、案件のご紹介.*$/u,
  /^.*人材をご紹介いただきます際.*$/u,
  /^.*(?:よろしくお願いいたします|何卒よろしく|どうぞよろしく|よろしくお願い申し上げます).*$/u,
  /^.*(?:何卒宜しく|よろしくご検討|ご検討の程よろしく).*$/u,
  /^何卒.*(?:要員様のご提案|宜しく|よろしく|お願い).*$/u,
  /^引き続きよろしくお願い.*$/u,
  /^.*(?:返信がない場合|お見送りと判断|メールアドレスをCC|候補日|並行状況|○|〇|△|×).{0,80}$/u,
  /^※全てのご紹介にご返事.*$/u,
  /^＜?案件担当＞?$/u,
  /^(?:担当|案件担当)[:：].*/u,
  /^購買担当[:：].*/u,
  /^お気軽にお問い合わせください.*$/u,
  /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/u,
  /^(?:tel|電話|携帯|mobile|phone|fax|web|mail|e-mail|email|line|hp|url|住所|メール|個人メール|共通メール|営業共通|共通|関東共通|関西共通|バックオフィス共通|fax番号)[:：]?\s*.*/iu,
  /^https?:\/\/\S+$/iu,
  /^[-=ー━＿_＝]{5,}$/u,
];

const SELF_INTRO_PATTERN =
  /^[^。\n]{1,50}の[一-龠ぁ-んァ-ヶA-Za-z・ー\s]{1,18}(?:です|でございます|と申します)[。.!！\s]*$/u;
const JOB_CONTEXT_PATTERN = /案件|概要|内容|業務|作業|スキル|経験|期間|場所|単価|面談/u;
const CONTACT_VALUE_PATTERN =
  /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:^|[^\d])0\d{1,4}[-ー−\s]?\d{1,4}[-ー−\s]?\d{3,4}(?:[^\d]|$)/iu;
const ADDRESS_VALUE_PATTERN =
  /〒\s*\d{3}[-ー−]?\d{4}|(?:北海道|東京都|京都府|大阪府|.{2,3}県).{0,60}(?:区|市|町|村).{0,60}\d/u;
const COMPANY_NAME_PATTERN =
  /株式会社|有限会社|合同会社|Inc\.?|Co\.?,?\s*Ltd\.?|Corporation|Corp\.?/iu;
const JOB_DETAIL_LABEL_PATTERN =
  /^(?:案件名|概要|案件概要|内容|作業内容|業務内容|場所|勤務地|必須|必須スキル|尚可|尚可スキル|単価|期間|開始|面談|備考|商流|顧客|企業)[:：]/u;

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

export function sanitizeExternalProjectText(value: string) {
  const cleanedLines: string[] = [];
  let skippingHiddenBlock = false;

  for (const line of value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())) {
    const parsedLabel = parseSummaryLabel(line.trim());
    if (parsedLabel && HIDDEN_EXTERNAL_SUMMARY_BLOCK_KEYS.has(parsedLabel.key)) {
      skippingHiddenBlock = true;
      continue;
    }
    if (skippingHiddenBlock) continue;
    if (parsedLabel && HIDDEN_EXTERNAL_SUMMARY_KEYS.has(parsedLabel.key)) continue;
    if (isEmailBoilerplateLine(line)) continue;
    cleanedLines.push(line);
  }

  return cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
    .map(([key, value]) => [key, sanitizeExternalProjectText(asDisplayText(value))] as const)
    .filter(
      ([key, value]) =>
        !knownKeys.has(key) &&
        !isHiddenExternalSummaryKey(key) &&
        value,
    )
    .map(([key, value]) => `${key}: ${value}`);

  const summary = sanitizeExternalProjectText([...lines, ...extras].join("\n"));
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
  const text = sanitizeExternalProjectText(asDisplayText(value));
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

function isEmailBoilerplateLine(line: string) {
  const rawText = line.trim();
  if (CONTACT_VALUE_PATTERN.test(rawText)) return true;
  if (isAddressSignatureLine(line, rawText)) return true;

  const parsedLabel = parseSummaryLabel(rawText);
  if (parsedLabel && HIDDEN_EXTERNAL_SUMMARY_KEYS.has(parsedLabel.key)) return true;

  const text = parsedLabel?.text || rawText;
  if (!text) return false;
  if (CONTACT_VALUE_PATTERN.test(text)) return true;
  if (isAddressSignatureLine(line, text)) return true;
  if (isCompanySignatureLine(line, text)) return true;
  if (EMAIL_BOILERPLATE_LINE_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }
  return (
    ((SELF_INTRO_PATTERN.test(text) || /(?:でございます|と申します)[。.!！\s]*$/u.test(text)) &&
      text.length <= 60) &&
    !JOB_CONTEXT_PATTERN.test(text)
  );
}

function isAddressSignatureLine(line: string, text: string) {
  if (JOB_DETAIL_LABEL_PATTERN.test(line.trim())) return false;
  return ADDRESS_VALUE_PATTERN.test(text);
}

function isCompanySignatureLine(line: string, text: string) {
  if (!COMPANY_NAME_PATTERN.test(text)) return false;
  if (JOB_DETAIL_LABEL_PATTERN.test(line.trim())) return false;
  return text.length <= 90 && !JOB_CONTEXT_PATTERN.test(text);
}

function parseSummaryLabel(line: string) {
  const match = line.match(/^([A-Za-z][\w-]{0,40})[:：]\s*(.*)$/u);
  return match ? { key: normalizeSummaryKey(match[1]), text: match[2].trim() } : null;
}

function isHiddenExternalSummaryKey(key: string) {
  const normalized = normalizeSummaryKey(key);
  return (
    HIDDEN_EXTERNAL_SUMMARY_KEYS.has(normalized) ||
    HIDDEN_EXTERNAL_SUMMARY_BLOCK_KEYS.has(normalized)
  );
}

function normalizeSummaryKey(key: string) {
  return key.replace(/[\s_-]/g, "").toLowerCase();
}
