import { getChangedTypeScriptFiles } from "./changed-files";

const files = getChangedTypeScriptFiles();

if (!files.length) {
  console.log("No modified TypeScript files to format.");
  process.exit(0);
}

const result = Bun.spawnSync(["bun", "x", "prettier", "--write", ...files], {
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(result.exitCode);
