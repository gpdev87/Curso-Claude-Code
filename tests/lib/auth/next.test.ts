import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/next";

describe("safeNext", () => {
  it("aceita caminhos internos", () => {
    expect(safeNext("/filme/1-x")).toBe("/filme/1-x");
    expect(safeNext("/minhas-listas?lista=visto")).toBe("/minhas-listas?lista=visto");
  });
  it("usa o primeiro valor de um array", () => {
    expect(safeNext(["/a", "/b"])).toBe("/a");
  });
  it("volta para / quando o valor é inseguro ou ausente", () => {
    for (const v of ["//evil.com", "https://evil.com", "/\\evil.com", "", undefined, null, "filme"]) {
      expect(safeNext(v)).toBe("/");
    }
  });
});
