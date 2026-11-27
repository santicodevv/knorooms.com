import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const forbidden = /(^|\/)(\.(agents|codex|claude|impeccable)(\/|$)|(?:AGENTS|CLAUDE)\.md$)|\.(docx?|docm|dotx|dotm)$|^(output|tmp)(\/|$)|^nul$|(^|\/)\.env(?:\..+)?$|\.(pfx|pem|key)$/i;
const isForbidden = (path) => forbidden.test(path) && !/(^|\/)\.env\.example$/i.test(path);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

function inspect(ref) {
  const files = ref
    ? git("ls-tree", "-rz", "--name-only", ref)
    : git("ls-files", "-z");
  return files.split("\0").filter(Boolean).filter(isForbidden);
}

try {
  const refs = process.argv.includes("--push")
    ? readFileSync(0, "utf8").trim().split(/\r?\n/).filter(Boolean)
        .map((line) => line.split(/\s+/)[1]).filter((sha) => !/^0+$/.test(sha))
    : [undefined];
  const rejected = [...new Set(refs.flatMap(inspect))];
  if (rejected.length) {
    console.error("Publicación bloqueada: archivos locales o privados en Git:\n" + rejected.join("\n"));
    console.error("Retíralos del seguimiento con git rm --cached; conserva su copia local.");
    process.exitCode = 1;
  } else {
    console.log("Política de archivos: correcta.");
  }
} catch (error) {
  console.error("No se pudo verificar la política de archivos:", error.message);
  process.exitCode = 1;
}
