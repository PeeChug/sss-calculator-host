#!/usr/bin/env node
/**
 * Hard pre-deploy guard for Cloudflare Pages project `superior-stain-solutions`.
 *
 * Marketing-only uploads (production 69b4c351) wiped /employee-portal/,
 * /_functions (auth), and the CALC_DB binding. Future deploys MUST run this
 * instead of raw `npx wrangler pages deploy`.
 *
 * Commands:
 *   node scripts/guard-pages-deploy.mjs check [directory]
 *   node scripts/guard-pages-deploy.mjs pages deploy <directory> [wrangler flags...]
 *   node scripts/guard-pages-deploy.mjs self-test
 *
 * `pages deploy` runs the check, then execs wrangler only on PASS.
 * Never POST /api/lead from this script.
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PROJECT_NAME = "superior-stain-solutions";
export const CALC_DB_BINDING = "CALC_DB";
export const CALC_DB_NAME = "sss-employee-calc-draft";
export const CALC_DB_ID = "5f7d1d6d-b9a9-44f5-ad7f-ef4dc232d05b";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const FIXTURES = path.join(REPO_ROOT, "test", "pages-deploy-guard", "fixtures");

const REQUIRED_API_FILES = [
  ["lead.ts", "functions/api/lead.ts"],
  ["google-rating.ts", "functions/api/google-rating.ts"],
  ["lead-photo/[key].ts", path.join("functions", "api", "lead-photo", "[key].ts")],
];

const FORBIDDEN_CATCH_ALL = [
  path.join("functions", "api", "[[path]].ts"),
  path.join("functions", "api", "[[path]].js"),
];

function usage(exitCode = 2) {
  const msg = `Usage:
  node scripts/guard-pages-deploy.mjs check [directory]
  node scripts/guard-pages-deploy.mjs pages deploy <directory> [--project-name=superior-stain-solutions ...]
  node scripts/guard-pages-deploy.mjs self-test

Do not run raw \`npx wrangler pages deploy\` for ${PROJECT_NAME}.
`;
  if (exitCode) {
    process.stderr.write(msg);
    process.exit(exitCode);
  }
  process.stdout.write(msg);
}

function parseArgs(argv) {
  const args = {
    mode: null,
    directory: null,
    cwd: process.cwd(),
    projectName: null,
    offline: false,
    wranglerArgs: null,
    rest: [],
  };

  if (argv[0] === "self-test") {
    args.mode = "self-test";
    return args;
  }
  if (argv[0] === "check") {
    args.mode = "check";
    argv = argv.slice(1);
  } else if (argv[0] === "pages" && argv[1] === "deploy") {
    args.mode = "deploy";
    args.wranglerArgs = argv.slice();
    argv = argv.slice(2);
  } else if (argv[0] === "deploy") {
    args.mode = "deploy";
    args.wranglerArgs = ["pages", "deploy", ...argv.slice(1)];
    argv = argv.slice(1);
  } else if (argv.length === 0) {
    args.mode = "check";
  } else {
    usage(2);
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--offline" || a === "--skip-remote") {
      args.offline = true;
      continue;
    }
    if (a === "--cwd") {
      args.cwd = path.resolve(argv[++i] || "");
      continue;
    }
    if (a.startsWith("--cwd=")) {
      args.cwd = path.resolve(a.slice(6));
      continue;
    }
    if (a === "--project-name") {
      args.projectName = argv[++i] || "";
      continue;
    }
    if (a.startsWith("--project-name=")) {
      args.projectName = a.slice("--project-name=".length);
      continue;
    }
    if (a === "--help" || a === "-h") {
      usage(0);
      process.exit(0);
    }
    if (a.startsWith("-")) {
      args.rest.push(a);
      continue;
    }
    if (!args.directory) {
      args.directory = a;
      continue;
    }
    args.rest.push(a);
  }
  return args;
}

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function stripJsonc(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function findConfigFile(projectRoot, staticDir) {
  const names = ["wrangler.toml", "wrangler.jsonc", "wrangler.json"];
  const dirs = [projectRoot, staticDir, path.dirname(staticDir)];
  for (const dir of dirs) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

function parseD1FromToml(text) {
  const blocks = [];
  const re = /\[\[(?:env\.[^\].]+\.)?d1_databases\]\]\s*([^[\]]*)/g;
  let m;
  while ((m = re.exec(text))) {
    const body = m[1];
    const binding = (body.match(/binding\s*=\s*"([^"]+)"/) || [])[1];
    const database_id = (body.match(/database_id\s*=\s*"([^"]+)"/) || [])[1];
    const database_name = (body.match(/database_name\s*=\s*"([^"]+)"/) || [])[1];
    if (binding) blocks.push({ binding, database_id, database_name });
  }
  const name = (text.match(/^\s*name\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const pagesDir =
    (text.match(/pages_build_output_dir\s*=\s*"([^"]+)"/) || [])[1] || null;
  return { name, pagesDir, d1: blocks };
}

function collectJsonD1(obj, acc = []) {
  if (!obj || typeof obj !== "object") return acc;
  if (Array.isArray(obj.d1_databases)) {
    for (const row of obj.d1_databases) {
      if (row && row.binding) acc.push(row);
    }
  }
  if (obj.env && typeof obj.env === "object") {
    for (const env of Object.values(obj.env)) collectJsonD1(env, acc);
  }
  return acc;
}

function parseConfig(configPath) {
  const text = readFileSync(configPath, "utf8");
  const base = path.basename(configPath);
  if (base.endsWith(".toml")) return parseD1FromToml(text);
  const json = JSON.parse(stripJsonc(text));
  return {
    name: json.name || null,
    pagesDir: json.pages_build_output_dir || null,
    d1: collectJsonD1(json),
  };
}

function listFilesRecursive(dir, acc = []) {
  if (!isDir(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (isDir(p)) listFilesRecursive(p, acc);
    else acc.push(p);
  }
  return acc;
}

function findPagesJs(staticDir) {
  const preferred = [
    path.join(staticDir, "js", "sss-calculator-pages.js"),
    path.join(staticDir, "sss-calculator-pages.js"),
  ];
  for (const p of preferred) {
    if (isFile(p)) return p;
  }
  for (const p of listFilesRecursive(staticDir)) {
    if (path.basename(p) === "sss-calculator-pages.js") return p;
  }
  return null;
}

function functionsRouteFiles(functionsDir, relDir) {
  const abs = path.join(functionsDir, relDir);
  if (!isDir(abs)) return [];
  return listFilesRecursive(abs).filter((p) => /\.(ts|js)$/.test(p));
}

async function fetchLiveCalcDb(projectName) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    return { skipped: true, reason: "CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID missing" };
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) {
    return {
      skipped: false,
      error: `Pages project API ${res.status}`,
    };
  }
  const prod =
    body.result?.deployment_configs?.production?.d1_databases || {};
  const calc = prod[CALC_DB_BINDING] || null;
  return {
    skipped: false,
    present: Boolean(calc),
    id: calc?.id || null,
  };
}

export async function runGuard({
  directory,
  cwd = process.cwd(),
  projectName = null,
  offline = false,
}) {
  const errors = [];
  const notes = [];
  const projectRoot = path.resolve(cwd);
  const staticDir = path.resolve(projectRoot, directory || "dist");

  if (!isDir(staticDir)) {
    errors.push(`static directory not found: ${staticDir}`);
    return { ok: false, errors, notes, staticDir, projectRoot };
  }

  const configPath = findConfigFile(projectRoot, staticDir);
  let config = null;
  if (configPath) {
    try {
      config = parseConfig(configPath);
      notes.push(`config ${path.relative(projectRoot, configPath) || path.basename(configPath)}`);
    } catch (err) {
      errors.push(`could not parse ${configPath}: ${err.message}`);
    }
  } else {
    errors.push(
      "no wrangler.toml / wrangler.jsonc in the deploy tree; refusing so a silent config cannot drop CALC_DB"
    );
  }

  const inferredName = projectName || config?.name || PROJECT_NAME;
  if (inferredName !== PROJECT_NAME) {
    errors.push(
      `refusing project "${inferredName}" (this guard is only for ${PROJECT_NAME})`
    );
  }

  const portal = path.join(staticDir, "employee-portal", "index.html");
  if (!isFile(portal)) {
    errors.push("missing /employee-portal/ (expected dist/employee-portal/index.html)");
  } else {
    const html = readFileSync(portal, "utf8");
    if (!/sss-calculator-pages\.js|sss-calculator/.test(html)) {
      errors.push(
        "/employee-portal/ index.html does not reference sss-calculator-pages.js or <sss-calculator>"
      );
    }
  }

  const pagesJs = findPagesJs(staticDir);
  if (!pagesJs) {
    errors.push("missing sss-calculator-pages.js in the static upload");
  } else if (statSync(pagesJs).size < 20) {
    errors.push("sss-calculator-pages.js is empty");
  }

  const functionsDir = path.join(projectRoot, "functions");
  const nestedFunctions = path.join(staticDir, "functions");
  if (!isDir(functionsDir)) {
    if (isDir(nestedFunctions) && path.resolve(staticDir) !== projectRoot) {
      errors.push(
        "functions/ is inside the static directory; wrangler pages deploy reads functions/ next to dist/, not inside it"
      );
    } else {
      errors.push("missing functions/ next to the static directory (wrangler will upload HTML only)");
    }
  }

  const fnRoot = isDir(functionsDir) ? functionsDir : null;
  if (fnRoot) {
    const authFiles = functionsRouteFiles(fnRoot, "_functions");
    if (authFiles.length === 0) {
      errors.push(
        "missing functions/_functions/* routes for /_functions (auth); expected functions/_functions/[name].ts"
      );
    } else {
      const names = authFiles.map((p) => path.relative(fnRoot, p));
      if (
        !names.some(
          (n) =>
            n === path.join("_functions", "[name].ts") ||
            n === path.join("_functions", "[name].js") ||
            /_functions[/\\]/.test(n)
        )
      ) {
        errors.push("functions/_functions exists but has no .ts/.js route files");
      }
    }

    for (const [, rel] of REQUIRED_API_FILES) {
      const abs = path.join(projectRoot, rel);
      if (!isFile(abs)) errors.push(`missing ${rel}`);
      else if (statSync(abs).size < 10) errors.push(`${rel} is empty`);
    }

    for (const rel of FORBIDDEN_CATCH_ALL) {
      if (isFile(path.join(projectRoot, rel))) {
        errors.push(
          `forbidden ${rel} (Jobber proxy catch-all; live must keep Chalk lead.ts instead)`
        );
      }
    }
  }

  if (config) {
    const calc = (config.d1 || []).find((row) => row.binding === CALC_DB_BINDING);
    if (!calc) {
      errors.push(
        `wrangler config is missing [[d1_databases]] binding ${CALC_DB_BINDING} (deploying this would drop it)`
      );
    } else if (calc.database_id && calc.database_id !== CALC_DB_ID) {
      errors.push(
        `${CALC_DB_BINDING} database_id is ${calc.database_id}, expected production ${CALC_DB_ID} (${CALC_DB_NAME})`
      );
    } else {
      notes.push(`${CALC_DB_BINDING} ${CALC_DB_ID}`);
    }
  }

  if (!offline) {
    try {
      const live = await fetchLiveCalcDb(inferredName);
      if (live.skipped) {
        notes.push(`live CALC_DB check skipped (${live.reason})`);
      } else if (live.error) {
        errors.push(`could not confirm live CALC_DB: ${live.error}`);
      } else if (!live.present) {
        if (!config?.d1?.some((row) => row.binding === CALC_DB_BINDING && row.database_id === CALC_DB_ID)) {
          errors.push("live Pages project is missing CALC_DB and this upload would not restore it");
        } else {
          notes.push("live CALC_DB is missing; this upload declares it and will restore");
        }
      } else if (live.id && live.id !== CALC_DB_ID) {
        errors.push(`live CALC_DB id ${live.id} does not match ${CALC_DB_ID}`);
      } else {
        notes.push("live Pages project still has CALC_DB");
        if (config && !config.d1?.some((row) => row.binding === CALC_DB_BINDING)) {
          errors.push("live has CALC_DB but this wrangler config omits it; aborting so deploy cannot drop it");
        }
      }
    } catch (err) {
      errors.push(`live CALC_DB check failed: ${err.message}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    notes,
    staticDir,
    projectRoot,
    projectName: inferredName,
    configPath,
  };
}

function printResult(result, { abortWrangler = false } = {}) {
  if (result.ok) {
    process.stdout.write("SSS Pages deploy guard: PASS\n");
    for (const n of result.notes) process.stdout.write(`  ${n}\n`);
    process.stdout.write(
      "  static: /employee-portal/ + sss-calculator-pages.js\n" +
        "  functions: /_functions/* + api/lead.ts + google-rating.ts + lead-photo/[key].ts\n" +
        "  no functions/api/[[path]].ts\n" +
        `  ${CALC_DB_BINDING} kept\n`
    );
    return;
  }
  process.stderr.write("SSS Pages deploy guard: FAILED\n");
  for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
  if (abortWrangler) {
    process.stderr.write("Aborted wrangler pages deploy.\n");
  }
}

function stripGuardFlags(wranglerArgs) {
  const out = [];
  for (let i = 0; i < wranglerArgs.length; i++) {
    const a = wranglerArgs[i];
    if (a === "--offline" || a === "--skip-remote") continue;
    out.push(a);
  }
  return out;
}

function runWrangler(wranglerArgs, cwd) {
  const result = spawnSync("npx", ["--yes", "wrangler", ...stripGuardFlags(wranglerArgs)], {
    cwd,
    stdio: "inherit",
  });
  if (result.error) {
    process.stderr.write(`wrangler spawn failed: ${result.error.message}\n`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

export async function runSelfTest() {
  const missing = path.join(FIXTURES, "missing-functions");
  const live = path.join(FIXTURES, "live-set");
  assert(isDir(missing), `fixture missing: ${missing}`);
  assert(isDir(live), `fixture missing: ${live}`);

  const fail = await runGuard({
    directory: "dist",
    cwd: missing,
    offline: true,
    projectName: PROJECT_NAME,
  });
  assert(!fail.ok, "missing-functions fixture unexpectedly passed");
  assert(
    fail.errors.some((e) => /_functions/.test(e)),
    `missing-functions did not mention /_functions:\n${fail.errors.join("\n")}`
  );

  const failDeploy = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.url),
      "pages",
      "deploy",
      "dist",
      "--project-name",
      PROJECT_NAME,
      "--offline",
    ],
    { cwd: missing, encoding: "utf8" }
  );
  assert(failDeploy.status !== 0, "pages deploy on missing-functions exited 0");
  const failOut = `${failDeploy.stdout || ""}${failDeploy.stderr || ""}`;
  assert(
    /Aborted wrangler pages deploy/.test(failOut),
    `did not abort wrangler:\n${failOut}`
  );
  assert(
    /_functions/.test(failOut),
    `abort output missing /_functions:\n${failOut}`
  );
  assert(
    !/Uploaded|Deployment complete|pages.dev/.test(failOut),
    `wrangler still ran:\n${failOut}`
  );

  const pass = await runGuard({
    directory: "dist",
    cwd: live,
    offline: true,
    projectName: PROJECT_NAME,
  });
  assert(pass.ok, `live-set fixture failed:\n${pass.errors.join("\n")}`);

  const passCheck = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.url),
      "check",
      "dist",
      "--project-name",
      PROJECT_NAME,
      "--offline",
    ],
    { cwd: live, encoding: "utf8" }
  );
  assert(passCheck.status === 0, `live-set check exited ${passCheck.status}\n${passCheck.stderr}`);
  assert(
    /SSS Pages deploy guard: PASS/.test(passCheck.stdout || ""),
    `live-set check output:\n${passCheck.stdout}\n${passCheck.stderr}`
  );

  const scratch = mkdtempSync(path.join(os.tmpdir(), "sss-pages-guard-"));
  try {
    const catchAllDir = path.join(scratch, "catch-all");
    cpSync(live, catchAllDir, { recursive: true });
    writeFileSync(
      path.join(catchAllDir, "functions", "api", "[[path]].ts"),
      "export async function onRequest() { return new Response(\"proxy\"); }\n"
    );
    const catchAll = await runGuard({
      directory: "dist",
      cwd: catchAllDir,
      offline: true,
      projectName: PROJECT_NAME,
    });
    assert(!catchAll.ok, "catch-all [[path]].ts fixture unexpectedly passed");
    assert(
      catchAll.errors.some((e) => /\[\[path\]\]/.test(e)),
      `catch-all did not mention [[path]].ts:\n${catchAll.errors.join("\n")}`
    );

    const noCalcDir = path.join(scratch, "no-calc-db");
    cpSync(live, noCalcDir, { recursive: true });
    writeFileSync(
      path.join(noCalcDir, "wrangler.toml"),
      `name = "${PROJECT_NAME}"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "LEADS_DB"
database_name = "sss-website-leads"
database_id = "6e8da07d-e793-4754-9b44-7c0c78d07322"
`
    );
    const noCalc = await runGuard({
      directory: "dist",
      cwd: noCalcDir,
      offline: true,
      projectName: PROJECT_NAME,
    });
    assert(!noCalc.ok, "config without CALC_DB unexpectedly passed");
    assert(
      noCalc.errors.some((e) => /CALC_DB/.test(e)),
      `no-calc-db did not mention CALC_DB:\n${noCalc.errors.join("\n")}`
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  process.stdout.write(
    [
      "self-test PASS",
      `  FAIL fixture: ${path.relative(REPO_ROOT, missing)} (missing functions/_functions, aborted wrangler)`,
      `  PASS fixture: ${path.relative(REPO_ROOT, live)} (live file set, check only, no deploy)`,
      "  extra FAIL: live-set + functions/api/[[path]].ts",
      "  extra FAIL: wrangler.toml without CALC_DB",
      "",
    ].join("\n")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === "self-test") {
    try {
      await runSelfTest();
    } catch (err) {
      process.stderr.write(`self-test FAIL: ${err.message}\n`);
      process.exit(1);
    }
    return;
  }

  const result = await runGuard({
    directory: args.directory,
    cwd: args.cwd,
    projectName: args.projectName,
    offline: args.offline,
  });

  if (args.mode === "check") {
    printResult(result);
    process.exit(result.ok ? 0 : 1);
  }

  printResult(result, { abortWrangler: true });
  if (!result.ok) process.exit(1);

  const wranglerArgs = args.wranglerArgs || [
    "pages",
    "deploy",
    args.directory || "dist",
    ...args.rest,
  ];
  if (!wranglerArgs.includes("--project-name") && !wranglerArgs.some((a) => a.startsWith("--project-name="))) {
    wranglerArgs.push("--project-name", PROJECT_NAME);
  }
  runWrangler(wranglerArgs, args.cwd);
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
  main().catch((err) => {
    process.stderr.write(`${err.stack || err.message}\n`);
    process.exit(1);
  });
}
