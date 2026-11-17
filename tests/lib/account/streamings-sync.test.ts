import { describe, expect, it } from "vitest";
import { resolveStreamingsOnLogin } from "@/lib/account/streamings-sync";

describe("resolveStreamingsOnLogin", () => {
  it("a conta com itens vence o aparelho", () => {
    expect(resolveStreamingsOnLogin(["max"], ["netflix"])).toEqual({ cookie: ["max"], saveToAccount: null });
  });
  it("conta vazia ou nula leva os streamings do aparelho para a conta", () => {
    const expected = { cookie: ["netflix"], saveToAccount: ["netflix"] };
    expect(resolveStreamingsOnLogin(null, ["netflix"])).toEqual(expected);
    expect(resolveStreamingsOnLogin([], ["netflix"])).toEqual(expected);
  });
  it("ambos vazios não salva nada", () => {
    expect(resolveStreamingsOnLogin(null, [])).toEqual({ cookie: [], saveToAccount: null });
  });
});
