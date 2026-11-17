import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CategoryGrid } from "@/components/CategoryGrid";
import type { MovieSummary } from "@/lib/tmdb/types";

vi.mock("@/app/categoria/actions", () => ({ loadCategoryPage: vi.fn() }));

const m = (id: number): MovieSummary => ({ id, title: `Filme ${id}`, posterPath: null, voteAverage: 7, releaseDate: null });

describe("CategoryGrid", () => {
  it("appends the next page without repeating movies", async () => {
    const load = vi.fn().mockResolvedValue({ movies: [m(2), m(3)], hasMore: true });
    render(<CategoryGrid slug="terror" order="nota" initialMovies={[m(1), m(2)]} initialHasMore streamings="netflix" load={load} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

    expect(load).toHaveBeenCalledWith("terror", "nota", 2, "netflix");
    expect(await screen.findByText("Filme 3")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("hides the button after the last page", async () => {
    const load = vi.fn().mockResolvedValue({ movies: [m(3)], hasMore: false });
    render(<CategoryGrid slug="terror" order="alta" initialMovies={[m(1)]} initialHasMore streamings="netflix" load={load} />);
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    await screen.findByText("Filme 3");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no button when there is a single page", () => {
    render(<CategoryGrid slug="terror" order="alta" initialMovies={[m(1)]} initialHasMore={false} streamings="netflix" load={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the movies and offers a retry when loading fails", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("TMDB fora")).mockResolvedValue({ movies: [m(9)], hasMore: false });
    render(<CategoryGrid slug="terror" order="alta" initialMovies={[m(1), m(2)]} initialHasMore streamings="netflix" load={load} />);

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    expect(screen.getAllByRole("link")).toHaveLength(2);

    await userEvent.click(retry);
    expect(load).toHaveBeenLastCalledWith("terror", "alta", 2, "netflix");
    expect(await screen.findByText("Filme 9")).toBeInTheDocument();
  });
});
