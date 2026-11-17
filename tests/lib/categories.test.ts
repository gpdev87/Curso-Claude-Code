import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryBySlug, categoryHref, parseOrder } from "@/lib/categories";

describe("CATEGORIES", () => {
  it("has Todas plus 19 TMDB genres, with unique slugs and ids", () => {
    expect(CATEGORIES).toHaveLength(20);
    expect(CATEGORIES[0]).toEqual({ slug: "todas", name: "Todas", genreId: null });
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(20);
    const ids = CATEGORIES.map((c) => c.genreId).filter((id) => id !== null);
    expect(new Set(ids).size).toBe(19);
  });
  it("lists the home page genres first", () => {
    expect(CATEGORIES.slice(1, 9).map((c) => c.slug)).toEqual([
      "comedia", "acao", "terror", "familia", "drama", "animacao", "romance", "ficcao-cientifica",
    ]);
  });
});

describe("categoryBySlug", () => {
  it("finds a category", () => {
    expect(categoryBySlug("ficcao-cientifica")?.genreId).toBe(878);
  });
  it("returns undefined for unknown slugs", () => {
    expect(categoryBySlug("xyz")).toBeUndefined();
  });
});

describe("parseOrder", () => {
  it("accepts only nota as the rating order", () => {
    expect(parseOrder("nota")).toBe("nota");
    expect(parseOrder(["nota", "x"])).toBe("nota");
    expect(parseOrder("abc")).toBe("alta");
    expect(parseOrder(undefined)).toBe("alta");
  });
});

describe("categoryHref", () => {
  it("adds ?ordem=nota only for the rating order", () => {
    expect(categoryHref("terror", "nota")).toBe("/categoria/terror?ordem=nota");
    expect(categoryHref("terror", "alta")).toBe("/categoria/terror");
  });
});
