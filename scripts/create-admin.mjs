#!/usr/bin/env node
// اجرا: node scripts/create-admin.mjs
// این اسکریپت رمز رو با همون الگوریتم پروژه (PBKDF2 + Web Crypto) هش می‌کنه
// و یک دستور SQL چاپ می‌کنه که خودت با wrangler روی D1 اجرا می‌کنی.
// هیچ رمزی جایی ذخیره یا ارسال نمیشه — همه‌چیز لوکاله.
//
// نکته: این اسکریپت مستقل و دستیه. برای راه‌اندازی خودکار کامل (که این
// مرحله رو هم شامل میشه)، از scripts/setup.mjs استفاده کن.

import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";

const crypto = webcrypto;
const PBKDF2_ITERATIONS = 100_000; // must match src/lib/crypto.ts — Cloudflare Workers caps PBKDF2 at 100,000

// اسم دیتابیس رو از wrangler.jsonc می‌خونیم، نه hardcode — تک‌منبع واقعیت همون فایله.
function getDbName() {
  try {
    // wrangler.jsonc ممکنه کامنت // داشته باشه؛ چون JSON.parse خام کامنت
    // رو نمی‌فهمه، قبلش با یه regex ساده حذفش می‌کنیم.
    const raw = readFileSync("wrangler.jsonc", "utf8").replace(/^(.*?)\/\/.*$/gm, "$1");
    const config = JSON.parse(raw);
    return config.d1_databases?.[0]?.database_name ?? "mini-cms-db";
  } catch {
    return "mini-cms-db";
  }
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${toHex(salt.buffer)}:${toHex(derived)}`;
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer)));
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  const username = (await ask(rl, "نام کاربری ادمین: ")).trim();
  const password = await ask(rl, "رمز عبور (حداقل ۱۰ کاراکتر): ");
  const displayNameRaw = (await ask(rl, "نام نمایشی (اختیاری): ")).trim();
  rl.close();

  const displayName = displayNameRaw || username;

  if (username.length < 3 || password.length < 10) {
    console.error("\n❌ نام کاربری حداقل ۳ کاراکتر و رمز حداقل ۱۰ کاراکتر باشه.");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const dbName = getDbName();
  const sql = `INSERT INTO users (username, password_hash, display_name) VALUES ('${username.replace(/'/g, "''")}', '${hash}', '${displayName.replace(/'/g, "''")}');`;

  console.log("\n✅ این دستور رو اجرا کن تا ادمین ساخته بشه:\n");
  console.log(`npx wrangler d1 execute ${dbName} --remote --command "${sql}"\n`);
  console.log("(برای تست لوکال از --local به‌جای --remote استفاده کن)");
}

main();
