// Genera en Markdown el resumen de pruebas (y cobertura del frontend) para el job summary del CI.
// Uso:
//   node test-summary.mjs trx <directorio-con-trx>
//   node test-summary.mjs vitest <vitest-results.json> <coverage-summary.json>
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const [mode, ...args] = process.argv.slice(2);

function findFiles(dir, extension) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) return findFiles(fullPath, extension);
    return fullPath.endsWith(extension) ? [fullPath] : [];
  });
}

function statusIcon(failed) {
  return failed > 0 ? "❌" : "✅";
}

function summarizeTrx(dir) {
  const rows = findFiles(dir, ".trx").map((file) => {
    const xml = readFileSync(file, "utf8");
    const counters = xml.match(/<Counters\b[^>]*>/)?.[0] ?? "";
    const read = (name) =>
      Number(counters.match(new RegExp(`\\b${name}="(\\d+)"`))?.[1] ?? 0);
    const assembly =
      xml.match(/<TestMethod\b[^>]*\bcodeBase="([^"]+)"/)?.[1] ?? file;
    return {
      project: path
        .basename(assembly.replaceAll("\\", "/"))
        .replace(/\.dll$/i, ""),
      total: read("total"),
      passed: read("passed"),
      failed: read("failed"),
      skipped: read("notExecuted"),
    };
  });

  const lines = [
    "## Pruebas del backend (.NET)",
    "",
    "| Proyecto | Total | Correctas | Fallidas | Omitidas |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| ${statusIcon(row.failed)} ${row.project} | ${row.total} | ${row.passed} | ${row.failed} | ${row.skipped} |`,
    ),
  ];
  if (rows.length === 0) lines.push("", "No se encontraron archivos TRX.");
  return lines.join("\n");
}

function summarizeVitest(resultsFile, coverageFile) {
  const results = JSON.parse(readFileSync(resultsFile, "utf8"));
  const coverage = JSON.parse(readFileSync(coverageFile, "utf8")).total;
  const metric = (name) =>
    `${coverage[name].pct}% (${coverage[name].covered}/${coverage[name].total})`;

  return [
    "## Pruebas del frontend (Vitest)",
    "",
    "| Total | Correctas | Fallidas | Omitidas | Archivos |",
    "| ---: | ---: | ---: | ---: | ---: |",
    `| ${statusIcon(results.numFailedTests)} ${results.numTotalTests} | ${results.numPassedTests} | ${results.numFailedTests} | ${results.numPendingTests + results.numTodoTests} | ${results.testResults.length} |`,
    "",
    "### Cobertura del frontend (v8)",
    "",
    "| Líneas | Sentencias | Funciones | Ramas |",
    "| ---: | ---: | ---: | ---: |",
    `| ${metric("lines")} | ${metric("statements")} | ${metric("functions")} | ${metric("branches")} |`,
  ].join("\n");
}

if (mode === "trx") {
  console.log(summarizeTrx(args[0]));
} else if (mode === "vitest") {
  console.log(summarizeVitest(args[0], args[1]));
} else {
  console.error("Modo no reconocido. Usa 'trx' o 'vitest'.");
  process.exit(1);
}
