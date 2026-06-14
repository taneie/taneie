#!/usr/bin/env node
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_CONFIG_PATH = "config/sales-users.config.json";
const LOCAL_DATABASE_URL =
  "postgresql://tryangle:tryangle@localhost:5432/tryangle_freelance?schema=public";
const ENCRYPTION_PREFIX = "enc:v1:";

const parsed = parseArgs({
  allowPositionals: false,
  options: {
    config: { type: "string", short: "c" },
    target: { type: "string", short: "t" },
    dryRun: { type: "boolean", default: false },
    yes: { type: "boolean", short: "y", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (parsed.values.help) {
  printUsage();
  process.exit(0);
}

function printUsage() {
  console.log(`
営業ユーザーを設定ファイルからDBへ追加するスクリプトです。

使い方:
  node scripts/create-sales-users-from-config.mjs
  node scripts/create-sales-users-from-config.mjs --target staging
  node scripts/create-sales-users-from-config.mjs --config config/sales-users.config.json --dryRun

オプション:
  -c, --config <path>  設定ファイルパス。未指定時: ${DEFAULT_CONFIG_PATH}
  -t, --target <env>   挿入先環境。設定ファイルの target より優先
      --dryRun         DBへ書き込まず、接続先と投入予定だけ確認
  -y, --yes            staging / production 実行時の確認を省略
  -h, --help           ヘルプ表示
`);
}

function loadConfig(configPath) {
  const absolutePath = resolve(process.cwd(), configPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`設定ファイルが見つかりません: ${absolutePath}`);
  }

  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(
      `設定ファイルの読み込みに失敗しました: ${absolutePath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} を設定してください。`);
  }
  return value.trim();
}

function optionalString(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeEmail(email) {
  const normalized = requireNonEmptyString(email, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error(`メールアドレスの形式が不正です: ${email}`);
  }
  return normalized;
}

function assertPassword(password, label) {
  const raw = requireNonEmptyString(password, label);
  if (raw.length < 12) {
    throw new Error(`${label} は12文字以上にしてください。`);
  }
  return raw;
}

function resolveTargetEnvironment(config, cliTarget) {
  const targetName = cliTarget || config.target;
  const target = requireNonEmptyString(targetName, "target");
  const environments = config.environments;
  if (!environments || typeof environments !== "object") {
    throw new Error("environments を設定してください。");
  }

  const environment = environments[target];
  if (!environment || typeof environment !== "object") {
    const available = Object.keys(environments).join(", ") || "なし";
    throw new Error(`target '${target}' が environments に存在しません。利用可能: ${available}`);
  }

  if (environment.enabled === false) {
    throw new Error(`target '${target}' は enabled=false です。実行する場合は設定ファイルで有効化してください。`);
  }

  const databaseUrl = optionalString(environment.databaseUrl) ||
    (target === "local" ? LOCAL_DATABASE_URL : undefined);
  if (!databaseUrl) {
    throw new Error(`environments.${target}.databaseUrl を設定してください。`);
  }

  const dataEncryptionKey = optionalString(environment.dataEncryptionKey) || "";
  const policyVersion =
    optionalString(environment.privacyPolicyVersion) ||
    optionalString(config.defaults?.privacyPolicyVersion) ||
    "2026-06-10";

  return {
    name: target,
    databaseUrl,
    dataEncryptionKey,
    policyVersion,
    allowProductionInsert: environment.allowProductionInsert === true,
  };
}

function encryptionKey(dataEncryptionKey) {
  if (dataEncryptionKey) {
    const decoded = Buffer.from(dataEncryptionKey, "base64");
    if (decoded.length === 32) return decoded;
    return createHash("sha256").update(dataEncryptionKey).digest();
  }

  return createHash("sha256")
    .update("tryangle-local-development-encryption-key")
    .digest();
}

function createCryptoHelpers(dataEncryptionKey) {
  const key = encryptionKey(dataEncryptionKey);

  function encryptText(value) {
    if (!value) return value || "";
    if (value.startsWith(ENCRYPTION_PREFIX)) return value;
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${ENCRYPTION_PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
  }

  function decryptText(value) {
    if (!value) return value || "";
    if (!value.startsWith(ENCRYPTION_PREFIX)) return value;
    const payload = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), "base64");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }

  function piiHash(value) {
    return createHmac("sha256", key)
      .update(value.trim().toLowerCase())
      .digest("hex");
  }

  return { encryptText, decryptText, piiHash };
}

function validateConfig(config) {
  if (!Array.isArray(config.users) || config.users.length === 0) {
    throw new Error("users を1件以上設定してください。");
  }

  const seen = new Set();
  return config.users.map((user, index) => {
    const base = `users[${index}]`;
    if (!user || typeof user !== "object") {
      throw new Error(`${base} はオブジェクトで設定してください。`);
    }

    const email = normalizeEmail(user.email);
    if (seen.has(email)) {
      throw new Error(`設定ファイル内でメールアドレスが重複しています: ${email}`);
    }
    seen.add(email);

    return {
      email,
      name: requireNonEmptyString(user.name, `${base}.name`),
      password: assertPassword(user.password, `${base}.password`),
      nameKana: optionalString(user.nameKana),
      phone: optionalString(user.phone),
      isActive: user.isActive !== false,
      skipPolicyConsent: user.skipPolicyConsent === true,
      policyVersion: optionalString(user.policyVersion),
      onExisting: optionalString(user.onExisting) || optionalString(config.defaults?.onExisting) || "fail",
    };
  });
}

function assertOnExisting(value, email) {
  const allowed = ["fail", "update", "skip"];
  if (!allowed.includes(value)) {
    throw new Error(`onExisting は ${allowed.join(" / ")} のいずれかにしてください: ${email}`);
  }
}

async function findLegacyUserByEmail(prisma, decryptText, normalizedEmail) {
  const legacyUsers = await prisma.user.findMany({ where: { emailHash: null } });
  return legacyUsers.find((candidate) => {
    try {
      return decryptText(candidate.email).trim().toLowerCase() === normalizedEmail;
    } catch {
      return false;
    }
  });
}

async function upsertSalesUser({ prisma, helpers, input, policyVersion, dryRun }) {
  assertOnExisting(input.onExisting, input.email);

  const emailHash = helpers.piiHash(input.email);
  const existingByHash = await prisma.user.findUnique({ where: { emailHash } });
  const existingLegacy = existingByHash
    ? null
    : await findLegacyUserByEmail(prisma, helpers.decryptText, input.email);
  const existingUser = existingByHash || existingLegacy;

  if (existingUser && input.onExisting === "fail") {
    throw new Error(
      `同じメールアドレスのユーザーが既に存在します: ${input.email}。更新またはスキップする場合は onExisting を update / skip にしてください。`,
    );
  }

  if (existingUser && input.onExisting === "skip") {
    return {
      action: "skipped",
      email: input.email,
      name: input.name,
      existingUserId: existingUser.id,
    };
  }

  if (dryRun) {
    return {
      action: existingUser ? "would_update" : "would_create",
      email: input.email,
      name: input.name,
      isActive: input.isActive,
      policyConsent: input.skipPolicyConsent ? "skipped" : input.policyVersion || policyVersion,
    };
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const userData = {
    role: "sales",
    name: helpers.encryptText(input.name),
    nameKana: input.nameKana ? helpers.encryptText(input.nameKana) : null,
    email: helpers.encryptText(input.email),
    emailHash,
    passwordHash,
    phone: input.phone ? helpers.encryptText(input.phone) : null,
    isActive: input.isActive,
    updatedAt: now,
  };

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: userData,
      })
    : await prisma.user.create({
        data: {
          ...userData,
          createdAt: now,
        },
      });

  if (!input.skipPolicyConsent) {
    await prisma.privacyPolicyConsent.createMany({
      data: [
        {
          userId: user.id,
          policyVersion: input.policyVersion || policyVersion,
        },
      ],
      skipDuplicates: true,
    });
  }

  return {
    action: existingUser ? "updated" : "created",
    user: {
      id: user.id,
      role: user.role,
      email: input.email,
      name: input.name,
      isActive: user.isActive,
    },
    policyConsent: input.skipPolicyConsent ? "skipped" : input.policyVersion || policyVersion,
  };
}

function printTargetWarning(target, environment, dryRun, yes) {
  console.log(`target: ${target}`);
  console.log(`databaseUrl: ${maskDatabaseUrl(environment.databaseUrl)}`);
  console.log(`mode: ${dryRun ? "dryRun" : "insert"}`);

  if (dryRun || target === "local") return;

  if (target === "production" && !environment.allowProductionInsert) {
    throw new Error(
      "production への投入は allowProductionInsert=true が必要です。誤投入防止のため、設定ファイルで明示してください。",
    );
  }

  if (!yes) {
    throw new Error(
      `${target} へ書き込む場合は、確認のため --yes を付けて再実行してください。まず --dryRun で確認することを推奨します。`,
    );
  }
}

function maskDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    if (url.password) url.password = "****";
    if (url.username) url.username = "****";
    return url.toString();
  } catch {
    return databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://****:****@");
  }
}

async function main() {
  const configPath = parsed.values.config || DEFAULT_CONFIG_PATH;
  const config = loadConfig(configPath);
  const users = validateConfig(config);
  const environment = resolveTargetEnvironment(config, parsed.values.target);
  const dryRun = parsed.values.dryRun === true || config.dryRun === true;

  printTargetWarning(environment.name, environment, dryRun, parsed.values.yes === true);

  const helpers = createCryptoHelpers(environment.dataEncryptionKey);
  const prisma = new PrismaClient({
    adapter: new PrismaPg(environment.databaseUrl),
    log: ["error", "warn"],
  });

  try {
    const results = [];

    if (dryRun) {
      await prisma.$connect();
      for (const input of users) {
        results.push(
          await upsertSalesUser({
            prisma,
            helpers,
            input,
            policyVersion: environment.policyVersion,
            dryRun: true,
          }),
        );
      }
    } else {
      await prisma.$transaction(async (tx) => {
        for (const input of users) {
          results.push(
            await upsertSalesUser({
              prisma: tx,
              helpers,
              input,
              policyVersion: environment.policyVersion,
              dryRun: false,
            }),
          );
        }
      });
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          target: environment.name,
          dryRun,
          count: results.length,
          results,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("営業ユーザーの追加に失敗しました:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
