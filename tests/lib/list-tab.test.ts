import { describe, expect, it } from "vitest";
import { parseListTab } from "@/lib/list-tab";

describe("parseListTab", () => {
  it("accepts visto only as the first exact value", () => {
    expect(parseListTab("visto")).toBe("visto");
    expect(parseListTab(["visto", "x"])).toBe("visto");
  });
  it("falls back to quero", () => {
    expect(parseListTab("abc")).toBe("quero");
    expect(parseListTab(undefined)).toBe("quero");
    expect(parseListTab(["x", "visto"])).toBe("quero");
  });
});
