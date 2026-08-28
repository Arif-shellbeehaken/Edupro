#!/usr/bin/env node
/**
 * Post-deploy verification beyond basic smoke.
 * Usage: BASE_URL=https://staging.example.com node scripts/post-deploy-check.mjs
 */
const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const paths = [
  { path: "/api/health", expect: [200, 503], json: true },
  { path: "/login", expect: [200] },
  { path: "/parent/login", expect: [200] },
  { path: "/s/demo", expect: [200, 404] },
  { path: "/p/demo", expect: [200, 404] },
];

async function main() {
  console.log(`Post-deploy checks → ${base}\n`);
  let fail = 0;
  for (const c of paths) {
    try {
      const res = await fetch(base + c.path, { redirect: "manual" });
      const ok = c.expect.includes(res.status);
      console.log(`${ok ? "✓" : "✗"} ${c.path} → ${res.status}`);
      if (c.json && res.ok) {
        const body = await res.json();
        console.log(
          `  status=${body.status} db=${body.checks?.database?.status} rl=${body.checks?.rateLimitBackend}`
        );
      }
      if (!ok) fail++;
    } catch (e) {
      console.log(`✗ ${c.path} → ${e.message}`);
      fail++;
    }
  }
  if (fail) {
    console.error(`\n${fail} failed`);
    process.exit(1);
  }
  console.log("\nPost-deploy checks passed");
}

main();
