const changed = Bun.spawnSync([
  "git",
  "diff",
  "--name-only",
  "--diff-filter=ACMR",
]).stdout;

const untracked = Bun.spawnSync([
  "git",
  "ls-files",
  "--others",
  "--exclude-standard",
]).stdout;

const staged = Bun.spawnSync([
  "git",
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
]).stdout;

const decoder = new TextDecoder();
const files =
  `${decoder.decode(changed)}\n${decoder.decode(staged)}\n${decoder.decode(untracked)}`
    .split(/\r?\n/)
    .filter((file) => /\.(ts|tsx)$/.test(file));

if (!files.length) {
  console.log("No modified TypeScript files to lint.");
  process.exit(0);
}

const result = Bun.spawnSync(["bun", "x", "eslint", ...files], {
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(result.exitCode);
