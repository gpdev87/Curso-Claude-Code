import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "meus_streamings" ? { value: "netflix" } : undefined) }),
}));
vi.mock("@/lib/tmdb/discover", () => ({ getCategoryPage: vi.fn() }));

import { loadCategoryPage } from "@/app/categoria/actions";
import { getCategoryPage } from "@/lib/tmdb/discover";

const getPage = vi.mocked(getCategoryPage);

beforeEach(() => {
  getPage.mockReset();
  getPage.mockResolvedValue({ movies: [], hasMore: false });
});

describe("loadCategoryPage", () => {
  it("loads the next page for the category with my streamings", async () => {
    await loadCategoryPage("terror", "nota", 2);
    expect(getPage).toHaveBeenCalledWith(27, "nota", [8, 1796], 2);
  });

  it("loads all genres for todas", async () => {
    await loadCategoryPage("todas", "alta", 2);
    expect(getPage).toHaveBeenCalledWith(null, "alta", [8, 1796], 2);
  });

  it.each([
    ["xyz", "alta", 2],
    ["terror", "x", 2],
    ["terror", "alta", 1],
    ["terror", "alta", 0],
    ["terror", "alta", -1],
    ["terror", "alta", 501],
    ["terror", "alta", 2.5],
  ])("rejects %s / %s / page %s without calling TMDB", async (slug, order, page) => {
    await expect(loadCategoryPage(slug, order as "alta", page)).rejects.toThrow("Página inválida");
    expect(getPage).not.toHaveBeenCalled();
  });
});
