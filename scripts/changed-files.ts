const decoder = new TextDecoder();

function output(command: string[]) {
  return decoder.decode(Bun.spawnSync(command).stdout);
}

export function getChangedTypeScriptFiles() {
  return [
    output(["git", "diff", "--name-only", "--diff-filter=ACMR"]),
    output(["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
    output(["git", "ls-files", "--others", "--exclude-standard"]),
  ]
    .join("\n")
    .split(/\r?\n/)
    .filter(
      (file, index, files) =>
        /\.(ts|tsx)$/.test(file) && files.indexOf(file) === index,
    );
}
