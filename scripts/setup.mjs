#!/usr/bin/env node
// اجرا: node scripts/setup.mjs
//
// این اسکریپت کل مراحل راه‌اندازی رو خودکار انجام می‌ده — فقط باید از قبل
// CLOUDFLARE_API_TOKEN رو export کرده باشی. اگه هر مرحله fail بشه (مثلاً
// توکن اشتباه بود)، فقط توکن رو درست کن و دوباره همین اسکریپت رو اجرا کن —
// مراحلی که قبلاً موفق بودن (D1، KV، دیپلوی، رمز امنیتی) دوباره تکرار
// نمی‌شن، فقط از همون‌جا ادامه می‌ده.

import { execSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes, webcrypto } from "node:crypto";
import readline from "node:readline";
import { stdin, stdout } from "node:process";

const crypto = webcrypto;
const STATE_FILE = ".setup-state.json";
const WRANGLER_CONFIG = "wrangler.jsonc";
const RESET = "\x1b[0m", BOLD = "\x1b[1m", CYAN = "\x1b[36m", GREEN = "\x1b[32m", RED = "\x1b[31m";

function step(title) {
  console.log(`\n${CYAN}▶ ${title}${RESET}`);
}
function ok(msg) {
  console.log(`${GREEN}✅ ${msg}${RESET}`);
}
function fail(msg) {
  console.error(`\n${RED}❌ ${msg}${RESET}\n`);
  process.exit(1);
}
function loadState() {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}
function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}
function run(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}
function stripJsonComments(text) {
  // wrangler.jsonc ships with explanatory // comments. None of our string
  // values contain "//", so a line-based strip is safe here.
  return text.replace(/^(.*?)\/\/.*$/gm, "$1");
}
function readConfig() {
  return JSON.parse(stripJsonComments(readFileSync(WRANGLER_CONFIG, "utf8")));
}
function writeConfig(cfg) {
  writeFileSync(WRANGLER_CONFIG, JSON.stringify(cfg, null, 2) + "\n");
}

console.log(`${BOLD}🚀 راه‌اندازی خودکار Mini-CMS روی Cloudflare Workers${RESET}`);

// ---- 0. Token check (fail fast, before touching npm) ----
if (!process.env.CLOUDFLARE_API_TOKEN) {
  fail(
    "متغیر CLOUDFLARE_API_TOKEN تنظیم نشده.\n" +
      "   این دستور رو بزن و دوباره اسکریپت رو اجرا کن:\n\n" +
      '   export CLOUDFLARE_API_TOKEN="توکن_خودت"\n' +
      "   node scripts/setup.mjs"
  );
}

// وقتی wrangler.jsonc رو می‌خونیم، اسم دیتابیس/KV رو از همین‌جا می‌گیریم —
// جایی توی این اسکریپت این اسم‌ها hardcode نشدن، تک‌منبع واقعیت خود فایل کانفیگه.
let config = readConfig();
const d1Name = config.d1_databases[0].database_name;
const kvBindingName = config.kv_namespaces[0].binding;

// ---- 1. npm install ----
step("نصب پکیج‌های پروژه...");
try {
  execSync("npm install", { stdio: "inherit" });
} catch {
  fail("نصب پکیج‌ها (npm install) ناموفق بود — پیام بالا رو برام بفرست.");
}
ok("پکیج‌ها نصب شدن");

// ---- 2. verify Cloudflare token ----
step("بررسی توکن Cloudflare...");
try {
  console.log(run("npx wrangler whoami").trim());
} catch (e) {
  fail(
    "توکن اشتباهه یا مشکل شبکه‌ست. توکن درست رو export کن و دوباره اجرا کن:\n\n" +
      '   export CLOUDFLARE_API_TOKEN="توکن_درست"\n' +
      "   node scripts/setup.mjs\n\n" +
      "خطای کامل:\n" +
      (e.stdout || e.stderr || e.message)
  );
}
ok("توکن معتبره");

const state = loadState();

// ---- 3. D1 database ----
step("بررسی/ساخت دیتابیس D1...");
let dbId = config.d1_databases[0].database_id;
if (!dbId) {
  try {
    const list = JSON.parse(run("npx wrangler d1 list --json"));
    const existing = list.find((d) => d.name === d1Name);
    if (existing) dbId = existing.uuid;
  } catch {
    /* لیست fail شد، می‌ریم سراغ create */
  }
  if (!dbId) {
    try {
      const out = run(`npx wrangler d1 create ${d1Name}`);
      const m = out.match(/database_id\s*[=:]\s*"([^"]+)"/);
      if (!m) fail("نتونستم database_id رو از خروجی wrangler پیدا کنم:\n" + out);
      dbId = m[1];
    } catch (e) {
      const msg = e.stdout || e.stderr || e.message || "";
      if (msg.includes("already exists")) {
        const list = JSON.parse(run("npx wrangler d1 list --json"));
        const existing = list.find((d) => d.name === d1Name);
        if (existing) dbId = existing.uuid;
      }
      if (!dbId) fail("ساخت دیتابیس D1 fail شد:\n" + msg);
    }
  }
  config = readConfig();
  config.d1_databases[0].database_id = dbId;
  writeConfig(config);
}
ok(`دیتابیس آماده‌ست (id: ${dbId})`);

// ---- 4. migrations (idempotent — CREATE TABLE IF NOT EXISTS, safe to always re-run) ----
step("ساخت/به‌روزرسانی جداول دیتابیس...");
try {
  run(`npx wrangler d1 execute ${d1Name} --remote --file=./migrations/0001_init.sql`);
  run(`npx wrangler d1 execute ${d1Name} --remote --file=./migrations/0002_login_attempts.sql`);
} catch (e) {
  fail("اجرای migration ها fail شد:\n" + (e.stdout || e.stderr || e.message));
}
ok("جداول آماده‌ست");

// ---- 5. Workers KV namespace ----
step("بررسی/ساخت فضای فایل (Workers KV)...");
config = readConfig();
let kvId = config.kv_namespaces[0].id;
if (!kvId) {
  try {
    const list = JSON.parse(run("npx wrangler kv namespace list --json"));
    const existing = list.find((n) => n.title?.endsWith(kvBindingName));
    if (existing) kvId = existing.id;
  } catch {
    /* ignore, try create below */
  }
  if (!kvId) {
    try {
      const out = run(`npx wrangler kv namespace create ${kvBindingName}`);
      const m = out.match(/id\s*[=:]\s*"([^"]+)"/);
      if (!m) fail("نتونستم id فضای KV رو پیدا کنم:\n" + out);
      kvId = m[1];
    } catch (e) {
      fail("ساخت Workers KV fail شد:\n" + (e.stdout || e.stderr || e.message));
    }
  }
  config = readConfig();
  config.kv_namespaces[0].id = kvId;
  writeConfig(config);
}
ok(`فضای فایل آماده‌ست (id: ${kvId})`);

// ---- 6 & 7. build + deploy (Workers, via OpenNext) — always re-run, safe/idempotent ----
step("ساخت و دیپلوی سایت روی Cloudflare Workers...");
try {
  execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
} catch {
  fail("مرحله‌ی build (OpenNext) fail شد — پیام بالا رو برام بفرست.");
}
let deployOut;
try {
  deployOut = execSync("npx opennextjs-cloudflare deploy", { encoding: "utf8" });
  console.log(deployOut);
} catch (e) {
  fail("دیپلوی fail شد:\n" + (e.stdout || e.stderr || e.message));
}
const urlMatch = deployOut.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/);
const siteUrl = urlMatch?.[0];
ok("سایت دیپلوی شد" + (siteUrl ? `: ${siteUrl}` : ""));

// نکته: SITE_URL دیگه لازم نیست هیچ‌جا تنظیم بشه — robots.txt، sitemap.xml،
// و rss.xml خودشون آدرس واقعی رو از Host header همون درخواست تشخیص می‌دن
// (src/lib/site-url.ts)، چه روی *.workers.dev باشه چه روی دامنه‌ی شخصی.

// ---- 8. session secret (set AFTER deploy — a Worker secret needs the Worker to already exist) ----
step("تنظیم رمز امنیتی سایت...");
if (!state.secretSet) {
  const secret = randomBytes(32).toString("hex");
  try {
    execSync("npx wrangler secret put SESSION_SECRET", {
      input: secret + "\n",
      stdio: ["pipe", "inherit", "inherit"],
    });
  } catch {
    fail("تنظیم رمز امنیتی fail شد.");
  }
  state.secretSet = true;
  saveState(state);
  ok("رمز امنیتی تنظیم شد");
} else {
  ok("رمز امنیتی از قبل تنظیم شده — رد شدم");
}

// ---- 9. admin account (only if none exists yet) ----
step("بررسی اکانت ادمین...");
let hasAdmin = false;
try {
  const out = run(
    `npx wrangler d1 execute ${d1Name} --remote --command "SELECT COUNT(*) as c FROM users" --json`
  );
  const parsed = JSON.parse(out);
  const count = parsed?.[0]?.results?.[0]?.c ?? 0;
  hasAdmin = count > 0;
} catch {
  /* اگه نشد چک کنیم، فرض می‌کنیم هنوز ادمینی نیست */
}

let adminUsername = null;
if (hasAdmin) {
  ok("ادمین از قبل ساخته شده — رد شدم");
} else {
  console.log("حالا چندتا سوال برای ساخت اکانت ادمین ازت می‌پرسم:");
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  const username = (await ask("نام کاربری ادمین: ")).trim();
  const password = await ask("رمز عبور (حداقل ۱۰ کاراکتر): ");
  const displayNameRaw = (await ask("نام نمایشی (اختیاری): ")).trim();
  rl.close();
  const displayName = displayNameRaw || username;

  if (username.length < 3 || password.length < 10) {
    fail("نام کاربری حداقل ۳ کاراکتر و رمز حداقل ۱۰ کاراکتر باید باشه.");
  }

  // همون الگوریتم هش کردن پروژه (src/lib/crypto.ts) — PBKDF2 + salt تصادفی
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 210_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hash = `${toHex(salt.buffer)}:${toHex(derived)}`;

  const sql = `INSERT INTO users (username, password_hash, display_name) VALUES ('${username.replace(
    /'/g,
    "''"
  )}', '${hash}', '${displayName.replace(/'/g, "''")}');`;

  try {
    // execFileSync با آرگومان جدا (نه رشته‌ی شل) تا نیازی به escape کردن نباشه
    execFileSync("npx", ["wrangler", "d1", "execute", d1Name, "--remote", "--command", sql], {
      stdio: "inherit",
    });
  } catch {
    fail("ساخت ادمین fail شد — شاید این نام کاربری قبلاً وجود داره.");
  }
  adminUsername = username;
  ok("اکانت ادمین ساخته شد");
}

// ---- 10. done ----
console.log(`\n${BOLD}${GREEN}🎉 همه چیز تمومه!${RESET}`);
if (siteUrl) {
  console.log(`سایت: ${siteUrl}`);
  console.log(`پنل مدیریت: ${siteUrl}/admin/login`);
} else {
  console.log("سایتت دیپلوی شد — آدرسش رو توی خروجی بالا (خط workers.dev) پیدا کن.");
}
if (adminUsername) {
  console.log(`نام کاربری ادمین: ${adminUsername} (با همون رمزی که همین الان وارد کردی وارد شو)`);
}
