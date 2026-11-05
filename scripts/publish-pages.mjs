import { spawnSync } from "node:child_process";

// GitHub builds and publishes the committed master branch from this repository.
const result = spawnSync(
  "gh",
  [
    "workflow",
    "run",
    "ci.yml",
    "--repo",
    "DomEscobar/timeattendance",
    "--ref",
    "master",
  ],
  { stdio: "inherit", windowsHide: true },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Pages deployment started for master.");
console.log("Progress: https://github.com/DomEscobar/timeattendance/actions");
console.log("Website: https://domescobar.github.io/timeattendance/");
