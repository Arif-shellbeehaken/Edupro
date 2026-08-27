#!/usr/bin/env node
/**
 * Lightweight smoke checks against a running Edupro instance.
 * Usage: BASE_URL=http://localhost:3000 node scripts/smoke.mjs
 */
const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const checks = [
  { name: "health", path: "/api/health", expect: 200 },
  { name: "home", path: "/", expect: [200, 307, 308] },
  { name: "login", path: "/login", expect: 200 },
  { name: "parent-login", path: "/parent/login", expect: 200 },
];

function okStatus(got, expect) {
  if (Array.isArray(expect)) return expect.includes(got);
  return got === expect;
}

async function run() {
  console.log(`Smoke → ${base}`);
  let failed = 0;
  for (const c of checks) {
    const url = base + c.path;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const pass = okStatus(res.status, c.expect);
      console.log(
        `${pass ? "✓" : "✗"} ${c.name} ${c.path} → ${res.status}`
      );
      if (!pass) failed += 1;
      if (c.name === "health" && res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log(`  status=${body.status} db=${body.checks?.database?.status}`);
      }
    } catch (e) {
      console.log(`✗ ${c.name} ${c.path} → ${e.message}`);
      failed += 1;
    }
  }
  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed");
}

run();
