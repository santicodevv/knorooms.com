import { describe, it, expect } from "vitest";
import { buildGrowthChart } from "./dashboard-schemas";
import { readDirectoryFilters } from "./institution-management-schemas";
describe("Dashboard y navegación de instituciones", () => {
  it("representa un historial vacío sin coordenadas inválidas", () => {
    const chart = buildGrowthChart([], 6);
    expect(chart.points).toEqual([]);
    expect(chart.line).toBe("");
    expect(chart.ticks.every((t) => Number.isFinite(t.value))).toBe(true);
  });
  it("limita el gráfico al período elegido y conserva los totales reales", () => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      year: 2026,
      month: i + 1,
      total: i * 2,
    }));
    const chart = buildGrowthChart(months, 6);
    expect(chart.points).toHaveLength(6);
    expect(chart.points[0].month).toBe(7);
    expect(chart.points[5].total).toBe(22);
    expect(chart.ticks[0].value).toBeGreaterThanOrEqual(22);
    expect(chart.line).not.toContain("NaN");
  });
  it("conserva el filtro de colegios sin administrador activo", () => {
    expect(readDirectoryFilters({ administrator: "NotActive" }).administrator).toBe("NotActive");
  });
});
