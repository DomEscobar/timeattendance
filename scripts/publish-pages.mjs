import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = "https://github.com/DomEscobar/timeattendance-pages.git";
const website = "https://domescobar.github.io/timeattendance-pages/";
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this helper with npm run publish:pages.");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status}).`);
  return result.stdout;
}

// Publish the production output and an explicit allowlist of presentation assets.
run(process.execPath, [npmCli, "run", "build"], {
  env: { ...process.env, VITE_BASE_PATH: "/timeattendance-pages/" },
});
const checkout = mkdtempSync(join(root, ".pages-publish-"));
run("git", ["clone", repository, checkout]);
run("git", ["checkout", "-B", "main"], { cwd: checkout });
const files = run("git", ["ls-files", "-z"], {
  cwd: checkout,
  stdio: ["ignore", "pipe", "inherit"],
  encoding: "utf8",
});
for (const file of files.split("\0").filter(Boolean)) {
  const target = resolve(checkout, file);
  if (!target.startsWith(checkout + sep))
    throw new Error("Unsafe deployment path.");
  rmSync(target, { force: true });
}
cpSync(join(root, "dist"), checkout, { recursive: true });
writeFileSync(join(checkout, ".nojekyll"), "");
cpSync(join(root, "docs", "PUBLIC_README.md"), join(checkout, "README.md"));
const media = join(checkout, "media");
mkdirSync(media, { recursive: true });
for (const [source, name] of [
  ["docs/readme/cover.svg", "cover.svg"],
  ["docs/evidence/desktop-dashboard.png", "dashboard.png"],
  ["docs/evidence/mobile-viewport.png", "mobile.png"],
]) {
  cpSync(join(root, source), join(media, name));
}
run("git", ["add", "--all"], { cwd: checkout });
const changed = run("git", ["diff", "--cached", "--name-only"], {
  cwd: checkout,
  stdio: ["ignore", "pipe", "inherit"],
  encoding: "utf8",
});
if (changed.trim()) {
  const source = run("git", ["rev-parse", "--short", "HEAD"], {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
  }).trim();
  run("git", ["commit", "-m", `Publish simplezeit from ${source}`], {
    cwd: checkout,
  });
  run("git", ["push", "origin", "main"], { cwd: checkout });
} else {
  console.log("The published build is already up to date.");
}
console.log(`Build pushed. GitHub Pages publishes at ${website}`);
console.log(`Deployment checkout retained at ${checkout}`);
