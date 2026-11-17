import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShelfList } from "@/components/ShelfList";
import { SHELVES } from "@/lib/tmdb/discover";

const movie = { id: 1, title: "Duna", posterPath: null, voteAverage: 7, releaseDate: null };

describe("ShelfList", () => {
  it("renders each shelf", () => {
    render(<ShelfList shelves={[{ shelf: SHELVES[0], movies: [movie] }]} />);
    expect(screen.getByRole("heading", { name: SHELVES[0].title })).toBeInTheDocument();
  });

  it("explains when no movies were found on the selected streamings", () => {
    render(<ShelfList shelves={[]} />);
    expect(
      screen.getByText("Nenhum filme encontrado nos streamings marcados. Tente marcar outros serviços."),
    ).toBeInTheDocument();
  });
});
