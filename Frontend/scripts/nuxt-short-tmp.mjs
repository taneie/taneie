#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "Usage: node ./Frontend/scripts/nuxt-short-tmp.mjs <nuxt-command> [...args]",
  );
  process.exit(1);
}

const env = { ...process.env };
const [nuxtCommand] = args;

if (nuxtCommand !== "dev") {
  env.NUXT_IGNORE_LOCK = env.NUXT_IGNORE_LOCK || "1";
}

// macOS can fail with `connect EINVAL ... nuxt-vite-node-*.sock` when the
// default TMPDIR path under /var/folders is too long for a Unix domain socket.
// Force Nuxt/Vite temporary socket files into /tmp, which has a short path.
if (process.platform !== "win32") {
  const shortTmpDir = "/tmp";
  mkdirSync(shortTmpDir, { recursive: true });
  env.TMPDIR = shortTmpDir;
  env.TMP = shortTmpDir;
  env.TEMP = shortTmpDir;
}

const nuxtBin =
  process.platform === "win32"
    ? resolve("node_modules/.bin/nuxt.cmd")
    : resolve("node_modules/.bin/nuxt");

const child = spawn(nuxtBin, args, {
  stdio: "inherit",
  env,
  shell: false,
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
