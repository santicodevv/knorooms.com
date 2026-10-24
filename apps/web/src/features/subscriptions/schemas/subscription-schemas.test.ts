import { describe, it, expect } from "vitest";
import { emptyPlan, planSchema, subscriptionSchema } from "./subscription-schemas";
describe("Condiciones comerciales", () => {
  const plan = { ...emptyPlan, code: "PILOT", name: "Piloto" };
  it("permite límites y precio sin definir", () =>
    expect(planSchema.safeParse(plan).success).toBe(true));
  it("rechaza límites negativos o fraccionarios", () => {
    for (const value of ["-1", "0", "1.5", "2147483648"])
      expect(planSchema.safeParse({ ...plan, maxActiveStudents: value }).success).toBe(false);
  });
  it("exige moneda para un precio explícito incluso cero", () => {
    expect(planSchema.safeParse({ ...plan, price: "0" }).success).toBe(false);
    expect(planSchema.safeParse({ ...plan, price: "0", currency: "DOP" }).success).toBe(true);
  });
  it("rechaza vigencias invertidas y motivos vacíos", () => {
    const data = {
      planVersionId: "123e4567-e89b-42d3-a456-426614174000",
      startsAtUtc: "2026-10-20T10:00",
      endsAtUtc: "2026-10-21T10:00",
      status: "Active",
      reason: "Contrato",
    };
    expect(subscriptionSchema.safeParse(data).success).toBe(true);
    expect(subscriptionSchema.safeParse({ ...data, endsAtUtc: data.startsAtUtc }).success).toBe(
      false,
    );
    expect(subscriptionSchema.safeParse({ ...data, reason: " " }).success).toBe(false);
  });
});
