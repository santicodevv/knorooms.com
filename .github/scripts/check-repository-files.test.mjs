import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./check-repository-files.mjs", import.meta.url));

test("bloquea archivos privados forzados al índice y permite su retirada", () => {
  const cwd = mkdtempSync(join(tmpdir(), "knorooms-git-policy-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
  const check = (...args) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
  git("init", "-q");
  const blocked = [".codex/agents/devops.toml", ".agents/skills/local.md", ".claude/settings.json",
    ".impeccable/config.json", "apps/web/AGENTS.md", "CLAUDE.md", "propuesta.DOCX", "tmp/cache.txt",
    "output/capture.png", ".env.local", "apps/web/.env", "private.pem"];
  const allowed = ["src/app.ts", ".env.example", "apps/web/.env.example", "docs/architecture.md"];
  for (const path of [...blocked, ...allowed]) {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), "ejemplo sin datos privados\n");
  }
  git("add", "--all");
  const rejected = check();
  assert.equal(rejected.status, 1);
  for (const path of blocked) assert.ok(rejected.stderr.includes(path), path);
  git("rm", "--cached", "--", ...blocked);
  assert.equal(check().status, 0);
  git("-c", "user.name=Prueba", "-c", "user.email=test@example.com", "commit", "-qm", "prueba");
  const sha = git("rev-parse", "HEAD").trim();
  const push = spawnSync(process.execPath, [script, "--push"], {
    cwd, encoding: "utf8", input: `refs/heads/main ${sha} refs/heads/main ${"0".repeat(40)}\n`,
  });
  assert.equal(push.status, 0);
  git("add", "--", blocked[0]);
  git("-c", "user.name=Prueba", "-c", "user.email=test@example.com", "commit", "-qm", "archivo prohibido");
  const badSha = git("rev-parse", "HEAD").trim();
  const rejectedPush = spawnSync(process.execPath, [script, "--push"], {
    cwd, encoding: "utf8", input: `refs/heads/main ${badSha} refs/heads/main ${sha}\n`,
  });
  assert.equal(rejectedPush.status, 1);
});
